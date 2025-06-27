import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';

interface SpacerComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
}

export function SpacerComponent({ component, isSelected, onSelect, onDelete }: SpacerComponentProps) {
  const { style } = component;

  return (
    <div
      className={`relative cursor-pointer transition-all group flex items-center justify-center ${
        isSelected ? 'ring-2 ring-blue-500 rounded' : 'hover:ring-2 hover:ring-blue-300 hover:rounded'
      }`}
      style={{
        height: style.height || '32px',
      }}
      onClick={onSelect}
    >
      {/* Action buttons */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="w-6 h-6 p-0 bg-white border border-gray-300 hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <i className="fas fa-cog text-xs"></i>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-6 h-6 p-0 bg-white border border-gray-300 hover:bg-gray-50 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <i className="fas fa-trash text-xs"></i>
          </Button>
        </div>
      </div>

      <div className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
        Spacer ({style.height || '32px'})
      </div>
    </div>
  );
}
