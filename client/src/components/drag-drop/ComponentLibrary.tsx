import { useDrag } from 'react-dnd';
import { COMPONENT_TYPES, ComponentType } from '@/types/template';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocation } from 'wouter';

interface DraggableComponentProps {
  componentType: ComponentType;
}

function DraggableComponent({ componentType }: DraggableComponentProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { componentType },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move transition-all hover:shadow-md hover:-translate-y-1 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <i className={`${componentType.icon} text-blue-600`}></i>
        <span className="text-sm font-medium">{componentType.name}</span>
      </div>
      <p className="text-xs text-gray-500">{componentType.description}</p>
    </div>
  );
}

interface ComponentLibraryProps {
  onSaveTemplate: () => void;
  onLoadTemplate: () => void;
  onSaveVersion: () => void;
}

export function ComponentLibrary({ onSaveTemplate, onLoadTemplate, onSaveVersion }: ComponentLibraryProps) {
  const [, setLocation] = useLocation();

  const handleLoadTemplate = () => {
    // Navigate to home screen's template manager tab
    setLocation('/?tab=templates');
  };
  const reportComponents = COMPONENT_TYPES.filter(c => c.category === 'report');
  const layoutComponents = COMPONENT_TYPES.filter(c => c.category === 'layout');

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-cube text-white text-sm"></i>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Page Builder</h1>
            <p className="text-sm text-gray-500">Score Reports</p>
          </div>
        </div>
      </div>

      {/* Component Categories */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Report Elements Category */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
            Report Elements
          </h3>
          <div className="space-y-2">
            {reportComponents.map((componentType) => (
              <DraggableComponent
                key={componentType.id}
                componentType={componentType}
              />
            ))}
          </div>
        </div>

        {/* Layout Elements Category */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
            Layout
          </h3>
          <div className="space-y-2">
            {layoutComponents.map((componentType) => (
              <DraggableComponent
                key={componentType.id}
                componentType={componentType}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Template Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <Button 
            onClick={onSaveTemplate}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-save mr-2"></i>Save Template
          </Button>
          <Button 
            onClick={onSaveVersion}
            variant="outline" 
            className="w-full border-green-300 text-green-600 hover:bg-green-50"
          >
            <i className="fas fa-code-branch mr-2"></i>Save as Version
          </Button>
          <Button 
            onClick={handleLoadTemplate}
            variant="outline" 
            className="w-full"
          >
            <i className="fas fa-folder-open mr-2"></i>Load Template
          </Button>
        </div>
      </div>
    </div>
  );
}
