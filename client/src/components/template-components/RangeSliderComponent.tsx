import { TemplateComponent } from '@/types/template';
import { Card } from "../ui/card";

interface RangeSliderComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function RangeSliderComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: RangeSliderComponentProps) {
  const { content } = component;
const title = content.title || 'Range Slider Chart';
  const sliders = content.sliders || [];

  const handleSliderChange = (idx: number, value: number) => {
    const newSliders = sliders.map((slider: any, i: number) =>
      i === idx ? { ...slider, grade: value } : slider
    );
    onUpdate({ content: { ...content, sliders: newSliders } });
  };

  return (
    <div
      className={`relative cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <Card>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex flex-col gap-4 bg-gray-50 rounded-lg p-4">
          {sliders.map((slider: any, idx: number) => (
            <div key={`${slider.category}-${idx}`} className="flex items-center gap-4 mb-2">
              <div className="text-xs text-gray-500 w-24 text-right">
                {slider.category}
              </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                value={slider.grade ?? 0}
                onChange={e => handleSliderChange(idx, Number(e.target.value))}
                style={{ width: '100%', accentColor: slider.colour ?? '#3B82F6' }}
                />
              <div className="text-center text-xs w-8">
                {slider.grade ?? 0}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {isSelected && (
        <button
          onClick={e => {
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