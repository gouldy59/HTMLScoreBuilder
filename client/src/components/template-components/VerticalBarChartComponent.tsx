import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';

interface VerticalBarChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function VerticalBarChartComponent({ 
  component, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  templateData = {} 
}: VerticalBarChartComponentProps) {
  const { content, style } = component;
  const verticalChartData = content.chartData || [];
  
  // Handle component click
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  };

  return (
    <div
      className="component-content w-full h-full overflow-hidden"
      style={{
        width: style.width || '400px',
        height: style.height || '300px',
        backgroundColor: content.chartBackgroundTransparent ? 'transparent' : (style.backgroundColor || '#ffffff'),
        padding: '24px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
      onClick={handleClick}
      data-chart-component="true"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {content.title || 'Performance Overview'}
        </h3>
        <p className="text-sm text-gray-600">
          {content.subtitle || 'Chart showing performance metrics'}
        </p>
      </div>
      
      <div className="flex items-end justify-center gap-8 h-64 relative flex-1">
        {verticalChartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No chart data available</p>
          </div>
        ) : verticalChartData.map((category: any, index: number) => {
          const maxHeight = 200; // Maximum height for columns
          const totalValue = category.segments ? category.segments.reduce((sum: number, seg: any) => sum + (seg.value || 0), 0) : 100;
          const columnHeight = Math.max(20, (totalValue / 100) * maxHeight);
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="flex flex-col justify-end" style={{ height: maxHeight, width: 48 }}>
                <div 
                  className="w-full bg-gray-100 rounded-t overflow-hidden flex flex-col-reverse" 
                  style={{ height: columnHeight }}
                >
                  {(category.segments || []).map((segment: any, segIndex: number) => {
                    const segmentHeight = (segment.value || 0) / totalValue * columnHeight;
                    return (
                      <div 
                        key={segIndex}
                        style={{ 
                          height: segmentHeight, 
                          backgroundColor: segment.color || '#3B82F6' 
                        }} 
                        title={`${segment.label}: ${segment.value || 0}%`}
                      />
                    );
                  })}
                </div>
              </div>
              <div 
                className="text-xs text-gray-700 mt-2 text-center font-medium" 
                style={{ maxWidth: 64, wordWrap: 'break-word' }}
              >
                {category.label || `Category ${index + 1}`}
              </div>
            </div>
          );
        })}
      </div>
      
      {!content.hideLegend && verticalChartData.length > 0 && verticalChartData[0]?.segments && (
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {(() => {
            const uniqueSegments = new Map();
            verticalChartData.forEach((category: any) => {
              if (category.segments) {
                category.segments.forEach((segment: any) => {
                  if (segment.label && !uniqueSegments.has(segment.label)) {
                    uniqueSegments.set(segment.label, segment.color || '#3B82F6');
                  }
                });
              }
            });
            return Array.from(uniqueSegments.entries()).map(([label, color]) => (
              <div key={label} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ));
          })()}
        </div>
      )}
      
      {isSelected && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            variant="destructive"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      )}
    </div>
  );
}