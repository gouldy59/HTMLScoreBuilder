import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';

interface TextBlockComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
}

export function TextBlockComponent({ component, isSelected, onSelect, onUpdate, onDelete }: TextBlockComponentProps) {
  const { content, style } = component;
  const [isEditing, setIsEditing] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFormatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      onUpdate({
        content: { ...content, html: newHtml }
      });
    }
  };

  const handleTextSave = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      onUpdate({
        content: { ...content, html: newHtml }
      });
    }
    setIsEditing(false);
    setShowFormatting(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowFormatting(true);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        handleTextSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing]);

  const displayContent = content.html || content.text || 'Double-click to edit text...';

  return (
    <div
      className={`relative p-6 rounded-lg transition-all group ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
      style={{
        backgroundColor: style.backgroundColor || '#FFFFFF',
        color: style.textColor || '#1F2937',
        fontSize: style.fontSize || '16px',
      }}
      onClick={onSelect}
    >
      {/* Formatting toolbar */}
      {showFormatting && (
        <div className="absolute -top-12 left-0 bg-white border border-gray-300 rounded-md shadow-lg p-2 flex gap-1 z-20">
          <Button
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
            onClick={() => handleFormatCommand('bold')}
          >
            <i className="fas fa-bold text-xs"></i>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
            onClick={() => handleFormatCommand('italic')}
          >
            <i className="fas fa-italic text-xs"></i>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
            onClick={() => handleFormatCommand('fontSize', '12px')}
            title="Small"
          >
            <span className="text-xs">S</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
            onClick={() => handleFormatCommand('fontSize', '16px')}
            title="Medium"
          >
            <span className="text-sm">M</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-8 h-8 p-0"
            onClick={() => handleFormatCommand('fontSize', '20px')}
            title="Large"
          >
            <span className="text-base">L</span>
          </Button>
        </div>
      )}

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

      {/* Content area */}
      <div
        ref={editorRef}
        className="prose max-w-none min-h-[40px] outline-none"
        contentEditable={isEditing}
        dangerouslySetInnerHTML={{ __html: displayContent }}
        onDoubleClick={handleDoubleClick}
        suppressContentEditableWarning={true}
        style={{
          cursor: isEditing ? 'text' : 'pointer'
        }}
      />
      
      {!isEditing && !content.html && !content.text && (
        <div className="text-gray-400 italic text-sm mt-2">
          Double-click to edit this text
        </div>
      )}
    </div>
  );
}
