import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Calendar, FileText, Eye, Edit, History, Globe, EyeOff, Clock, FolderOpen } from 'lucide-react';
import { useLocation } from 'wouter';
import { TemplateVersionHistory } from './TemplateVersionHistory';
import { AuditHistoryDialog } from './AuditHistoryDialog';
import { TemplateFamilyVersionsDialog } from './TemplateFamilyVersionsDialog';

interface TemplateFamily {
  familyId: number;
  name: string;
  description: string;
  totalVersions: number;
  latestVersion: any;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  publishedAt?: string;
}

export function TemplateManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFamily, setSelectedFamily] = useState<TemplateFamily | null>(null);
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [, setLocation] = useLocation();
  const itemsPerPage = 10;

  const { data: templateFamilies = [], isLoading, error } = useQuery<TemplateFamily[]>({
    queryKey: ['/api/template-families'],
  });

  // Debug logging
  console.log('TemplateManager render:', { 
    templateFamilies, 
    isLoading, 
    error,
    filteredFamilies: templateFamilies.length 
  });

  // Filter template families based on search term
  const filteredFamilies = templateFamilies.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (family.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered families
  const totalPages = Math.ceil(filteredFamilies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFamilies = filteredFamilies.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (family: TemplateFamily) => {
    setLocation(`/builder?templateId=${family.latestVersion.id}`);
  };

  const handleViewVersions = (family: TemplateFamily) => {
    setSelectedFamily(family);
    setShowVersionsDialog(true);
  };

  const handleViewVersionHistory = (family: TemplateFamily) => {
    setSelectedFamily(family);
    setShowVersionHistory(true);
  };

  const handleViewAuditHistory = (family: TemplateFamily) => {
    setSelectedFamily(family);
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

  if (showVersionHistory && selectedFamily) {
    return (
      <TemplateVersionHistory
        template={selectedFamily.latestVersion}
        onBack={() => {
          setShowVersionHistory(false);
          setSelectedFamily(null);
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
            Showing {paginatedFamilies.length} of {filteredFamilies.length} template families
          </p>
          <Badge variant="outline">
            Total: {templateFamilies.length}
          </Badge>
        </div>

        {/* Templates Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading templates...</div>
          </div>
        ) : paginatedFamilies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No template families found</p>
            <p className="text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
            </p>
            <p className="text-xs mt-2 text-gray-400">
              Debug: Found {templateFamilies.length} families, filtered to {filteredFamilies.length}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFamilies.map((family) => (
                  <TableRow 
                    key={family.familyId} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewVersions(family)}
                  >
                    <TableCell className="font-medium">{family.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{family.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FolderOpen className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{family.totalVersions}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {family.latestVersion?.components?.length || 0} components
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={family.isPublished ? "default" : "secondary"}>
                        {family.isPublished ? (
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
                      {formatDate(family.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewVersionHistory(family)}
                          title="View version history"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAuditHistory(family)}
                          title="View audit history"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(family)}
                          title="Edit latest version"
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
      
      {/* Dialogs */}
      <TemplateFamilyVersionsDialog
        familyId={selectedFamily?.familyId || null}
        familyName={selectedFamily?.name || ''}
        open={showVersionsDialog}
        onOpenChange={setShowVersionsDialog}
      />
      
      <AuditHistoryDialog
        isOpen={showAuditHistory}
        onClose={() => setShowAuditHistory(false)}
        templateId={selectedFamily?.latestVersion?.id || null}
      />
    </Card>
  );
}