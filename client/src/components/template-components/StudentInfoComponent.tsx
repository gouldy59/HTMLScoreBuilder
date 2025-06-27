import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';

interface StudentInfoComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
}

export function StudentInfoComponent({ component, isSelected, onSelect, onDelete }: StudentInfoComponentProps) {
  const { content, style } = component;
  const fields = content.fields || {};

  return (
    <div
      className={`relative p-6 rounded-lg cursor-pointer transition-all group ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
      style={{
        backgroundColor: style.backgroundColor || '#F0FDF4',
        color: style.textColor || '#1F2937',
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

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(fields).map(([key, value]) => (
          <div key={key}>
            <label className="text-sm font-medium opacity-70">{key}:</label>
            <p className="font-semibold">{String(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
