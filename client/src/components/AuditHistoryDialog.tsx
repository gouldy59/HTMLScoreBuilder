import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText, GitBranch, Globe, EyeOff, Edit, Plus } from 'lucide-react';
import { AuditLog } from '@shared/schema';

interface AuditHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: number | null;
}

export function AuditHistoryDialog({ isOpen, onClose, templateId }: AuditHistoryDialogProps) {
  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/templates', templateId, 'audit'],
    enabled: !!templateId && isOpen,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'version_created':
        return <GitBranch className="w-4 h-4 text-purple-600" />;
      case 'publish':
        return <Globe className="w-4 h-4 text-green-600" />;
      case 'unpublish':
        return <EyeOff className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'version_created':
        return 'bg-purple-100 text-purple-800';
      case 'publish':
        return 'bg-green-100 text-green-800';
      case 'unpublish':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'version_created':
        return 'Version Created';
      case 'publish':
        return 'Published';
      case 'unpublish':
        return 'Unpublished';
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Audit History - Template {templateId}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading audit history...</div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No audit history found</p>
              <p className="text-sm">This template has no recorded changes yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getActionIcon(log.action)}
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {getActionLabel(log.action)}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {formatDate(log.timestamp)}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </div>
                  </CardHeader>
                  {log.changeDescription && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600">{log.changeDescription}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}