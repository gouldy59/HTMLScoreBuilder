import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface WordCloudComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function WordCloudComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: WordCloudComponentProps) {
  const { style, content } = component;

  // Sample word cloud data
  const words = [
    { text: 'Excellence', size: 24, color: '#3B82F6' },
    { text: 'Achievement', size: 20, color: '#10B981' },
    { text: 'Performance', size: 18, color: '#F59E0B' },
    { text: 'Success', size: 22, color: '#EF4444' },
    { text: 'Growth', size: 16, color: '#8B5CF6' },
    { text: 'Learning', size: 19, color: '#06B6D4' },
    { text: 'Skills', size: 15, color: '#84CC16' },
    { text: 'Progress', size: 17, color: '#F97316' },
    { text: 'Knowledge', size: 14, color: '#6B7280' },
    { text: 'Improvement', size: 13, color: '#EF4444' }
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
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Word Cloud'}</h3>
        <div className="flex flex-wrap items-center justify-center gap-2 h-48 overflow-hidden">
          {words.map((word, index) => (
            <span
              key={index}
              className="font-semibold hover:opacity-80 cursor-pointer transition-opacity"
              style={{
                fontSize: `${word.size}px`,
                color: word.color,
                transform: `rotate(${Math.random() * 40 - 20}deg)`,
                margin: '2px'
              }}
            >
              {word.text}
            </span>
          ))}
        </div>
        <div className="text-center text-sm text-gray-600 mt-2">
          Key performance indicators
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