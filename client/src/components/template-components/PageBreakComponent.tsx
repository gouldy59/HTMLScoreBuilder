import { TemplateComponent } from '@/types/template';

interface PageBreakComponentProps {
  component: TemplateComponent;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (updates: Partial<TemplateComponent>) => void;
  onDelete?: () => void;
  templateData?: any;
  mode?: 'builder' | 'preview';
}

export function PageBreakComponent({ 
  component, 
  isSelected = false, 
  onSelect, 
  templateData = {},
  mode = 'builder'
}: PageBreakComponentProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect?.();
  };

  const replaceVariables = (text: string, data: any) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  };

  const label = replaceVariables(component.content.label || 'Page Break', templateData);

  // In preview mode, render invisible separator
  if (mode === 'preview') {
    return (
      <div 
        className="w-full"
        style={{ 
          height: '2px',
          display: 'block'
        }}
      />
    );
  }

  // In builder mode, render visible page break indicator
  return (
    <div
      className={`component-content w-full cursor-pointer border-2 border-dashed transition-all duration-200 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-red-300 hover:border-red-400'
      }`}
      style={{
        width: component.style?.width || '100%',
        height: component.style?.height || '2px',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isSelected ? '#EFF6FF' : '#FEF2F2',
        borderRadius: '6px',
        position: 'relative'
      }}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2 text-xs text-red-600 font-semibold">
        <div className="w-6 h-0.5 bg-red-400"></div>
        <span>📄 {label}</span>
        <div className="w-6 h-0.5 bg-red-400"></div>
      </div>
      
      {/* Visual indicator for new page */}
      <div className="absolute -bottom-1 left-0 right-0 text-center">
        <span className="text-xs text-red-500 bg-white px-2 rounded-full border border-red-200">
          Next Page
        </span>
      </div>
    </div>
  );
}