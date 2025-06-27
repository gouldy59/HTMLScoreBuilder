import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';

interface DividerComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
}

export function DividerComponent({ component, isSelected, onSelect, onDelete }: DividerComponentProps) {
  const { style } = component;

  return (
    <div
      className={`relative cursor-pointer transition-all group ${
        isSelected ? 'ring-2 ring-blue-500 rounded' : 'hover:ring-2 hover:ring-blue-300 hover:rounded'
      }`}
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

      <div
        style={{
          height: style.height || '1px',
          backgroundColor: style.backgroundColor || '#E5E7EB',
          margin: style.margin || '16px 0',
        }}
      />
    </div>
  );
}
