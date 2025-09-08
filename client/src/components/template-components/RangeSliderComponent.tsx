import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';
import React, { useState } from 'react';

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
  const { style, content } = component;

  const sliders = [
    { category: 'Maths', color: '#3B82F6' },
    { category: 'English', color: '#10B981' },
    { category: 'Science', color: '#F59E0B' },
    { category: 'History', color: '#EF4444' }
  ];

  // State for all slider values
  const [sliderValues, setSliderValues] = useState(Array(sliders.length).fill(10));

  // Handler for slider change
  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...sliderValues];
    newValues[index] = value;
    setSliderValues(newValues);
  };

  return (
    <div
      className={`relative cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <Card>
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Range Slider Chart'}</h3>
        <div className="h-48 flex flex-col justify-center gap-4 bg-gray-50 rounded-lg p-4">
          {sliders.map((slider, idx) => (
            <div key={slider.category} className="flex flex-row items-center gap-4 mb-2">
              <div className="text-xs text-gray-600 font-medium w-20 text-right">
                {slider.category}
              </div>
              <div className="flex flex-col items-center flex-1">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={sliderValues[idx]}
                  onChange={e => handleSliderChange(idx, Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div className="text-center text-xs mt-1">{sliderValues[idx]}</div>
              </div>
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