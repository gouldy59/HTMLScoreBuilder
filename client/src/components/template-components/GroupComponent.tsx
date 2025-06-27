import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';
import { HeaderComponent } from './HeaderComponent';
import { StudentInfoComponent } from './StudentInfoComponent';
import { ScoreTableComponent } from './ScoreTableComponent';
import { ChartComponent } from './ChartComponent';
import { TextBlockComponent } from './TextBlockComponent';
import { GradeSummaryComponent } from './GradeSummaryComponent';
import { ContainerComponent } from './ContainerComponent';
import { DividerComponent } from './DividerComponent';
import { SpacerComponent } from './SpacerComponent';

interface GroupComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  onUngroup: () => void;
}

export function GroupComponent({ component, isSelected, onSelect, onDelete, onUngroup }: GroupComponentProps) {
  const { content, style } = component;
  const children = content.children || [];

  const renderChildComponent = (child: any, index: number) => {
    const childProps = {
      component: child,
      isSelected: false,
      onSelect: () => {},
      onUpdate: () => {},
      onDelete: () => {},
    };

    switch (child.type) {
      case 'header':
        return <HeaderComponent key={index} {...childProps} />;
      case 'student-info':
        return <StudentInfoComponent key={index} {...childProps} />;
      case 'score-table':
        return <ScoreTableComponent key={index} {...childProps} />;
      case 'chart':
        return <ChartComponent key={index} {...childProps} />;
      case 'text-block':
        return <TextBlockComponent key={index} {...childProps} />;
      case 'grade-summary':
        return <GradeSummaryComponent key={index} {...childProps} />;
      case 'container':
        return <ContainerComponent key={index} {...childProps} />;
      case 'divider':
        return <DividerComponent key={index} {...childProps} />;
      case 'spacer':
        return <SpacerComponent key={index} {...childProps} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative rounded-lg cursor-pointer transition-all group ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
      style={{
        backgroundColor: style.backgroundColor || '#F9FAFB',
        padding: style.padding || '16px',
        borderRadius: style.borderRadius || '8px',
        border: style.border || '2px dashed #D1D5DB',
      }}
      onClick={onSelect}
    >
      {/* Action buttons */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="w-6 h-6 p-0 bg-white border border-gray-300 hover:bg-gray-50 text-green-600 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              onUngroup();
            }}
            title="Ungroup components"
          >
            <i className="fas fa-unlink text-xs"></i>
          </Button>
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

      {/* Group header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-300">
        <div className="flex items-center gap-2">
          <i className="fas fa-layer-group text-blue-600"></i>
          <span className="text-sm font-medium text-gray-700">
            Group ({children.length} components)
          </span>
        </div>
      </div>

      {/* Grouped components */}
      <div className="space-y-4 pointer-events-none">
        {children.map((child: TemplateComponent, index: number) => (
          <div
            key={index}
            className="relative opacity-90 transform scale-95"
            style={{
              position: 'relative',
              left: `${child.position?.x || 0}px`,
              top: `${child.position?.y || 0}px`,
            }}
          >
            {renderChildComponent(child, index)}
          </div>
        ))}
        {children.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-layer-group text-2xl mb-2"></i>
            <p>Empty group</p>
          </div>
        )}
      </div>
    </div>
  );
}