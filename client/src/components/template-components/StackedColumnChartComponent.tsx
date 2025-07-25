import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface StackedColumnChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function StackedColumnChartComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: StackedColumnChartComponentProps) {
  const { style, content } = component;

  // Sample stacked data
  const stackedData = [
    { category: 'Q1', values: [25, 35, 15, 25], colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] },
    { category: 'Q2', values: [30, 25, 20, 25], colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] },
    { category: 'Q3', values: [20, 40, 25, 15], colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] },
    { category: 'Q4', values: [35, 30, 10, 25], colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'] }
  ];

  const maxTotal = Math.max(...stackedData.map(d => d.values.reduce((a, b) => a + b, 0)));

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
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Stacked Column Chart'}</h3>
        <div className="h-48 flex items-end justify-center gap-4 bg-gray-50 rounded-lg p-4">
          {stackedData.map((column, index) => {
            const total = column.values.reduce((a, b) => a + b, 0);
            const height = (total / maxTotal) * 160;
            let currentHeight = 0;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div className="flex flex-col-reverse" style={{ height: '160px' }}>
                  <div className="w-12 flex flex-col">
                    {column.values.map((value, valueIndex) => {
                      const segmentHeight = (value / total) * height;
                      currentHeight += segmentHeight;
                      return (
                        <div
                          key={valueIndex}
                          className="flex items-center justify-center text-xs text-white font-medium"
                          style={{
                            height: `${segmentHeight}px`,
                            backgroundColor: column.colors[valueIndex],
                            minHeight: '8px'
                          }}
                        >
                          {value > 5 ? value : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 font-medium">
                  {column.category}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {['Series A', 'Series B', 'Series C', 'Series D'].map((series, index) => (
            <div key={index} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index] }}
              />
              <span className="text-xs text-gray-600">{series}</span>
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