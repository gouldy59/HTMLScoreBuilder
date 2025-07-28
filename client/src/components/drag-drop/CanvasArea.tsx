import { useDrop } from 'react-dnd';
import { TemplateComponent, ComponentType } from '@/types/template';
import { HeaderComponent } from '../template-components/HeaderComponent';
import { StudentInfoComponent } from '../template-components/StudentInfoComponent';
import { ScoreTableComponent } from '../template-components/ScoreTableComponent';
import { TextBlockComponent } from '../template-components/TextBlockComponent';
import { ContainerComponent } from '../template-components/ContainerComponent';
import { DividerComponent } from '../template-components/DividerComponent';
import { SpacerComponent } from '../template-components/SpacerComponent';
import { HorizontalBarChartComponent } from '../template-components/HorizontalBarChartComponent';
import { VerticalBarChartComponent } from '../template-components/VerticalBarChartComponent';
import { LineChartComponent } from '../template-components/LineChartComponent';
import { PieChartComponent } from '../template-components/PieChartComponent';
import { LollipopChartComponent } from '../template-components/LollipopChartComponent';
import { NightingaleChartComponent } from '../template-components/NightingaleChartComponent';
import { IconChartComponent } from '../template-components/IconChartComponent';
import { WordCloudComponent } from '../template-components/WordCloudComponent';
import { TableChartComponent } from '../template-components/TableChartComponent';
import { BubbleChartComponent } from '../template-components/BubbleChartComponent';
import { StackedColumnChartComponent } from '../template-components/StackedColumnChartComponent';
import { DonutChartComponent } from '../template-components/DonutChartComponent';
import { VennDiagramComponent } from '../template-components/VennDiagramComponent';
import { ImageComponent } from '../template-components/ImageComponent';
import { QRCodeComponent } from '../template-components/QRCodeComponent';


interface CanvasAreaProps {
  components: TemplateComponent[];
  selectedComponent: string | null;
  onAddComponent: (componentType: ComponentType, position: { x: number; y: number }) => void;
  onSelectComponent: (componentId: string) => void;
  onUpdateComponent: (componentId: string, updates: Partial<TemplateComponent>) => void;
  onDeleteComponent: (componentId: string) => void;
  reportBackground?: string;
  reportBackgroundImage?: string;
  templateData?: any;
}

export function CanvasArea({
  components,
  selectedComponent,
  onAddComponent,
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent,
  reportBackground = '#ffffff',
  reportBackgroundImage,
  templateData = {},
}: CanvasAreaProps) {

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: (item: { componentType: ComponentType }, monitor) => {
      const offset = monitor.getDropResult();
      const clientOffset = monitor.getClientOffset();
      
      if (clientOffset) {
        onAddComponent(item.componentType, {
          x: clientOffset.x,
          y: clientOffset.y,
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const renderComponent = (component: TemplateComponent) => {
    const isSelected = selectedComponent === component.id;
    const commonProps = {
      component,
      isSelected,
      onSelect: () => onSelectComponent(component.id),
      onUpdate: (updates: Partial<TemplateComponent>) => onUpdateComponent(component.id, updates),
      onDelete: () => onDeleteComponent(component.id),
      templateData,
    };

    switch (component.type) {
      case 'header':
        return <HeaderComponent key={component.id} {...commonProps} />;
      case 'student-info':
        return <StudentInfoComponent key={component.id} {...commonProps} />;
      case 'score-table':
        return <ScoreTableComponent key={component.id} {...commonProps} />;
      case 'text-block':
        return <TextBlockComponent key={component.id} {...commonProps} />;
      case 'image':
        return <ImageComponent key={component.id} {...commonProps} />;
      case 'qr-code':
        return <QRCodeComponent key={component.id} {...commonProps} />;
      case 'container':
        return <ContainerComponent key={component.id} {...commonProps} onAddComponent={onAddComponent} />;
      case 'bar-chart':
        return <HorizontalBarChartComponent key={component.id} {...commonProps} />;
      case 'column-chart':
        return <VerticalBarChartComponent key={component.id} {...commonProps} />;
      case 'line-chart':
        return <LineChartComponent key={component.id} {...commonProps} />;
      case 'pie-chart':
        return <PieChartComponent key={component.id} {...commonProps} />;
      case 'lollipop-chart':
        return <LollipopChartComponent key={component.id} {...commonProps} />;
      case 'nightingale-chart':
        return <NightingaleChartComponent key={component.id} {...commonProps} />;
      case 'icon-chart':
        return <IconChartComponent key={component.id} {...commonProps} />;
      case 'word-cloud':
        return <WordCloudComponent key={component.id} {...commonProps} />;
      case 'table-chart':
        return <TableChartComponent key={component.id} {...commonProps} />;
      case 'bubble-chart':
        return <BubbleChartComponent key={component.id} {...commonProps} />;
      case 'stacked-column-chart':
        return <StackedColumnChartComponent key={component.id} {...commonProps} />;
      case 'donut-chart':
        return <DonutChartComponent key={component.id} {...commonProps} />;
      case 'venn-diagram':
        return <VennDiagramComponent key={component.id} {...commonProps} />;
      case 'divider':
        return <DividerComponent key={component.id} {...commonProps} />;
      case 'spacer':
        return <SpacerComponent key={component.id} {...commonProps} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div
          ref={drop}
          className={`rounded-lg shadow-sm border border-gray-200 min-h-[800px] relative ${
            isOver ? 'border-blue-400 bg-blue-50' : ''
          }`}
          style={{
            backgroundColor: reportBackground,
            backgroundImage: reportBackgroundImage 
              ? `url("${reportBackgroundImage}"), linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`
              : 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: reportBackgroundImage 
              ? 'cover, 20px 20px, 20px 20px'
              : '20px 20px',
            backgroundRepeat: reportBackgroundImage 
              ? 'no-repeat, repeat, repeat'
              : 'repeat',
            backgroundPosition: reportBackgroundImage 
              ? 'center, 0 0, 0 0'
              : '0 0'
          }}
        >
          {components.length === 0 ? (
            <div className="absolute inset-4 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-400">
                <i className="fas fa-plus-circle text-4xl mb-4"></i>
                <p className="text-lg font-medium">Drop components here to start building</p>
                <p className="text-sm">Drag elements from the sidebar to create your score report</p>
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              {components
                .sort((a, b) => a.position.y - b.position.y)
                .map(renderComponent)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
