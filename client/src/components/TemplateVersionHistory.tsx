import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, FileText, Edit, Download, Eye } from 'lucide-react';
import { useLocation } from 'wouter';

interface Template {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  components: any[];
}

interface TemplateVersion {
  id: number;
  template_id: number;
  version_number: number;
  name: string;
  description: string;
  components: any[];
  created_at: string;
  created_by?: string;
  change_summary?: string;
}

interface TemplateVersionHistoryProps {
  template: Template;
  onBack: () => void;
}

export function TemplateVersionHistory({ template, onBack }: TemplateVersionHistoryProps) {
  const [, setLocation] = useLocation();

  // For now, we'll create mock version data since we don't have versioning implemented yet
  const mockVersions: TemplateVersion[] = [
    {
      id: template?.id || 0,
      template_id: template?.id || 0,
      version_number: 1,
      name: template?.name || 'Unknown Template',
      description: template?.description || '',
      components: template?.components || [],
      created_at: template?.createdAt || new Date().toISOString(),
      created_by: 'Current User',
      change_summary: 'Initial version'
    }
  ];

  const { data: versions = mockVersions, isLoading } = useQuery<TemplateVersion[]>({
    queryKey: ['/api/templates', template?.id, 'versions'],
    enabled: false // Disable for now since we don't have the API endpoint
  });

  const handleEditVersion = (version: TemplateVersion) => {
    setLocation(`/builder?templateId=${template?.id}&versionId=${version.id}`);
  };

  const handlePreviewVersion = (version: TemplateVersion) => {
    // Implement preview functionality
    console.log('Preview version:', version);
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Version History: {template.name}
            </CardTitle>
            <CardDescription>
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">Template ID</p>
            <p className="text-sm text-gray-500">#{template.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Components</p>
            <p className="text-sm text-gray-500">{template.components?.length || 0} components</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Last Updated</p>
            <p className="text-sm text-gray-500">{formatDate(template?.updatedAt || new Date().toISOString())}</p>
          </div>
        </div>

        {/* Version History Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading version history...</div>
          </div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No version history</p>
            <p className="text-sm">This template has no recorded versions</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Change Summary</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={`version-${version.id}`}>
                    <TableCell>
                      <Badge variant={version.version_number === 1 ? 'default' : 'secondary'}>
                        v{version.version_number}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{version.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {version.change_summary || 'No summary provided'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {version.created_by || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(version.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {version.components?.length || 0} components
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewVersion(version)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditVersion(version)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            {versions.length} version{versions.length !== 1 ? 's' : ''} found
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleEditVersion(versions[0])}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Latest Version
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}