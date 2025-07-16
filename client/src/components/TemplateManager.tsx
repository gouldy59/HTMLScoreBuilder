import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Template } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: Template) => void;
}

export function TemplateManager({ isOpen, onClose, onLoadTemplate }: TemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template deleted successfully' });
      setSelectedTemplate(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete template', variant: 'destructive' });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: { name: string; description?: string }) => {
      const response = await apiRequest('POST', '/api/templates', {
        name: templateData.name,
        description: templateData.description,
        components: [],
        variables: {},
        styles: {},
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template created successfully' });
      setIsCreating(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
    },
    onError: () => {
      toast({ title: 'Failed to create template', variant: 'destructive' });
    },
  });

  const handleLoadTemplate = (template: Template) => {
    onLoadTemplate(template);
    onClose();
    toast({ title: `Template "${template.name}" loaded successfully` });
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;
    
    createTemplateMutation.mutate({
      name: newTemplateName,
      description: newTemplateDescription,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Template Manager</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Template List */}
          <div className="w-1/2 border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Saved Templates</h3>
              <Button
                onClick={() => setIsCreating(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <i className="fas fa-plus mr-1"></i>New
              </Button>
            </div>

            {isCreating && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Enter template name..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateDescription">Description (optional)</Label>
                    <Textarea
                      id="templateDescription"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="Enter description..."
                      className="h-20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateTemplate}
                      disabled={!newTemplateName.trim() || createTemplateMutation.isPending}
                      size="sm"
                    >
                      Create
                    </Button>
                    <Button
                      onClick={() => {
                        setIsCreating(false);
                        setNewTemplateName('');
                        setNewTemplateDescription('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {templates && templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-4">
                      <i className="fas fa-folder-open text-4xl text-gray-300"></i>
                    </div>
                    <p>No templates found</p>
                    <p className="text-sm">Create your first template to get started</p>
                  </div>
                ) : (
                  templates?.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border border-gray-200 rounded-lg cursor-pointer group transition-colors ${
                        selectedTemplate?.id === template.id ? 'border-blue-400 bg-blue-50' : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          {template.description && (
                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span>
                              Modified {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'Unknown'}
                            </span>
                            <span>
                              {Array.isArray(template.components) ? template.components.length : 0} components
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLoadTemplate(template);
                              }}
                              size="sm"
                              variant="outline"
                              title="Load Template"
                            >
                              <i className="fas fa-folder-open"></i>
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              title="Delete Template"
                              disabled={deleteTemplateMutation.isPending}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Template Preview */}
          <div className="w-1/2 p-6">
            <h3 className="font-medium text-gray-900 mb-4">Preview</h3>
            {selectedTemplate ? (
              <div>
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <div className="h-96 bg-gray-50 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <i className="fas fa-file-alt text-4xl mb-2"></i>
                      <p className="font-medium">{selectedTemplate.name}</p>
                      <p className="text-sm">
                        {Array.isArray(selectedTemplate.components) ? selectedTemplate.components.length : 0} components
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Template Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleLoadTemplate(selectedTemplate)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-folder-open mr-2"></i>Load Template
                  </Button>
                  <Button
                    onClick={() => {
                      // TODO: Implement duplicate functionality
                      toast({ title: 'Duplicate functionality coming soon' });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <i className="fas fa-copy mr-2"></i>Duplicate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <i className="fas fa-file-alt text-4xl mb-2"></i>
                  <p className="font-medium">Select a template to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
