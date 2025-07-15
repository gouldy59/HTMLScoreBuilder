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
      segments: [
        { value: 20, color: "#FDE2E7", label: "0%-25%" },
        { value: 30, color: "#FB923C", label: "26%-50%" },
        { value: 25, color: "#FEF3C7", label: "51%-75%" },
        { value: 25, color: "#D1FAE5", label: "76%-100%" }
      ]
    },
    {
      label: "Category B",
      segments: [
        { value: 15, color: "#FDE2E7", label: "0%-25%" },
        { value: 25, color: "#FB923C", label: "26%-50%" },
        { value: 30, color: "#FEF3C7", label: "51%-75%" },
        { value: 30, color: "#D1FAE5", label: "76%-100%" }
      ]
    },
    {
      label: "Category C",
      segments: [
        { value: 10, color: "#FDE2E7", label: "0%-25%" },
        { value: 20, color: "#FB923C", label: "26%-50%" },
        { value: 35, color: "#86EFAC", label: "51%-75%" },
        { value: 35, color: "#D1FAE5", label: "76%-100%" }
      ]
    }
  ];

  const chartData = content.chartData || defaultData;
  const title = content.title || "Chart Title";
  const subtitle = content.subtitle || "Add your chart description here";

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
        <div className="flex justify-between text-xs opacity-70 mb-2 px-16">
          <span>0%</span>
          <span>25%</span>
          <span>26%</span>
          <span>50%</span>
          <span>51%</span>
          <span>75%</span>
          <span>76%</span>
          <span>100%</span>
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
                  <div className="flex h-5 bg-gray-100 rounded overflow-hidden">
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
                          {segmentValue > 10 && (
                            <span className="text-gray-800 text-xs font-medium">
                              {segmentValue}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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