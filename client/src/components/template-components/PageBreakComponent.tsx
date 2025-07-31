import { TemplateComponent } from '@/types/template';

interface PageBreakComponentProps {
  component: TemplateComponent;
  templateData?: any;
}

export function PageBreakComponent({ component, templateData = {} }: PageBreakComponentProps) {
  const replaceVariables = (text: string, data: any) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  };

  const label = replaceVariables(component.content.label || 'Page Break', templateData);

  return (
    <div className="w-full relative">
      <div 
        className="w-full border-2 border-dashed border-red-400 bg-red-50 flex items-center justify-center relative"
        style={{ 
          height: '12px',
          backgroundColor: component.style?.backgroundColor || '#FEF2F2',
          borderColor: component.style?.backgroundColor || '#EF4444'
        }}
      >
        <span 
          className="absolute bg-white px-2 py-1 text-xs font-bold rounded shadow-sm"
          style={{ 
            color: component.style?.backgroundColor || '#EF4444',
            fontSize: '10px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {label}
        </span>
      </div>
      <div className="text-center mt-1">
        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
          <i className="fas fa-file-contract mr-1"></i>
          Content after this will start on a new page
        </span>
      </div>
    </div>
  );
}