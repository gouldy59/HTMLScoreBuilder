import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Image, FileImage, Code, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  components: any[];
}

export function APITester() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [jsonData, setJsonData] = useState<string>('{\n  "studentName": "John Doe",\n  "studentId": "STU001",\n  "className": "10th Grade",\n  "mathScore": 85,\n  "scienceScore": 92,\n  "englishScore": 78\n}');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const validateJSON = (jsonString: string): any => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  const handleExportHTML = async () => {
    if (!selectedTemplateId) {
      toast({ title: 'Error', description: 'Please select a template', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      const data = validateJSON(jsonData);

      const response = await fetch(`/api/templates/${selectedTemplateId}/export-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error('Failed to export HTML');
      }

      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${selectedTemplateId}.html`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast({ title: 'Success', description: 'HTML exported successfully' });
    } catch (error) {
      console.error('HTML export error:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to export HTML', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedTemplateId) {
      toast({ title: 'Error', description: 'Please select a template', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      const data = validateJSON(jsonData);

      const response = await fetch(`/api/templates/${selectedTemplateId}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Received empty image file');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${selectedTemplateId}.png`;
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
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate image', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedTemplateId) {
      toast({ title: 'Error', description: 'Please select a template', variant: 'destructive' });
      return;
    }

    try {
      setIsLoading(true);
      const data = validateJSON(jsonData);

      const response = await fetch(`/api/templates/${selectedTemplateId}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${selectedTemplateId}.pdf`;
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
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const sampleRequests = {
    html: `POST /api/templates/{templateId}/export-html
Content-Type: application/json

{
  "data": {
    "studentName": "John Doe",
    "studentId": "STU001",
    "className": "10th Grade",
    "mathScore": 85,
    "scienceScore": 92,
    "englishScore": 78
  }
}`,
    image: `POST /api/templates/{templateId}/generate-image
Content-Type: application/json

{
  "data": {
    "studentName": "John Doe",
    "studentId": "STU001",
    "className": "10th Grade",
    "mathScore": 85,
    "scienceScore": 92,
    "englishScore": 78
  }
}`,
    pdf: `POST /api/templates/{templateId}/generate-pdf
Content-Type: application/json

{
  "data": {
    "studentName": "John Doe",
    "studentId": "STU001",
    "className": "10th Grade",
    "mathScore": 85,
    "scienceScore": 92,
    "englishScore": 78
  }
}`
  };

  return (
    <div className="space-y-6">
      {/* API Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>
            Generate reports programmatically using template ID and JSON data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Export HTML</h3>
                <p className="text-sm text-gray-500">Generate HTML file</p>
                <Badge variant="outline" className="mt-1">POST</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Generate Image</h3>
                <p className="text-sm text-gray-500">Generate PNG file</p>
                <Badge variant="outline" className="mt-1">POST</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FileImage className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium">Generate PDF</h3>
                <p className="text-sm text-gray-500">Generate PDF file</p>
                <Badge variant="outline" className="mt-1">POST</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              API Tester
            </CardTitle>
            <CardDescription>
              Test the API endpoints with your templates and data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template-select">Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} (ID: {template.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="json-data">JSON Data</Label>
              <Textarea
                id="json-data"
                placeholder="Enter JSON data..."
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button 
                onClick={handleExportHTML}
                disabled={isLoading}
                variant="outline"
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export HTML
              </Button>
              <Button 
                onClick={handleGenerateImage}
                disabled={isLoading}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                <Image className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
              <Button 
                onClick={handleGeneratePDF}
                disabled={isLoading}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <FileImage className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Section */}
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>
              Sample requests for each endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="pdf">PDF</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-4">
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{sampleRequests.html}</code>
                </pre>
              </TabsContent>
              <TabsContent value="image" className="mt-4">
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{sampleRequests.image}</code>
                </pre>
              </TabsContent>
              <TabsContent value="pdf" className="mt-4">
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-x-auto">
                  <code>{sampleRequests.pdf}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}