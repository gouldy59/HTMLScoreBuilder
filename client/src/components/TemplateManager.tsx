import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Calendar, FileText, Eye, Edit, History, Globe, EyeOff, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { TemplateVersionHistory } from './TemplateVersionHistory';
import { AuditHistoryDialog } from './AuditHistoryDialog';

interface Template {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  components: any[];
  isPublished?: boolean;
  publishedAt?: string;
}

export function TemplateManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [, setLocation] = useLocation();
  const itemsPerPage = 10;

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered templates
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (template: Template) => {
    setLocation(`/builder?templateId=${template.id}`);
  };

  const handleViewVersionHistory = (template: Template) => {
    setSelectedTemplate(template);
    setShowVersionHistory(true);
  };

  const handleViewAuditHistory = (template: Template) => {
    setSelectedTemplate(template);
    setShowAuditHistory(true);
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

  if (showVersionHistory && selectedTemplate) {
    return (
      <TemplateVersionHistory
        template={selectedTemplate}
        onBack={() => {
          setShowVersionHistory(false);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Template Library
        </CardTitle>
        <CardDescription>
          Manage and organize your score report templates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates by name or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="pl-10"
          />
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {paginatedTemplates.length} of {filteredTemplates.length} templates
          </p>
          <Badge variant="outline">
            Total: {templates.length}
          </Badge>
        </div>

        {/* Templates Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading templates...</div>
          </div>
        ) : paginatedTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {template.components?.length || 0} components
                      </Badge>
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
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(template.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(template.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewVersionHistory(template)}
                          title="View version history"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAuditHistory(template)}
                          title="View audit history"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          title="Edit template"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Audit History Dialog */}
      <AuditHistoryDialog
        isOpen={showAuditHistory}
        onClose={() => {
          setShowAuditHistory(false);
          setSelectedTemplate(null);
        }}
        templateId={selectedTemplate?.id || null}
      />
    </Card>
  );
}