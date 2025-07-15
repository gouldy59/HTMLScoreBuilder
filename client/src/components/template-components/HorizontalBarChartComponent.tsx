import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';

interface HorizontalBarChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
}

export function HorizontalBarChartComponent({ component, isSelected, onSelect, onDelete }: HorizontalBarChartComponentProps) {
  const { content, style } = component;
  
  // Default placeholder data
  const defaultData = [
    {
      label: "Category A",
      scoreValue: 65,
      segments: [
        { value: 25, color: "#FDE2E7", label: "0%-25%" },
        { value: 25, color: "#FB923C", label: "26%-50%" },
        { value: 25, color: "#FEF3C7", label: "51%-75%" },
        { value: 25, color: "#D1FAE5", label: "76%-100%" }
      ]
    },
    {
      label: "Category B",
      scoreValue: 78,
      segments: [
        { value: 25, color: "#FDE2E7", label: "0%-25%" },
        { value: 25, color: "#FB923C", label: "26%-50%" },
        { value: 25, color: "#FEF3C7", label: "51%-75%" },
        { value: 25, color: "#D1FAE5", label: "76%-100%" }
      ]
    },
    {
      label: "Category C",
      scoreValue: 42,
      segments: [
        { value: 25, color: "#FDE2E7", label: "0%-25%" },
        { value: 25, color: "#FB923C", label: "26%-50%" },
        { value: 25, color: "#86EFAC", label: "51%-75%" },
        { value: 25, color: "#D1FAE5", label: "76%-100%" }
      ]
    }
  ];

  const chartData = content.chartData || defaultData;
  const title = content.title || "Chart Title";
  const subtitle = content.subtitle || "Add your chart description here";
  const showPercentages = content.showPercentages !== false; // Default to true

  return (
    <div
      className={`relative p-4 rounded-lg cursor-pointer transition-all group ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
      style={{
        backgroundColor: style?.backgroundColor || '#ffffff',
        color: style?.textColor || '#1F2937',
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

      <div className="w-full">
        {/* Chart Header */}
        <div className="mb-4">
          <h3 className={`font-semibold mb-1 ${
            style?.fontSize === 'small' ? 'text-sm' :
            style?.fontSize === 'large' ? 'text-xl' :
            style?.fontSize === 'xl' ? 'text-2xl' : 'text-lg'
          }`}>{title}</h3>
          <p className="text-sm opacity-80">{subtitle}</p>
        </div>

        {/* Percentage Scale */}
        <div className="relative text-xs opacity-70 mb-2" style={{ marginLeft: '80px', marginRight: '48px' }}>
          <span className="absolute" style={{ left: '0%' }}>0%</span>
          <span className="absolute" style={{ left: '25%', transform: 'translateX(-50%)' }}>25%</span>
          <span className="absolute" style={{ left: '50%', transform: 'translateX(-50%)' }}>50%</span>
          <span className="absolute" style={{ left: '75%', transform: 'translateX(-50%)' }}>75%</span>
          <span className="absolute" style={{ left: '100%', transform: 'translateX(-100%)' }}>100%</span>
        </div>

        {/* Chart Bars */}
        <div className="space-y-2">
          {chartData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-chart-bar text-2xl mb-2 block"></i>
              <p className="text-sm">No chart data available</p>
              <p className="text-xs">Select this component and add categories in the properties panel</p>
            </div>
          ) : (
            chartData.map((item: any, index: number) => (
              <div key={index} className="flex items-center">
                {/* Label */}
                <div className="w-20 text-xs pr-2 flex-shrink-0 font-medium truncate" title={item.label}>
                  {item.label || `Category ${index + 1}`}
                </div>
                
                {/* Bar Container */}
                <div className="flex-1 relative min-w-0">
                  <div className="flex h-5 bg-gray-100 rounded overflow-hidden relative">
                    {(item.segments || []).map((segment: any, segIndex: number) => {
                      const segmentValue = segment.value || 0;
                      return (
                        <div
                          key={segIndex}
                          className="flex items-center justify-center text-xs font-medium transition-all hover:opacity-80"
                          style={{
                            width: `${segmentValue}%`,
                            backgroundColor: segment.color || '#E5E7EB',
                            ...(segIndex > 0 && { borderLeft: '1px solid #fff' })
                          }}
                          title={`${segment.label}: ${segmentValue}%`}
                        >
                          {showPercentages && segmentValue > 10 && (
                            <span className="text-gray-800 text-xs font-medium">
                              {segmentValue}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Score Pointer */}
                    {item.scoreValue !== undefined && item.scoreValue !== null && (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md z-10"
                        style={{ left: `calc(${Math.min(Math.max(item.scoreValue || 0, 0), 100)}% - 6px)` }}
                        title={`Score: ${item.scoreValue}%`}
                      ></div>
                    )}
                  </div>
                  
                  {/* Score Value Display */}
                  {item.scoreValue !== undefined && item.scoreValue !== null && (
                    <div className="absolute -right-12 top-0 bottom-0 flex items-center">
                      <span className="text-xs font-bold text-red-600 bg-white px-1 py-0.5 rounded shadow-sm border">
                        {item.scoreValue}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center mt-4 space-x-4 flex-wrap">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-pink-100 rounded"></div>
            <span className="text-xs opacity-80">0%-25%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <span className="text-xs opacity-80">26%-50%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-300 rounded"></div>
            <span className="text-xs opacity-80">51%-75%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span className="text-xs opacity-80">76%-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}