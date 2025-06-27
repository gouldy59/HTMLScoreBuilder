import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DragDropProvider } from '@/components/drag-drop/DragDropProvider';
import { ComponentLibrary } from '@/components/drag-drop/ComponentLibrary';
import { CanvasArea } from '@/components/drag-drop/CanvasArea';
import { PropertiesPanel } from '@/components/drag-drop/PropertiesPanel';
import { Toolbar } from '@/components/Toolbar';
import { TemplateManager } from '@/components/TemplateManager';
import { TemplateComponent, ComponentType, COMPONENT_TYPES } from '@/types/template';
import { generateHTML, downloadHTML } from '@/lib/htmlGenerator';
import { apiRequest } from '@/lib/queryClient';
import { Template } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export default function Builder() {
  const [components, setComponents] = useState<TemplateComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name: templateName,
        description: `Template with ${components.length} components`,
        components: components,
        variables: {},
        styles: {},
      };

      if (currentTemplateId) {
        const response = await apiRequest('PUT', `/api/templates/${currentTemplateId}`, templateData);
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/templates', templateData);
        return response.json();
      }
    },
    onSuccess: (savedTemplate) => {
      setCurrentTemplateId(savedTemplate.id);
      toast({ title: 'Template saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save template', variant: 'destructive' });
    },
  });

  const selectedComponent = components.find(c => c.id === selectedComponentId) || null;

  const generateComponentId = () => {
    return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddComponent = (componentType: ComponentType, position: { x: number; y: number }) => {
    const newComponent: TemplateComponent = {
      id: generateComponentId(),
      type: componentType.id,
      content: { ...componentType.defaultContent },
      style: { ...componentType.defaultStyle },
      position,
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponentId(newComponent.id);
    toast({ title: `${componentType.name} component added` });
  };

  const handleSelectComponent = (componentId: string) => {
    setSelectedComponentId(componentId);
  };

  const handleUpdateComponent = (componentId: string, updates: Partial<TemplateComponent>) => {
    setComponents(prev =>
      prev.map(component =>
        component.id === componentId
          ? { 
              ...component, 
              ...updates,
              // Preserve children if not being updated, or use the new children array if provided
              children: updates.children !== undefined ? updates.children : component.children
            }
          : component
      )
    );
  };

  const handleDeleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(component => component.id !== componentId));
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
    }
    toast({ title: 'Component deleted' });
  };

  const handleLoadTemplate = (template: Template) => {
    setComponents(Array.isArray(template.components) ? template.components : []);
    setTemplateName(template.name);
    setCurrentTemplateId(template.id);
    setSelectedComponentId(null);
  };

  const handlePreview = () => {
    const html = generateHTML(components, {
      studentName: 'John Doe',
      studentId: 'STU001',
      className: '10th Grade',
      teacherName: 'Ms. Smith',
      academicYear: '2024-2025',
      grade: '10',
      mathScore: 85,
      mathGrade: 'B+',
      scienceScore: 92,
      scienceGrade: 'A-',
      englishScore: 78,
      englishGrade: 'B',
      overallGrade: 'B+',
      gpa: 3.5,
      rank: 15,
    }, templateName);

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  };

  const handleExportHTML = () => {
    const html = generateHTML(components, {}, templateName);
    downloadHTML(html, `${templateName.replace(/\s+/g, '-').toLowerCase()}.html`);
    toast({ title: 'HTML exported successfully' });
  };

  return (
    <DragDropProvider>
      <div className="flex h-screen">
        <ComponentLibrary
          onSaveTemplate={() => saveTemplateMutation.mutate()}
          onLoadTemplate={() => setIsTemplateManagerOpen(true)}
        />

        <div className="flex-1 flex flex-col">
          <Toolbar
            templateName={templateName}
            onPreview={handlePreview}
            onExportHTML={handleExportHTML}
          />

          <div className="flex-1 flex">
            <CanvasArea
              components={components}
              selectedComponent={selectedComponentId}
              onAddComponent={handleAddComponent}
              onSelectComponent={handleSelectComponent}
              onUpdateComponent={handleUpdateComponent}
              onDeleteComponent={handleDeleteComponent}
            />

            <PropertiesPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={(updates) => {
                if (selectedComponent) {
                  handleUpdateComponent(selectedComponent.id, updates);
                }
              }}
            />
          </div>
        </div>

        <TemplateManager
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          onLoadTemplate={handleLoadTemplate}
        />
      </div>
    </DragDropProvider>
  );
}
