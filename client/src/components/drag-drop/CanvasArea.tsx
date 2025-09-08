import { useRef } from 'react';
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

import { ImageComponent } from '../template-components/ImageComponent';
import { QRCodeComponent } from '../template-components/QRCodeComponent';
import { PageBreakComponent } from '../template-components/PageBreakComponent';


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
    const canvasRef = useRef<HTMLDivElement>(null);

    // Get page breaks for visual indicators
    const pageBreaks = components.filter(c => c.type === 'page-break');

    // Calculate total pages needed based on page breaks
    const totalPages = Math.max(1, pageBreaks.length + 1);
    const pageHeight = 1123; // A4 height in px
    const totalCanvasHeight = totalPages * pageHeight;

    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'component',
        drop: (item: { componentType: ComponentType }, monitor) => {
            const clientOffset = monitor.getClientOffset();
            const canvasElement = canvasRef.current;

            if (clientOffset && canvasElement) {
                const canvasRect = canvasElement.getBoundingClientRect();
                let newX = clientOffset.x - canvasRect.left;
                let newY = clientOffset.y - canvasRect.top;

                newX = Math.max(0, Math.min(newX, canvasRect.width));
                newY = Math.max(0, Math.min(newY, canvasRect.height));

                if (item.componentType.id === 'page-break') {
                    newX = 0;
                }

                onAddComponent(item.componentType, {
                    x: newX,
                    y: newY,
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

            case 'divider':
                componentElement = <DividerComponent {...commonProps} />;
                break;
            case 'spacer':
                componentElement = <SpacerComponent {...commonProps} />;
                break;
            case 'page-break':
                componentElement = <PageBreakComponent {...commonProps} mode="builder" />;
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
                overrideWidth={component.type === 'page-break' ? '100%' : undefined}
            >
                {componentElement}
            </DraggableResizableWrapper>
        );
    };

    return (
        <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
                <div
                    ref={(el) => {
                        drop(el);
                        canvasRef.current = el;
                    }}
                    className={`rounded-lg shadow-sm border border-gray-200 relative overflow-hidden mx-auto ${isOver ? 'border-blue-400 bg-blue-50' : ''
                        }`}
                    style={{
                        width: '794px', // A4 width at 96 DPI
                        height: `${totalCanvasHeight}px`, // Dynamic height based on pages
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
                            : '0 0',
                        position: 'relative'
                    }}
                >
                    {/* Page boundary indicators when page breaks exist */}
                    {pageBreaks.length > 0 && pageBreaks.map((pageBreak, index) => {
                        const pageBreakY = pageBreak.position?.y || 0;
                        return (
                            <div
                                key={`page-boundary-${index}`}
                                className="absolute left-0 right-0 border-t-2 border-dashed border-blue-400 bg-blue-100 pointer-events-none z-10"
                                style={{
                                    top: `${pageBreakY + 20}px`,
                                    height: '24px',
                                    opacity: 0.8
                                }}
                            >
                                <div className="absolute left-4 top-1 text-xs font-semibold text-blue-700 bg-white px-2 rounded">
                                    Page {index + 2} starts here
                                </div>
                            </div>
                        );
                    })}

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
                            className="w-full h-full relative"
                            style={{ minHeight: `${totalCanvasHeight}px` }}
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