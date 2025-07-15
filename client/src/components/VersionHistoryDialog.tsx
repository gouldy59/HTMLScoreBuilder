import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Template } from '@shared/schema';
import { Clock, GitBranch, RotateCcw, Plus } from 'lucide-react';

interface VersionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: number | null;
  onVersionRevert: (template: Template) => void;
}

export function VersionHistoryDialog({ isOpen, onClose, templateId, onVersionRevert }: VersionHistoryDialogProps) {
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch version history
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['/api/templates', templateId, 'history'],
    enabled: !!templateId && isOpen,
  });

  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async (data: { name: string; changeDescription?: string }) => {
      if (!templateId) throw new Error('No template ID');
      return apiRequest(`/api/templates/${templateId}/versions`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (newVersion) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setIsCreatingVersion(false);
      setVersionName('');
      setChangeDescription('');
      toast({ title: 'New version created successfully' });
      onVersionRevert(newVersion);
    },
    onError: () => {
      toast({ title: 'Failed to create version', variant: 'destructive' });
    },
  });

  // Revert to version mutation
  const revertMutation = useMutation({
    mutationFn: async (versionId: number) => {
      if (!templateId) throw new Error('No template ID');
      return apiRequest(`/api/templates/${templateId}/revert/${versionId}`, {
        method: 'POST',
      });
    },
    onSuccess: (revertedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates', templateId] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Successfully reverted to previous version' });
      onVersionRevert(revertedTemplate);
      onClose();
    },
    onError: () => {
      toast({ title: 'Failed to revert version', variant: 'destructive' });
    },
  });

  const handleCreateVersion = () => {
    if (!versionName.trim()) {
      toast({ title: 'Please enter a version name', variant: 'destructive' });
      return;
    }

    createVersionMutation.mutate({
      name: versionName.trim(),
      changeDescription: changeDescription.trim() || undefined,
    });
  };

  const handleRevert = (versionId: number, versionNumber: number) => {
    if (window.confirm(`Are you sure you want to revert to version ${versionNumber}? This will create a new version based on the selected one.`)) {
      revertMutation.mutate(versionId);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Template Version History
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Create New Version Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Create New Version</h3>
              <Button
                onClick={() => setIsCreatingVersion(!isCreatingVersion)}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Version
              </Button>
            </div>

            {isCreatingVersion && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="version-name">Version Name</Label>
                  <Input
                    id="version-name"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="e.g., Added new components"
                  />
                </div>
                <div>
                  <Label htmlFor="change-description">Description (Optional)</Label>
                  <Textarea
                    id="change-description"
                    value={changeDescription}
                    onChange={(e) => setChangeDescription(e.target.value)}
                    placeholder="Describe what changed in this version..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateVersion}
                    disabled={createVersionMutation.isPending || !versionName.trim()}
                  >
                    {createVersionMutation.isPending ? 'Creating...' : 'Create Version'}
                  </Button>
                  <Button
                    onClick={() => setIsCreatingVersion(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Version History */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Version History</h3>
            
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No versions found</div>
            ) : (
              <div className="space-y-3">
                {versions.map((version: Template) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{version.name}</h4>
                          <Badge variant={version.isLatest ? 'default' : 'secondary'}>
                            v{version.version}
                          </Badge>
                          {version.isLatest && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        {version.changeDescription && (
                          <p className="text-sm text-gray-600 mb-2">{version.changeDescription}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(version.createdAt)}
                          </span>
                          <span>{Array.isArray(version.components) ? version.components.length : 0} components</span>
                        </div>
                      </div>
                      
                      {!version.isLatest && (
                        <Button
                          onClick={() => handleRevert(version.id, version.version)}
                          disabled={revertMutation.isPending}
                          variant="outline"
                          size="sm"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Revert
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}