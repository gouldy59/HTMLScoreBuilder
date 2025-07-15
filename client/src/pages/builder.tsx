import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DragDropProvider } from '@/components/drag-drop/DragDropProvider';
import { ComponentLibrary } from '@/components/drag-drop/ComponentLibrary';
import { CanvasArea } from '@/components/drag-drop/CanvasArea';
import { PropertiesPanel } from '@/components/drag-drop/PropertiesPanel';
import { Toolbar } from '@/components/Toolbar';
import { TemplateManager } from '@/components/TemplateManager';
import { JSONDataDialog } from '@/components/JSONDataDialog';
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
  const [isJSONDialogOpen, setIsJSONDialogOpen] = useState(false);
  const [templateData, setTemplateData] = useState<any>({});
  const [reportBackground, setReportBackground] = useState<string>('#ffffff');
  const { toast } = useToast();

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name: templateName,
        description: `Template with ${components.length} components`,
        components: components,
        variables: {},
        styles: { reportBackground },
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
    console.log('handleUpdateComponent called for:', componentId, 'with updates:', updates);
    
    setComponents(prev => {
      const updated = prev.map(component => {
        if (component.id === componentId) {
          const updatedComponent = { 
            ...component, 
            ...updates,
            // Ensure children are properly updated if provided
            children: updates.children !== undefined ? updates.children : component.children
          };
          console.log('Updated component:', updatedComponent);
          return updatedComponent;
        }
        return component;
      });
      
      console.log('Full components array after update:', updated);
      return updated;
    });
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
    setReportBackground(template.styles?.reportBackground || '#ffffff');
    setSelectedComponentId(null);
  };

  const handlePreview = () => {
    const defaultData = {
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
    };

    // Use imported data if available, otherwise use defaults
    const previewData = Object.keys(templateData).length > 0 ? { ...defaultData, ...templateData } : defaultData;
    
    const html = generateHTML(components, previewData, templateName, reportBackground);

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  };

  const handleImportData = () => {
    setIsJSONDialogOpen(true);
  };

  const handleApplyJSONData = (data: any) => {
    setTemplateData(data);
    toast({ 
      title: 'Data Imported', 
      description: 'JSON data has been applied to your template. Use Preview to see the results.' 
    });
  };

  const handleExportHTML = () => {
    const defaultData = {
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
    };

    // Use imported data if available, otherwise use defaults
    const exportData = Object.keys(templateData).length > 0 ? { ...defaultData, ...templateData } : defaultData;
    
    const html = generateHTML(components, exportData, templateName, reportBackground);
    downloadHTML(html, `${templateName.replace(/\s+/g, '-').toLowerCase()}.html`);
    
    const dataSource = Object.keys(templateData).length > 0 ? 'with imported JSON data' : 'with sample data';
    toast({ 
      title: 'HTML exported successfully', 
      description: `Template exported ${dataSource}` 
    });
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
            onImportData={handleImportData}
          />

          <div className="flex-1 flex">
            <CanvasArea
              components={components}
              selectedComponent={selectedComponentId}
              onAddComponent={handleAddComponent}
              onSelectComponent={handleSelectComponent}
              onUpdateComponent={handleUpdateComponent}
              onDeleteComponent={handleDeleteComponent}
              reportBackground={reportBackground}
            />

            <PropertiesPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={(updates) => {
                if (selectedComponent) {
                  handleUpdateComponent(selectedComponent.id, updates);
                }
              }}
              reportBackground={reportBackground}
              onUpdateReportBackground={setReportBackground}
            />
          </div>
        </div>

        <TemplateManager
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          onLoadTemplate={handleLoadTemplate}
        />

        <JSONDataDialog
          isOpen={isJSONDialogOpen}
          onClose={() => setIsJSONDialogOpen(false)}
          onApplyData={handleApplyJSONData}
          title="Import Template Data"
          description="Import and validate JSON data to populate your template with real values"
        />
      </div>
    </DragDropProvider>
  );
}
