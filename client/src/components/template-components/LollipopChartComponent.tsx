import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface LollipopChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function LollipopChartComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: LollipopChartComponentProps) {
  const { style, content } = component;

  // Sample data for preview
  const sampleData = [
    { label: 'Math', value: 85 },
    { label: 'Science', value: 92 },
    { label: 'English', value: 78 },
    { label: 'History', value: 88 },
    { label: 'Art', value: 95 }
  ];

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
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Lollipop Chart'}</h3>
        <div className="space-y-3">
          {sampleData.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm font-medium text-gray-700">{item.label}</div>
              <div className="flex-1 flex items-center">
                <div 
                  className="h-0.5 bg-blue-400"
                  style={{ width: `${(item.value / 100) * 200}px` }}
                />
                <div 
                  className="w-3 h-3 rounded-full bg-blue-600 -ml-1.5"
                  title={`${item.value}%`}
                />
                <span className="ml-2 text-sm text-gray-600">{item.value}%</span>
              </div>
            </div>
          ))}
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