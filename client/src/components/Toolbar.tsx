import { Button } from '@/components/ui/button';
import { GitBranch } from 'lucide-react';

interface ToolbarProps {
  templateName: string;
  onPreview: () => void;
  onExportHTML: () => void;
  onImportData: () => void;
  onVersionHistory: () => void;
  onGeneratePDF: () => void;
  onGenerateImage: () => void;
}

export function Toolbar({ templateName, onPreview, onExportHTML, onImportData, onVersionHistory, onGeneratePDF, onGenerateImage }: ToolbarProps) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold text-gray-900">Score Report Template</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{templateName || 'Untitled Template'}</span>
          <span>•</span>
          <span>Last saved 2 min ago</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Device Preview Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button className="px-3 py-1 text-sm font-medium bg-white text-gray-900 rounded-md shadow-sm">
            <i className="fas fa-desktop mr-1"></i>Desktop
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
            <i className="fas fa-tablet-alt mr-1"></i>Tablet
          </button>
          <button className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
            <i className="fas fa-mobile-alt mr-1"></i>Mobile
          </button>
        </div>

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
