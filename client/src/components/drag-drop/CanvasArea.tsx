import { useDrop } from 'react-dnd';
import { TemplateComponent, ComponentType } from '@/types/template';
import { DraggableResizableWrapper } from './DraggableResizableWrapper';
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
      onClick: () => onSelectComponent(component.id),
      templateData,
    };

    let componentElement;
    switch (component.type) {
      case 'header':
        componentElement = <HeaderComponent {...commonProps} />;
        break;
      case 'student-info':
        componentElement = <StudentInfoComponent {...commonProps} />;
        break;
      case 'score-table':
        componentElement = <ScoreTableComponent {...commonProps} />;
        break;
      case 'text-block':
        componentElement = <TextBlockComponent {...commonProps} />;
        break;
      case 'image':
        componentElement = <ImageComponent {...commonProps} />;
        break;
      case 'qr-code':
        componentElement = <QRCodeComponent {...commonProps} />;
        break;
      case 'container':
        componentElement = <ContainerComponent {...commonProps} onAddComponent={onAddComponent} />;
        break;
      case 'bar-chart':
        componentElement = <HorizontalBarChartComponent {...commonProps} />;
        break;
      case 'column-chart':
        componentElement = <VerticalBarChartComponent {...commonProps} />;
        break;
      case 'line-chart':
        componentElement = <LineChartComponent {...commonProps} />;
        break;
      case 'pie-chart':
        componentElement = <PieChartComponent {...commonProps} />;
        break;
      case 'lollipop-chart':
        componentElement = <LollipopChartComponent {...commonProps} />;
        break;
      case 'nightingale-chart':
        componentElement = <NightingaleChartComponent {...commonProps} />;
        break;
      case 'icon-chart':
        componentElement = <IconChartComponent {...commonProps} />;
        break;
      case 'word-cloud':
        componentElement = <WordCloudComponent {...commonProps} />;
        break;
      case 'table-chart':
        componentElement = <TableChartComponent {...commonProps} />;
        break;
      case 'bubble-chart':
        componentElement = <BubbleChartComponent {...commonProps} />;
        break;
      case 'stacked-column-chart':
        componentElement = <StackedColumnChartComponent {...commonProps} />;
        break;
      case 'donut-chart':
        componentElement = <DonutChartComponent {...commonProps} />;
        break;
      case 'venn-diagram':
        componentElement = <VennDiagramComponent {...commonProps} />;
        break;
      case 'divider':
        componentElement = <DividerComponent {...commonProps} />;
        break;
      case 'spacer':
        componentElement = <SpacerComponent {...commonProps} />;
        break;
      default:
        return null;
    }

    return (
      <DraggableResizableWrapper
        key={component.id}
        component={component}
        isSelected={isSelected}
        onSelect={() => onSelectComponent(component.id)}
        onUpdateComponent={(updates) => onUpdateComponent(component.id, updates)}
        onDelete={() => onDeleteComponent(component.id)}
      >
        {componentElement}
      </DraggableResizableWrapper>
    );
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
            <div className="absolute inset-4 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
              onClick={() => onSelectComponent('')}
            >
              <div className="text-center text-gray-400">
                <i className="fas fa-plus-circle text-4xl mb-4"></i>
                <p className="text-lg font-medium">Drop components here to start building</p>
                <p className="text-sm">Drag elements from the sidebar to create your score report</p>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full min-h-[800px] relative"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onSelectComponent('');
                }
              }}
            >
              {components.map(renderComponent)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
