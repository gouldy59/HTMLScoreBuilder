import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Edit, Globe, EyeOff, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

interface Template {
  id: number;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  publishedAt?: string;
  components: any[];
}

interface TemplateFamilyVersionsDialogProps {
  familyId: number | null;
  familyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TemplateFamilyVersionsDialog({ 
  familyId, 
  familyName, 
  open, 
  onOpenChange 
}: TemplateFamilyVersionsDialogProps) {
  const [, setLocation] = useLocation();

  const { data: versions = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates', familyId, 'versions'],
    enabled: !!familyId && open,
  });

  const handleEdit = (template: Template) => {
    setLocation(`/builder?templateId=${template.id}`);
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Template Versions: {familyName}</span>
            <Badge variant="outline">{versions.length} versions</Badge>
          </DialogTitle>
          <DialogDescription>
            All versions of this template. Click Edit to open a specific version in the builder.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading versions...</div>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No versions found for this template.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((template) => (
                  <TableRow key={template.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono">
                      v{template.version}
                    </TableCell>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.isPublished ? "default" : "secondary"}>
                        {template.isPublished ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <FileText className="w-4 h-4" />
                        {template.components?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(template.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}