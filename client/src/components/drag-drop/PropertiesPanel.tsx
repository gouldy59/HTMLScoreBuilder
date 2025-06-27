import { TemplateComponent, DEFAULT_VARIABLES } from '@/types/template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { validateJSON, validateChartData, getExampleJSON } from '@/lib/jsonValidator';
import { useToast } from '@/hooks/use-toast';

interface PropertiesPanelProps {
  selectedComponent: TemplateComponent | null;
  onUpdateComponent: (updates: Partial<TemplateComponent>) => void;
}

export function PropertiesPanel({ selectedComponent, onUpdateComponent }: PropertiesPanelProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const { toast } = useToast();

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Properties</h3>
          <p className="text-sm text-gray-500 mt-1">Configure selected component</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <i className="fas fa-mouse-pointer text-3xl mb-3"></i>
            <p className="font-medium">Select a component</p>
            <p className="text-sm">Click on any component in the canvas to edit its properties</p>
          </div>
        </div>
        <div className="border-t border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Available Variables</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {DEFAULT_VARIABLES.map((variable) => (
              <div key={variable.name} className="text-xs">
                <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                  {`{{${variable.name}}}`}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const updateContent = (key: string, value: any) => {
    onUpdateComponent({
      content: {
        ...selectedComponent.content,
        [key]: value,
      },
    });
  };

  const updateStyle = (key: string, value: any) => {
    onUpdateComponent({
      style: {
        ...selectedComponent.style,
        [key]: value,
      },
    });
  };

  const renderContentEditor = () => {
    switch (selectedComponent.type) {
      case 'header':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Title Text</Label>
              <Input
                id="title"
                value={selectedComponent.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Enter title..."
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle Text</Label>
              <Input
                id="subtitle"
                value={selectedComponent.content.subtitle || ''}
                onChange={(e) => updateContent('subtitle', e.target.value)}
                placeholder="Enter subtitle..."
              />
            </div>
          </div>
        );

      case 'text-block':
        return (
          <div>
            <Label htmlFor="text">Text Content</Label>
            <Textarea
              id="text"
              value={selectedComponent.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              placeholder="Enter text content..."
              className="min-h-24"
            />
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="chartTitle">Chart Title</Label>
              <Input
                id="chartTitle"
                value={selectedComponent.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Enter chart title..."
              />
            </div>
            <div>
              <Label htmlFor="chartType">Chart Type</Label>
              <Select
                value={selectedComponent.content.chartType || 'bar'}
                onValueChange={(value) => updateContent('chartType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="chartData">Data Source</Label>
              <div className="space-y-2">
                <Textarea
                  id="chartData"
                  value={selectedComponent.content.data || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateContent('data', value);
                    
                    // Validate JSON if it's not a template variable
                    if (value && !value.startsWith('{{')) {
                      const jsonValidation = validateJSON(value);
                      if (jsonValidation.isValid && jsonValidation.data) {
                        const chartValidation = validateChartData(jsonValidation.data);
                        if (!chartValidation.isValid) {
                          setJsonError(`Chart data: ${chartValidation.error}`);
                        } else {
                          setJsonError('');
                        }
                      } else {
                        setJsonError(`JSON: ${jsonValidation.error}`);
                      }
                    } else {
                      setJsonError('');
                    }
                  }}
                  placeholder="{{chartData}} or valid JSON chart data"
                  className="min-h-20 font-mono text-sm"
                />
                {jsonError && (
                  <p className="text-sm text-red-600">{jsonError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const example = getExampleJSON('chart');
                      updateContent('data', example);
                      setJsonError('');
                    }}
                  >
                    <i className="fas fa-lightbulb mr-1 text-xs"></i>
                    Example
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const value = selectedComponent.content.data;
                      if (value && !value.startsWith('{{')) {
                        const validation = validateJSON(value);
                        if (validation.isValid) {
                          toast({ title: 'Valid JSON format', description: 'Chart data is properly formatted' });
                        } else {
                          toast({ title: 'Invalid JSON', description: validation.error, variant: 'destructive' });
                        }
                      }
                    }}
                  >
                    <i className="fas fa-check mr-1 text-xs"></i>
                    Validate
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'student-info':
        return (
          <div className="space-y-3">
            <Label>Student Info Fields</Label>
            {Object.entries(selectedComponent.content.fields || {}).map(([key, value], index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={key}
                  onChange={(e) => {
                    const newFields = { ...selectedComponent.content.fields };
                    delete newFields[key];
                    newFields[e.target.value] = value;
                    updateContent('fields', newFields);
                  }}
                  placeholder="Field name"
                  className="flex-1"
                />
                <Input
                  value={String(value)}
                  onChange={(e) => {
                    const newFields = { ...selectedComponent.content.fields };
                    newFields[key] = e.target.value;
                    updateContent('fields', newFields);
                  }}
                  placeholder="Field value"
                  className="flex-1"
                />
              </div>
            ))}
            <Button
              onClick={() => {
                const newFields = { ...selectedComponent.content.fields };
                newFields[`Field ${Object.keys(newFields).length + 1}`] = '{{variable}}';
                updateContent('fields', newFields);
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <i className="fas fa-plus mr-2"></i>Add Field
            </Button>
          </div>
        );

      case 'container':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="containerTitle">Container Title (Optional)</Label>
              <Input
                id="containerTitle"
                value={selectedComponent.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Enter container title..."
              />
            </div>
            <div>
              <Label htmlFor="containerDescription">Description (Optional)</Label>
              <Textarea
                id="containerDescription"
                value={selectedComponent.content.description || ''}
                onChange={(e) => updateContent('description', e.target.value)}
                placeholder="Container description..."
                className="min-h-16"
              />
            </div>
            <div>
              <Label htmlFor="layoutDirection">Layout Direction</Label>
              <Select
                value={selectedComponent.content.layoutDirection || 'vertical'}
                onValueChange={(value) => updateContent('layoutDirection', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical (Stack Down)</SelectItem>
                  <SelectItem value="horizontal">Horizontal (Side by Side)</SelectItem>
                  <SelectItem value="grid">Grid (2 Columns)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="itemSpacing">Item Spacing</Label>
              <Select
                value={selectedComponent.content.itemSpacing || 'medium'}
                onValueChange={(value) => updateContent('itemSpacing', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select spacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (8px)</SelectItem>
                  <SelectItem value="medium">Medium (16px)</SelectItem>
                  <SelectItem value="large">Large (24px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-gray-500">
            No specific content options for this component type.
          </p>
        );
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Properties</h3>
        <p className="text-sm text-gray-500 mt-1">
          Editing: {selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Content Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Content</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContentEditor()}
          </CardContent>
        </Card>

        {/* Style Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="textColor"
                  value={selectedComponent.style.textColor || '#1F2937'}
                  onChange={(e) => updateStyle('textColor', e.target.value)}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={selectedComponent.style.textColor || '#1F2937'}
                  onChange={(e) => updateStyle('textColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="backgroundColor"
                  value={selectedComponent.style.backgroundColor || '#FFFFFF'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={selectedComponent.style.backgroundColor || '#FFFFFF'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={selectedComponent.style.fontSize || 'medium'}
                onValueChange={(value) => updateStyle('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Variables Panel */}
      <div className="border-t border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Available Variables</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {DEFAULT_VARIABLES.slice(0, 8).map((variable) => (
            <div key={variable.name} className="text-xs">
              <code
                className="bg-gray-100 px-2 py-1 rounded text-blue-600 cursor-pointer hover:bg-gray-200"
                onClick={() => {
                  navigator.clipboard.writeText(`{{${variable.name}}}`);
                }}
                title={variable.description}
              >
                {`{{${variable.name}}}`}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
