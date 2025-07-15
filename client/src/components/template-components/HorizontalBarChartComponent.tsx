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
  
  // Default data structure matching the image
  const defaultData = [
    {
      label: "ESG投资/ESG市场",
      segments: [
        { value: 25, color: "#FDE2E7", label: "0%-25%" },
        { value: 25, color: "#FB923C", label: "26%-50%" },
        { value: 25, color: "#FEF3C7", label: "51%-75%" },
        { value: 25, color: "#D1FAE5", label: "76%-100%" }
      ]
    },
    {
      label: "环境因素",
      segments: [
        { value: 30, color: "#FDE2E7", label: "0%-25%" },
        { value: 20, color: "#FB923C", label: "26%-50%" },
        { value: 25, color: "#FEF3C7", label: "51%-75%" },
        { value: 25, color: "#D1FAE5", label: "76%-100%" }
      ]
    },
    {
      label: "社会因素",
      segments: [
        { value: 20, color: "#FDE2E7", label: "0%-25%" },
        { value: 15, color: "#FB923C", label: "26%-50%" },
        { value: 35, color: "#86EFAC", label: "51%-75%" },
        { value: 30, color: "#D1FAE5", label: "76%-100%" }
      ]
    }
  ];

  const chartData = content.chartData || defaultData;
  const title = content.title || "主要领域";
  const subtitle = content.subtitle || "您在各个主要领域的表现";

  return (
    <div
      className={`relative p-6 bg-white border-2 rounded-lg transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        backgroundColor: style?.backgroundColor || '#ffffff',
        ...style
      }}
      onClick={onSelect}
    >
      {isSelected && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
          size="sm"
        >
          ×
        </Button>
      )}

      <div className="w-full max-w-2xl">
        {/* Chart Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        {/* Percentage Scale */}
        <div className="flex justify-between text-xs text-gray-500 mb-2 px-32">
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
        <div className="space-y-4">
          {chartData.map((item: any, index: number) => (
            <div key={index} className="flex items-center">
              {/* Label */}
              <div className="w-32 text-sm text-gray-700 pr-4">
                {item.label}
              </div>
              
              {/* Bar Container */}
              <div className="flex-1 relative">
                <div className="flex h-8 bg-gray-100 rounded overflow-hidden">
                  {item.segments.map((segment: any, segIndex: number) => (
                    <div
                      key={segIndex}
                      className="flex items-center justify-center text-xs font-medium transition-all hover:opacity-80"
                      style={{
                        width: `${segment.value}%`,
                        backgroundColor: segment.color,
                        border: segIndex > 0 ? '1px solid #fff' : 'none',
                        borderLeft: segIndex > 0 ? '1px solid #fff' : 'none'
                      }}
                    >
                      {segment.value > 15 && (
                        <span className="text-gray-700">
                          {segment.value}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center mt-6 space-x-6">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-pink-100 rounded"></div>
            <span className="text-xs text-gray-600">0%-25%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-orange-400 rounded"></div>
            <span className="text-xs text-gray-600">26%-50%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            <span className="text-xs text-gray-600">51%-75%</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span className="text-xs text-gray-600">76%-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}