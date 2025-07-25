import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface NightingaleChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function NightingaleChartComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: NightingaleChartComponentProps) {
  const { style, content } = component;

  return (
    <div
      className={`relative cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        zIndex: isSelected ? 10 : 1,
      }}
    >
      <Card className="p-4" style={{ backgroundColor: style.backgroundColor, height: style.height }}>
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Nightingale Chart'}</h3>
        <div className="flex items-center justify-center h-48">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* Sample radial segments */}
            <path d="M 100 100 L 100 20 A 80 80 0 0 1 156.57 56.57 Z" fill="#3B82F6" opacity="0.8" />
            <path d="M 100 100 L 156.57 56.57 A 80 80 0 0 1 180 100 Z" fill="#10B981" opacity="0.8" />
            <path d="M 100 100 L 180 100 A 80 80 0 0 1 156.57 143.43 Z" fill="#F59E0B" opacity="0.8" />
            <path d="M 100 100 L 156.57 143.43 A 80 80 0 0 1 100 180 Z" fill="#EF4444" opacity="0.8" />
            <path d="M 100 100 L 100 180 A 80 80 0 0 1 43.43 143.43 Z" fill="#8B5CF6" opacity="0.8" />
            <path d="M 100 100 L 43.43 143.43 A 80 80 0 0 1 20 100 Z" fill="#06B6D4" opacity="0.8" />
            <path d="M 100 100 L 20 100 A 80 80 0 0 1 43.43 56.57 Z" fill="#84CC16" opacity="0.8" />
            <path d="M 100 100 L 43.43 56.57 A 80 80 0 0 1 100 20 Z" fill="#F97316" opacity="0.8" />
          </svg>
        </div>
        <div className="text-center text-sm text-gray-600">
          Radial area visualization
        </div>
      </Card>
      
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      )}
    </div>
  );
}