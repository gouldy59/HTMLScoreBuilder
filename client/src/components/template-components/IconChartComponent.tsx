import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface IconChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function IconChartComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: IconChartComponentProps) {
  const { style, content } = component;

  // Sample icon data
  const iconData = [
    { label: 'Students', count: 85, icon: '👨‍🎓', total: 100 },
    { label: 'Teachers', count: 12, icon: '👩‍🏫', total: 15 },
    { label: 'Courses', count: 24, icon: '📚', total: 30 },
    { label: 'Projects', count: 67, icon: '🎯', total: 80 }
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
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Icon Chart'}</h3>
        <div className="grid grid-cols-2 gap-4">
          {iconData.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-lg font-semibold text-gray-800">{item.count}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
              <div className="flex justify-center mt-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 mx-0.5 rounded-full ${
                      i < (item.count / item.total) * 10 ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
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