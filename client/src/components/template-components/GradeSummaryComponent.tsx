import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';

interface GradeSummaryComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
}

export function GradeSummaryComponent({ component, isSelected, onSelect, onDelete }: GradeSummaryComponentProps) {
  const { content, style } = component;

  return (
    <div
      className={`relative p-6 rounded-lg cursor-pointer transition-all group text-center ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
      style={{
        backgroundColor: style.backgroundColor || '#EFF6FF',
        color: style.textColor || '#1F2937',
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

      <h3 className="text-2xl font-bold mb-4">Overall Performance</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm opacity-70">Grade</p>
          <p className="text-3xl font-bold">{content.overallGrade || 'A+'}</p>
        </div>
        <div>
          <p className="text-sm opacity-70">GPA</p>
          <p className="text-3xl font-bold">{content.gpa || '4.0'}</p>
        </div>
        <div>
          <p className="text-sm opacity-70">Class Rank</p>
          <p className="text-3xl font-bold">{content.rank || '1'}</p>
        </div>
      </div>
    </div>
  );
}
