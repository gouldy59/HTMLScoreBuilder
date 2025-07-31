import { useState, useRef, useEffect } from 'react';
import { TemplateComponent } from '@/types/template';

interface DraggableResizableWrapperProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateComponent: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function DraggableResizableWrapper({
  component,
  isSelected,
  onSelect,
  onUpdateComponent,
  onDelete,
  children
}: DraggableResizableWrapperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === wrapperRef.current || (e.target as HTMLElement).closest('.component-content')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - component.position.x,
        y: e.clientY - component.position.y
      });
      onSelect();
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const currentWidth = parseInt(component.style?.width?.toString() || '300');
    const currentHeight = parseInt(component.style?.height?.toString() || '200');
    
    setResizeStart({
      width: currentWidth,
      height: currentHeight,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Get canvas bounds - find the actual canvas container  
        const canvas = document.querySelector('[data-canvas="true"]') || document.querySelector('.rounded-lg.shadow-sm.border.border-gray-200') as HTMLElement;
        
        const componentWidth = parseInt(component.style?.width?.toString() || '300');
        const componentHeight = parseInt(component.style?.height?.toString() || '200');
        
        const maxX = canvas ? Math.max(0, canvas.clientWidth - componentWidth - 20) : 800;
        const maxY = canvas ? Math.max(0, canvas.clientHeight - componentHeight - 20) : 600;
        
        onUpdateComponent({
          position: {
            x: Math.max(20, Math.min(newX, maxX)),
            y: Math.max(20, Math.min(newY, maxY))
          }
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.mouseX;
        const deltaY = e.clientY - resizeStart.mouseY;
        
        // Get canvas bounds for resize constraints
        const canvas = document.querySelector('[data-canvas="true"]') || document.querySelector('.rounded-lg.shadow-sm.border.border-gray-200') as HTMLElement;
        const canvasWidth = canvas ? canvas.clientWidth : 1200;
        const canvasHeight = canvas ? canvas.clientHeight : 800;
        
        // Calculate maximum allowed dimensions based on current position
        const maxAllowedWidth = canvasWidth - component.position.x - 40; // 40px buffer
        const maxAllowedHeight = canvasHeight - component.position.y - 40; // 40px buffer
        
        // Set minimum width based on component type - charts need 50% of canvas width
        const isChartComponent = component.type === 'bar-chart' || component.type === 'chart' || component.type === 'horizontal-bar-chart';
        const minWidth = isChartComponent ? Math.max(canvasWidth * 0.5, 100) : 100; // 50% canvas width for charts, 100px for others
        
        const newWidth = Math.max(minWidth, Math.min(resizeStart.width + deltaX, maxAllowedWidth));
        const newHeight = Math.max(50, Math.min(resizeStart.height + deltaY, maxAllowedHeight));
        
        onUpdateComponent({
          style: {
            ...component.style,
            width: `${newWidth}px`,
            height: component.type === 'divider' || component.type === 'spacer' ? component.style?.height : `${newHeight}px`
          }
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, component, onUpdateComponent]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      onDelete();
    }
  };

  useEffect(() => {
    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected, onDelete]);

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: component.position.x,
    top: component.position.y,
    width: component.style?.width || 'auto',
    height: component.style?.height || 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isSelected ? 1000 : 1,
    border: isSelected ? '2px solid #3B82F6' : '2px solid transparent',
    borderRadius: '4px',
    outline: 'none'
  };

  return (
    <div
      ref={wrapperRef}
      style={wrapperStyle}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      tabIndex={0}
    >
      {/* Component content */}
      <div className="component-content w-full h-full">
        {children}
      </div>

      {/* Selection and resize handles */}
      {isSelected && (
        <>
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-8 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
            style={{ zIndex: 1001 }}
          >
            ×
          </button>

          {/* Resize handles */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner resize handles */}
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            />
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />

            {/* Edge resize handles */}
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-n-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            />
            <div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-s-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            />
            <div
              className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-w-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            />
            <div
              className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-e-resize pointer-events-auto"
              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            />
          </div>
        </>
      )}
    </div>
  );
}