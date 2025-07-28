import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DragDropProvider } from '@/components/drag-drop/DragDropProvider';
import { ComponentLibrary } from '@/components/drag-drop/ComponentLibrary';
import { CanvasArea } from '@/components/drag-drop/CanvasArea';
import { PropertiesPanel } from '@/components/drag-drop/PropertiesPanel';
import { Toolbar } from '@/components/Toolbar';
import { TemplateNameWizard } from '@/components/TemplateNameWizard';

import { JSONDataDialog } from '@/components/JSONDataDialog';
import { VersionHistoryDialog } from '@/components/VersionHistoryDialog';
import { TemplateComponent, ComponentType, COMPONENT_TYPES } from '@/types/template';
import { generateHTML, downloadHTML } from '@/lib/htmlGenerator';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Template } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function Builder() {
  const [location] = useLocation();
  const [components, setComponents] = useState<TemplateComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  


  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isJSONDialogOpen, setIsJSONDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [templateData, setTemplateData] = useState<any>({});
  const [reportBackground, setReportBackground] = useState<string>('#ffffff');
  const [reportBackgroundImage, setReportBackgroundImage] = useState<string>('');
  const { toast } = useToast();

  // Extract templateId from URL parameters using window.location
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('templateId');

  // Load template if templateId is provided in URL
  const { data: templateToLoad, isLoading: templateLoading, refetch } = useQuery<Template>({
    queryKey: ['template-single', templateId], // More specific query key to avoid cache conflicts
    queryFn: async () => {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch template ${templateId}`);
      }
      return response.json();
    },
    enabled: !!templateId, // Load whenever templateId is present
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data (v5 uses gcTime instead of cacheTime)
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Effect to handle template loading (only when template data is available)
  useEffect(() => {
    if (templateToLoad && templateId && !templateLoading) {
      const requestedTemplateId = parseInt(templateId);
      
      // Force invalidate cache and refetch when templateId changes
      if (requestedTemplateId !== currentTemplateId) {
        queryClient.invalidateQueries({ queryKey: ['template-single'] });
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
        if (refetch) {
          refetch();
        }
      }
      
      // Always reload if the templateId changed, even if it's different from currentTemplateId
      if (requestedTemplateId !== currentTemplateId || currentTemplateId === null) {
        console.log('Loading template:', { 
          templateId: requestedTemplateId, 
          actualTemplateId: templateToLoad.id,
          name: templateToLoad.name, 
          version: templateToLoad.version,
          componentCount: templateToLoad.components?.length || 0,
          isLatest: templateToLoad.isLatest,
          parentId: templateToLoad.parentId,
          queryUrl: `/api/templates/${templateId}`,
          templateToLoad: templateToLoad
        });
        
        const componentsToLoad = Array.isArray(templateToLoad.components) ? templateToLoad.components : [];
        setComponents([...componentsToLoad]); // Force new array to trigger re-render
        setTemplateName(templateToLoad.name);
        setCurrentTemplateId(templateToLoad.id);
        setReportBackground((templateToLoad.styles as any)?.reportBackground || '#ffffff');
        setReportBackgroundImage((templateToLoad.styles as any)?.reportBackgroundImage || '');
        setIsPublished(templateToLoad.isPublished || false);
        setSelectedComponentId(null);
        toast({ 
          title: 'Template loaded successfully!', 
          description: `Loaded "${templateToLoad.name}" (v${templateToLoad.version}) with ${componentsToLoad.length} components`,
          duration: 3000
        });
      }
    }
  }, [templateToLoad, templateId, templateLoading, currentTemplateId, toast, refetch]);

  // Handle URL changes - show wizard for new builder or skip for existing templates
  useEffect(() => {
    if (location === '/builder/new' && currentTemplateId === null) {
      // New builder page - show wizard first
      setShowWizard(true);
      setComponents([]);
      setTemplateName('Untitled Template');
      setReportBackground('#ffffff');
      setReportBackgroundImage('');
      setIsPublished(false);
      setSelectedComponentId(null);
    } else if (templateId || location === '/builder') {
      // Loading existing template or direct builder access - skip wizard
      setShowWizard(false);
    }
  }, [templateId, location, currentTemplateId]);

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name: templateName,
        description: `Template with ${components.length} components`,
        components: components,
        variables: {},
        styles: { reportBackground, reportBackgroundImage },
        changeDescription: 'Template saved from builder',
      };

      if (currentTemplateId) {
        if (isPublished) {
          // If published, create a new version
          const response = await apiRequest('POST', `/api/templates/${currentTemplateId}/versions`, templateData);
          return await response.json();
        } else {
          // If unpublished, update existing template
          const response = await apiRequest('PUT', `/api/templates/${currentTemplateId}`, templateData);
          return await response.json();
        }
      } else {
        // Create new template for first save
        const response = await apiRequest('POST', '/api/templates', templateData);
        const newTemplate = await response.json();
        setCurrentTemplateId(newTemplate.id);
        setTemplateName(newTemplate.name); // Update the name in state
        return newTemplate;
      }
    },
    onSuccess: (savedTemplate) => {
      setCurrentTemplateId(savedTemplate.id);
      // Update the publish state to match the saved template
      setIsPublished(savedTemplate.isPublished || false);
      // Update the template name in case it changed
      setTemplateName(savedTemplate.name);
      // Invalidate templates cache so template manager shows updated data
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template saved successfully' });
    },
    onError: (error: any) => {
      console.error('Save template error:', error);
      let errorMessage = 'Failed to save template';
      
      if (error.response?.status === 409) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: 'Error saving template', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    },
  });

  const publishTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!currentTemplateId) throw new Error('No template to publish');

      const response = await apiRequest('POST', `/api/templates/${currentTemplateId}/publish`);
      return await response.json();
    },
    onSuccess: (updatedTemplate) => {
      setIsPublished(updatedTemplate.isPublished === true);
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template published successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Error publishing template', 
        description: 'Failed to publish template',
        variant: 'destructive' 
      });
    },
  });

  const unpublishTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!currentTemplateId) throw new Error('No template to unpublish');

      const response = await apiRequest('POST', `/api/templates/${currentTemplateId}/unpublish`);
      return await response.json();
    },
    onSuccess: (updatedTemplate) => {
      setIsPublished(updatedTemplate.isPublished === false);
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({ title: 'Template unpublished successfully' });
    },
    onError: () => {
      toast({ 
        title: 'Error unpublishing template', 
        description: 'Failed to unpublish template',
        variant: 'destructive' 
      });
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

  const handleUpdateComponent = (componentId: string, updates: Partial<TemplateComponent> | ((component: TemplateComponent) => Partial<TemplateComponent>)) => {
    setComponents(prev => {
      return prev.map(component => {
        if (component.id === componentId) {
          // Support both object updates and function-based updates
          const resolvedUpdates = typeof updates === 'function' ? updates(component) : updates;
          
          return { 
            ...component, 
            ...resolvedUpdates,
            // Ensure children are properly updated if provided
            children: resolvedUpdates.children !== undefined ? resolvedUpdates.children : component.children
          };
        }
        return component;
      });
    });
  };

  const handleDeleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(component => component.id !== componentId));
    if (selectedComponentId === componentId) {
      setSelectedComponentId(null);
    }
    toast({ title: 'Component deleted' });
  };

  const handleVersionRevert = (template: Template) => {
    setComponents(Array.isArray(template.components) ? template.components : []);
    setTemplateName(template.name);
    setCurrentTemplateId(template.id);
    setReportBackground((template.styles as any)?.reportBackground || '#ffffff');
    setReportBackgroundImage((template.styles as any)?.reportBackgroundImage || '');
    setSelectedComponentId(null);
    setIsVersionHistoryOpen(false);
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
    
    const html = generateHTML(components, previewData, templateName, reportBackground, reportBackgroundImage);

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
      description: 'JSON data has been applied to your template. Charts will update with the new data.' 
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
    
    const html = generateHTML(components, exportData, templateName, reportBackground, reportBackgroundImage);
    downloadHTML(html, `${templateName.replace(/\s+/g, '-').toLowerCase()}.html`);
    
    const dataSource = Object.keys(templateData).length > 0 ? 'with imported JSON data' : 'with sample data';
    toast({ 
      title: 'HTML exported successfully', 
      description: `Template exported ${dataSource}` 
    });
  };

  const handleGeneratePDF = async () => {
    if (!currentTemplateId) {
      toast({ title: 'Error', description: 'Please save the template first', variant: 'destructive' });
      return;
    }

    try {
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

      const exportData = Object.keys(templateData).length > 0 ? { ...defaultData, ...templateData } : defaultData;

      const response = await fetch(`/api/templates/${currentTemplateId}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: exportData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      console.log('PDF blob size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName || 'report'}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({ title: 'Success', description: 'PDF generated successfully' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  const handleGenerateImage = async () => {
    if (!currentTemplateId) {
      toast({ title: 'Error', description: 'Please save the template first', variant: 'destructive' });
      return;
    }

    try {
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

      const exportData = Object.keys(templateData).length > 0 ? { ...defaultData, ...templateData } : defaultData;

      const response = await fetch(`/api/templates/${currentTemplateId}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: exportData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const blob = await response.blob();
      console.log('Image blob size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Received empty image file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateName || 'report'}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({ title: 'Success', description: 'Image generated successfully' });
    } catch (error) {
      console.error('Image generation error:', error);
      toast({ title: 'Error', description: 'Failed to generate image', variant: 'destructive' });
    }
  };

  const handlePublishTemplate = () => {
    publishTemplateMutation.mutate();
  };

  const handleUnpublishTemplate = () => {
    unpublishTemplateMutation.mutate();
  };

  const handleWizardContinue = (name: string) => {
    setTemplateName(name);
    setShowWizard(false);
    // Navigate to main builder after wizard completion
    window.history.pushState({}, '', '/builder');
  };

  // Show wizard for new templates
  if (showWizard && location === '/builder/new') {
    return <TemplateNameWizard onContinue={handleWizardContinue} />;
  }

  return (
    <DragDropProvider>
      <div className="flex h-screen">
        <ComponentLibrary
          onSaveTemplate={() => saveTemplateMutation.mutate()}
          onLoadTemplate={() => {}}
        />

        <div className="flex-1 flex flex-col">
          <Toolbar
            templateName={templateName}
            onTemplateNameChange={setTemplateName}
            onPreview={handlePreview}
            isPublished={isPublished}
            onPublish={handlePublishTemplate}
            onUnpublish={handleUnpublishTemplate}
            currentTemplateId={currentTemplateId}
            onExportHTML={handleExportHTML}
            onImportData={handleImportData}
            onVersionHistory={() => setIsVersionHistoryOpen(true)}
            onGeneratePDF={handleGeneratePDF}
            onGenerateImage={handleGenerateImage}
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
              reportBackgroundImage={reportBackgroundImage}
              templateData={templateData}
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
              reportBackgroundImage={reportBackgroundImage}
              onUpdateReportBackgroundImage={setReportBackgroundImage}
            />
          </div>
        </div>

        <JSONDataDialog
          isOpen={isJSONDialogOpen}
          onClose={() => setIsJSONDialogOpen(false)}
          onApplyData={handleApplyJSONData}
          title="Import Template Data"
          description="Import and validate JSON data to populate your template with real values"
        />

        <VersionHistoryDialog
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          templateId={currentTemplateId}
          onVersionRevert={handleVersionRevert}
        />
      </div>
    </DragDropProvider>
  );
}
