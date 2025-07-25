import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface BubbleChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function BubbleChartComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: BubbleChartComponentProps) {
  const { style, content } = component;

  // Sample bubble data
  const bubbles = [
    { x: 20, y: 30, size: 40, label: 'Math', color: '#3B82F6' },
    { x: 60, y: 20, size: 50, label: 'Science', color: '#10B981' },
    { x: 35, y: 60, size: 35, label: 'English', color: '#F59E0B' },
    { x: 75, y: 55, size: 45, label: 'History', color: '#EF4444' },
    { x: 50, y: 40, size: 30, label: 'Art', color: '#8B5CF6' }
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
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Bubble Chart'}</h3>
        <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Bubbles */}
            {bubbles.map((bubble, index) => (
              <g key={index}>
                <circle
                  cx={bubble.x}
                  cy={bubble.y}
                  r={bubble.size / 8}
                  fill={bubble.color}
                  opacity="0.7"
                  className="hover:opacity-90 transition-opacity cursor-pointer"
                />
                <text
                  x={bubble.x}
                  y={bubble.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-white"
                  style={{ fontSize: '3px' }}
                >
                  {bubble.label}
                </text>
              </g>
            ))}
          </svg>
          
          {/* Axis labels */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
            Performance Score
          </div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-500 origin-center">
            Difficulty Level
          </div>
        </div>
        <div className="text-center text-sm text-gray-600 mt-2">
          Size represents effort required
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