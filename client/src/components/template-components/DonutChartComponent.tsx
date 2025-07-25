import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface DonutChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function DonutChartComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: DonutChartComponentProps) {
  const { style, content } = component;

  // Sample donut data
  const donutData = [
    { label: 'Excellent', value: 45, color: '#10B981' },
    { label: 'Good', value: 30, color: '#3B82F6' },
    { label: 'Average', value: 20, color: '#F59E0B' },
    { label: 'Below Average', value: 5, color: '#EF4444' }
  ];

  const total = donutData.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const createPath = (centerX: number, centerY: number, startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const start = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    const end = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y, 
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

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
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Donut Chart'}</h3>
        <div className="flex items-center justify-center">
          <svg width="200" height="160" viewBox="0 0 200 160">
            {donutData.map((segment, index) => {
              const percentage = (segment.value / total) * 100;
              const angle = (segment.value / total) * 360;
              const path = createPath(100, 80, currentAngle, currentAngle + angle, 70, 35);
              currentAngle += angle;
              
              return (
                <path
                  key={index}
                  d={path}
                  fill={segment.color}
                  opacity="0.8"
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                />
              );
            })}
            
            {/* Center text */}
            <text x="100" y="75" textAnchor="middle" className="text-sm font-semibold fill-gray-700">
              Total
            </text>
            <text x="100" y="90" textAnchor="middle" className="text-lg font-bold fill-gray-800">
              {total}%
            </text>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {donutData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600">
                {item.label} ({item.value}%)
              </span>
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