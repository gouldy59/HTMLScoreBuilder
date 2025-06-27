import { Button } from '@/components/ui/button';

interface ToolbarProps {
  templateName: string;
  selectedComponentIds: string[];
  isMultiSelectMode: boolean;
  onPreview: () => void;
  onExportHTML: () => void;
  onToggleMultiSelect: () => void;
  onGroupComponents: () => void;
}

export function Toolbar({ 
  templateName, 
  selectedComponentIds, 
  isMultiSelectMode, 
  onPreview, 
  onExportHTML, 
  onToggleMultiSelect, 
  onGroupComponents 
}: ToolbarProps) {
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
        {/* Multi-select and Grouping Controls */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
          <Button 
            onClick={onToggleMultiSelect}
            variant={isMultiSelectMode ? "default" : "outline"}
            size="sm"
            className={isMultiSelectMode ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <i className="fas fa-mouse-pointer mr-2"></i>
            {isMultiSelectMode ? 'Exit Select' : 'Multi-Select'}
          </Button>
          
          {selectedComponentIds && selectedComponentIds.length >= 2 && (
            <Button 
              onClick={onGroupComponents}
              variant="outline"
              size="sm"
              className="text-purple-600 hover:text-purple-700 border-purple-300 hover:border-purple-400"
            >
              <i className="fas fa-layer-group mr-2"></i>
              Group ({selectedComponentIds.length})
            </Button>
          )}
        </div>

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
        <Button onClick={onPreview} variant="outline">
          <i className="fas fa-eye mr-2"></i>Preview
        </Button>
        <Button onClick={onExportHTML} className="bg-green-600 hover:bg-green-700">
          <i className="fas fa-download mr-2"></i>Export HTML
        </Button>
      </div>
    </div>
  );
}
