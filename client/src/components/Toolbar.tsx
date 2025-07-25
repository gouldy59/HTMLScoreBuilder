import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Home, Edit3, Globe, EyeOff } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';

interface ToolbarProps {
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  onPreview: () => void;
  onExportHTML: () => void;
  onImportData: () => void;
  onVersionHistory: () => void;
  onGeneratePDF: () => void;
  onGenerateImage: () => void;
  isPublished?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  currentTemplateId?: number | null;
}

export function Toolbar({ templateName, onTemplateNameChange, onPreview, onExportHTML, onImportData, onVersionHistory, onGeneratePDF, onGenerateImage, isPublished, onPublish, onUnpublish, currentTemplateId }: ToolbarProps) {
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(templateName);

  // Update editValue when templateName changes (e.g., when loading a template)
  useEffect(() => {
    setEditValue(templateName);
  }, [templateName]);

  const handleGoHome = () => {
    setLocation('/');
  };

  const handleEditClick = () => {
    setEditValue(templateName);
    setIsEditing(true);
  };

  const handleSaveName = () => {
    onTemplateNameChange(editValue.trim() || 'Untitled Template');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditValue(templateName);
      setIsEditing(false);
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleGoHome} className="text-gray-600 hover:text-gray-900">
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="flex items-center gap-2 text-sm">
          {isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyPress}
              className="h-8 w-48 text-sm"
              placeholder="Enter template name..."
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-medium">{templateName || 'Untitled Template'}</span>
              {currentTemplateId && (
                <Badge variant={isPublished ? "default" : "secondary"} className="ml-2">
                  {isPublished ? (
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
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            </div>
          )}
          <span className="text-gray-500">•</span>
          <span className="text-gray-500">Last saved 2 min ago</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Action Buttons */}
        <Button onClick={onImportData} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
          <i className="fas fa-file-import mr-2"></i>Import Data
        </Button>
        <Button onClick={onVersionHistory} variant="outline">
          <GitBranch className="w-4 h-4 mr-2" />
          Versions
        </Button>
        <Button onClick={onPreview} variant="outline">
          <i className="fas fa-eye mr-2"></i>Preview
        </Button>
        
        {/* Publish/Unpublish Buttons */}
        {currentTemplateId && (
          <>
            {isPublished ? (
              <Button 
                onClick={onUnpublish} 
                variant="outline" 
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Unpublish
              </Button>
            ) : (
              <Button 
                onClick={onPublish} 
                variant="outline" 
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <Globe className="w-4 h-4 mr-2" />
                Publish
              </Button>
            )}
          </>
        )}
        
        <Button onClick={onGeneratePDF} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
          <i className="fas fa-file-pdf mr-2"></i>Generate PDF
        </Button>
        <Button onClick={onGenerateImage} variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
          <i className="fas fa-image mr-2"></i>Generate Image
        </Button>
        <Button onClick={onExportHTML} className="bg-green-600 hover:bg-green-700">
          <i className="fas fa-download mr-2"></i>Export HTML
        </Button>
      </div>
    </div>
  );
}
