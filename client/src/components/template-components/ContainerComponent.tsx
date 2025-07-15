import { useDrop } from 'react-dnd';
import { TemplateComponent, ComponentType } from '@/types/template';
import { Button } from '@/components/ui/button';
import { HeaderComponent } from './HeaderComponent';
import { StudentInfoComponent } from './StudentInfoComponent';
import { ScoreTableComponent } from './ScoreTableComponent';
import { ChartComponent } from './ChartComponent';
import { TextBlockComponent } from './TextBlockComponent';
import { GradeSummaryComponent } from './GradeSummaryComponent';
import { DividerComponent } from './DividerComponent';
import { SpacerComponent } from './SpacerComponent';

interface ContainerComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  onAddComponent?: (componentType: ComponentType, position: { x: number; y: number }) => void;
}

export function ContainerComponent({ component, isSelected, onSelect, onUpdate, onDelete, onAddComponent }: ContainerComponentProps) {
  const { style, content } = component;

  const renderChildComponent = (child: TemplateComponent) => {
    const commonProps = {
      component: child,
      isSelected: false,
      onSelect: () => {},
      onUpdate: (updates: Partial<TemplateComponent>) => {
        const updatedChildren = component.children?.map(c => 
          c.id === child.id ? { ...c, ...updates } : c
        ) || [];
        onUpdate({ children: updatedChildren });
      },
      onDelete: () => {
        const updatedChildren = component.children?.filter(c => c.id !== child.id) || [];
        onUpdate({ children: updatedChildren });
      },
    };

    switch (child.type) {
      case 'header':
        return <HeaderComponent {...commonProps} />;
      case 'student-info':
        return <StudentInfoComponent {...commonProps} />;
      case 'score-table':
        return <ScoreTableComponent {...commonProps} />;
      case 'chart':
        return <ChartComponent {...commonProps} />;
      case 'text-block':
        return <TextBlockComponent {...commonProps} />;
      case 'grade-summary':
        return <GradeSummaryComponent {...commonProps} />;
      case 'divider':
        return <DividerComponent {...commonProps} />;
      case 'spacer':
        return <SpacerComponent {...commonProps} />;
      default:
        return <div className="p-2 bg-gray-100 rounded text-gray-500">Unknown component: {child.type}</div>;
    }
  };

  const getLayoutClassName = () => {
    const layoutDirection = content.layoutDirection || 'vertical';
    const spacing = content.itemSpacing || 'medium';
    
    const spacingClasses = {
      small: 'gap-2',
      medium: 'gap-4', 
      large: 'gap-6'
    };
    
    const spacingClass = spacingClasses[spacing as keyof typeof spacingClasses] || 'gap-4';
    
    switch (layoutDirection) {
      case 'horizontal':
        return `flex flex-row flex-wrap items-start ${spacingClass}`;
      case 'grid':
        return `grid grid-cols-2 ${spacingClass} auto-rows-auto`;
      case 'vertical':
      default:
        return `flex flex-col ${spacingClass}`;
    }
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item: { componentType: ComponentType }, monitor) => {
      if (monitor.didDrop()) return; // Prevent duplicate drops
      
      const currentChildren = component.children || [];
      
      // Create unique ID with timestamp to avoid collisions
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      const newId = `${timestamp}-${randomSuffix}`;
      
      // Add the component as a child of this container
      const newChild: TemplateComponent = {
        id: newId,
        type: item.componentType.id,
        content: { ...item.componentType.defaultContent },
        style: { ...item.componentType.defaultStyle },
        position: { x: currentChildren.length, y: 0 }, // Use index for grid positioning
      };
      
      // Always append to existing children array
      const updatedChildren = [...currentChildren, newChild];
      
      console.log('Container drop - Layout:', content.layoutDirection, 'Current children:', currentChildren.length, 'New children:', updatedChildren.length, 'New ID:', newId);
      
      onUpdate({ 
        children: updatedChildren
      });
      
      return { containerId: component.id }; // Return container info
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

      {/* Container children */}
      <div>
        {component.children && component.children.length > 0 ? (
          <div className={getLayoutClassName()}>
            {component.children.map((child, index) => (
              <div key={`${child.id}-${index}`} className="relative min-h-fit">
                {renderChildComponent(child)}
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}