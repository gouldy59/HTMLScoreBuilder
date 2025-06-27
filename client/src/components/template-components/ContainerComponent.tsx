import { useDrop } from 'react-dnd';
import { TemplateComponent, ComponentType } from '@/types/template';
import { Button } from '@/components/ui/button';

interface ContainerComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  onAddComponent?: (componentType: ComponentType, position: { x: number; y: number }) => void;
}

export function ContainerComponent({ component, isSelected, onSelect, onDelete, onAddComponent }: ContainerComponentProps) {
  const { style, content } = component;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item: { componentType: ComponentType }, monitor) => {
      if (monitor.didDrop()) return; // Prevent duplicate drops
      
      const offset = monitor.getClientOffset();
      if (offset && onAddComponent) {
        // Position relative to the container
        const containerRect = monitor.getDropResult();
        onAddComponent(item.componentType, {
          x: offset.x - 100, // Adjust for better positioning within container
          y: offset.y + 50,
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`relative rounded-lg cursor-pointer transition-all group min-h-32 ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      } ${
        isOver ? 'ring-2 ring-green-400' : ''
      }`}
      style={{
        backgroundColor: style.backgroundColor || '#F9FAFB',
        padding: style.padding || '16px',
        borderRadius: style.borderRadius || '8px',
        color: style.textColor || '#374151',
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

      {/* Container header */}
      {content.title && (
        <div className="mb-4">
          <h3 className="font-semibold text-lg" style={{ color: style.textColor || '#374151' }}>
            {content.title}
          </h3>
          {content.description && (
            <p className="text-sm opacity-75 mt-1" style={{ color: style.textColor || '#374151' }}>
              {content.description}
            </p>
          )}
        </div>
      )}

      {/* Drop zone */}
      <div className={`min-h-24 flex items-center justify-center border-2 border-dashed rounded transition-all ${
        isOver ? 'border-green-400 bg-green-50 text-green-600' : 'border-gray-300'
      }`}>
        <div className="text-center">
          <i className={`fas fa-inbox text-2xl mb-2 ${isOver ? 'text-green-500' : 'text-gray-400'}`}></i>
          <p className="text-sm font-medium">
            {isOver ? 'Drop component here' : (content.title ? 'Container Content' : 'Container')}
          </p>
          <p className="text-xs opacity-75">
            {isOver ? 'Release to add component' : 'Drag components here to organize your layout'}
          </p>
        </div>
      </div>
    </div>
  );
}
