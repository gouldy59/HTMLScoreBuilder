import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';

interface VennDiagramComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function VennDiagramComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: VennDiagramComponentProps) {
  const { style, content } = component;

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
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Venn Diagram'}</h3>
        <div className="flex items-center justify-center h-48">
          <svg width="240" height="180" viewBox="0 0 240 180">
            {/* Circle A */}
            <circle
              cx="80"
              cy="90"
              r="50"
              fill="#3B82F6"
              opacity="0.6"
              stroke="#3B82F6"
              strokeWidth="2"
            />
            
            {/* Circle B */}
            <circle
              cx="160"
              cy="90"
              r="50"
              fill="#10B981"
              opacity="0.6"
              stroke="#10B981"
              strokeWidth="2"
            />
            
            {/* Labels */}
            <text x="60" y="70" textAnchor="middle" className="text-sm font-medium fill-white">
              Math
            </text>
            <text x="180" y="70" textAnchor="middle" className="text-sm font-medium fill-white">
              Science
            </text>
            
            {/* Intersection label */}
            <text x="120" y="95" textAnchor="middle" className="text-xs font-medium fill-white">
              Both
            </text>
            
            {/* Values */}
            <text x="60" y="110" textAnchor="middle" className="text-xs font-semibold fill-white">
              25
            </text>
            <text x="120" y="110" textAnchor="middle" className="text-xs font-semibold fill-white">
              15
            </text>
            <text x="180" y="110" textAnchor="middle" className="text-xs font-semibold fill-white">
              30
            </text>
            
            {/* Set labels */}
            <text x="50" y="45" textAnchor="middle" className="text-xs font-medium fill-gray-700">
              Set A
            </text>
            <text x="190" y="45" textAnchor="middle" className="text-xs font-medium fill-gray-700">
              Set B
            </text>
          </svg>
        </div>
        
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60" />
              <span className="text-sm font-medium">Math Only</span>
            </div>
            <div className="text-lg font-bold text-gray-800">25</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-300" />
              <span className="text-sm font-medium">Both</span>
            </div>
            <div className="text-lg font-bold text-gray-800">15</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
              <span className="text-sm font-medium">Science Only</span>
            </div>
            <div className="text-lg font-bold text-gray-800">30</div>
          </div>
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