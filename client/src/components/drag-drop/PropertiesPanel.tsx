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
  reportBackground?: string;
  onUpdateReportBackground?: (color: string) => void;
}

export function PropertiesPanel({ selectedComponent, onUpdateComponent, reportBackground, onUpdateReportBackground }: PropertiesPanelProps) {
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

      case 'image':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="imageSrc">Image URL</Label>
              <Input
                id="imageSrc"
                value={selectedComponent.content.src || ''}
                onChange={(e) => updateContent('src', e.target.value)}
                placeholder="https://example.com/image.jpg or {{imageUrl}}"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a direct image URL or use template variables like {{imageUrl}}
              </p>
            </div>
            <div>
              <Label htmlFor="imageAlt">Alt Text</Label>
              <Input
                id="imageAlt"
                value={selectedComponent.content.alt || ''}
                onChange={(e) => updateContent('alt', e.target.value)}
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div>
              <Label htmlFor="imageCaption">Caption (Optional)</Label>
              <Input
                id="imageCaption"
                value={selectedComponent.content.caption || ''}
                onChange={(e) => updateContent('caption', e.target.value)}
                placeholder="Image caption or description"
              />
            </div>
          </div>
        );

      case 'column-chart':
        const defaultBarColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
        const barColors = selectedComponent.content.barColors || defaultBarColors;
        
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
            
            {/* Bar Color Customization */}
            <div>
              <Label className="text-sm font-medium">Bar Colors</Label>
              <p className="text-xs text-gray-500 mb-3">Customize the color of each bar in your chart</p>
              <div className="grid grid-cols-2 gap-2">
                {barColors.slice(0, 8).map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs w-8 text-gray-600">#{index + 1}</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...barColors];
                        newColors[index] = e.target.value;
                        updateContent('barColors', newColors);
                      }}
                      className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={color}
                      onChange={(e) => {
                        const newColors = [...barColors];
                        newColors[index] = e.target.value;
                        updateContent('barColors', newColors);
                      }}
                      className="flex-1 text-xs"
                      placeholder="#3B82F6"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  updateContent('barColors', [...defaultBarColors]);
                }}
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs"
              >
                Reset All Colors
              </Button>
            </div>
          </div>
        );
      
      case 'line-chart':
      case 'pie-chart':
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

      case 'bar-chart':
        const chartData = selectedComponent.content.chartData || [];
        
        const addCategory = () => {
          if (chartData.length >= 20) return; // Limit to 20 bars
          const newCategory = {
            label: `Category ${chartData.length + 1}`,
            scoreValue: 50,
            segments: [
              { value: 25, color: "#FDE2E7", label: "0%-25%" },
              { value: 25, color: "#FB923C", label: "26%-50%" },
              { value: 25, color: "#FEF3C7", label: "51%-75%" },
              { value: 25, color: "#D1FAE5", label: "76%-100%" }
            ]
          };
          updateContent('chartData', [...chartData, newCategory]);
        };
        
        const removeCategory = (index: number) => {
          const newData = chartData.filter((_: any, i: number) => i !== index);
          updateContent('chartData', newData);
        };
        
        const updateCategory = (index: number, field: string, value: any) => {
          const newData = [...chartData];
          newData[index] = { ...newData[index], [field]: value };
          updateContent('chartData', newData);
        };
        
        const updateSegment = (categoryIndex: number, segmentIndex: number, field: string, value: any) => {
          const newData = [...chartData];
          const newSegments = [...newData[categoryIndex].segments];
          newSegments[segmentIndex] = { ...newSegments[segmentIndex], [field]: value };
          newData[categoryIndex] = { ...newData[categoryIndex], segments: newSegments };
          updateContent('chartData', newData);
        };

        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="chartTitle">Chart Title</Label>
              <Input
                id="chartTitle"
                value={selectedComponent.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Chart title"
              />
            </div>
            <div>
              <Label htmlFor="chartSubtitle">Subtitle</Label>
              <Input
                id="chartSubtitle"
                value={selectedComponent.content.subtitle || ''}
                onChange={(e) => updateContent('subtitle', e.target.value)}
                placeholder="Chart subtitle"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPercentages"
                checked={selectedComponent.content.showPercentages !== false}
                onChange={(e) => updateContent('showPercentages', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="showPercentages" className="text-sm">Show percentage values inside bars</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="wrapLabels"
                checked={selectedComponent.content.wrapLabels === true}
                onChange={(e) => updateContent('wrapLabels', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="wrapLabels" className="text-sm">Wrap long category labels to new line</Label>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Chart Categories ({chartData.length}/20)</Label>
                <Button
                  onClick={addCategory}
                  disabled={chartData.length >= 20}
                  variant="outline"
                  size="sm"
                >
                  <i className="fas fa-plus mr-1 text-xs"></i>Add Category
                </Button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {chartData.map((category: any, categoryIndex: number) => (
                  <div key={categoryIndex} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={category.label || ''}
                        onChange={(e) => updateCategory(categoryIndex, 'label', e.target.value)}
                        placeholder="Category name"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeCategory(categoryIndex)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </Button>
                    </div>
                    
                    {/* Score Pointer Control */}
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-xs font-medium">Score Pointer:</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={category.scoreValue || ''}
                        onChange={(e) => updateCategory(categoryIndex, 'scoreValue', parseInt(e.target.value) || 0)}
                        placeholder="Score %"
                        className="w-20 text-xs"
                      />
                      <span className="text-xs text-gray-500">% (0-100)</span>
                      <Button
                        onClick={() => updateCategory(categoryIndex, 'scoreValue', null)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Hide
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {category.segments?.map((segment: any, segmentIndex: number) => (
                        <div key={segmentIndex} className="flex items-center gap-1">
                          <input
                            type="color"
                            value={segment.color || '#FDE2E7'}
                            onChange={(e) => updateSegment(categoryIndex, segmentIndex, 'color', e.target.value)}
                            className="w-6 h-6 rounded border cursor-pointer"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={segment.value || 0}
                            onChange={(e) => updateSegment(categoryIndex, segmentIndex, 'value', parseInt(e.target.value) || 0)}
                            className="w-16 text-xs"
                          />
                          <span className="text-xs text-gray-500">{segment.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <Label>Quick Actions</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => {
                    const jsonData = JSON.stringify(selectedComponent.content.chartData || [], null, 2);
                    navigator.clipboard.writeText(jsonData);
                    toast({ title: 'Chart data copied to clipboard' });
                  }}
                  variant="outline"
                  size="sm"
                >
                  <i className="fas fa-copy mr-1 text-xs"></i>Copy JSON
                </Button>
                <Button
                  onClick={() => {
                    updateContent('chartData', [
                      {
                        label: "Sample Category",
                        scoreValue: 65,
                        segments: [
                          { value: 25, color: "#FDE2E7", label: "0%-25%" },
                          { value: 25, color: "#FB923C", label: "26%-50%" },
                          { value: 25, color: "#FEF3C7", label: "51%-75%" },
                          { value: 25, color: "#D1FAE5", label: "76%-100%" }
                        ]
                      }
                    ]);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <i className="fas fa-refresh mr-1 text-xs"></i>Reset
                </Button>
              </div>
            </div>
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

      case 'lollipop-chart':
      case 'nightingale-chart':
      case 'icon-chart':
      case 'word-cloud':
      case 'table-chart':
      case 'bubble-chart':
      case 'stacked-column-chart':
      case 'donut-chart':
      case 'venn-diagram':
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
              <Label htmlFor="chartData">Chart Data</Label>
              <Textarea
                id="chartData"
                value={selectedComponent.content.data || ''}
                onChange={(e) => updateContent('data', e.target.value)}
                placeholder="{{chartData}} or custom data..."
                className="min-h-20"
              />
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
      {/* Global Report Settings */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <h4 className="font-medium text-gray-900 mb-3">Report Settings</h4>
        <div>
          <Label htmlFor="reportBackground">Report Background</Label>
          <div className="flex items-center gap-2 mt-1">
            <input
              id="reportBackground"
              type="color"
              value={reportBackground || '#ffffff'}
              onChange={(e) => onUpdateReportBackground?.(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300"
            />
            <Input
              type="text"
              value={reportBackground || '#ffffff'}
              onChange={(e) => onUpdateReportBackground?.(e.target.value)}
              className="flex-1"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>

      {selectedComponent ? (
        <>
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
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center text-gray-500">
          <div>
            <i className="fas fa-cursor-pointer text-3xl mb-4 text-gray-400"></i>
            <p>Select a component to edit its properties</p>
          </div>
        </div>
      )}
    </div>
  );
}
