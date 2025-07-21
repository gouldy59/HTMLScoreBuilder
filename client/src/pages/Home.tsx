import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplateManager } from '@/components/TemplateManager';
import { APITester } from '@/components/APITester';
import { FileText, Search, History, Plus } from 'lucide-react';
import { useLocation } from 'wouter';

export function Home() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('builder');

  // Check for tab parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const tab = urlParams.get('tab');
    if (tab === 'templates') {
      setActiveTab('templates');
    } else if (tab === 'api') {
      setActiveTab('api');
    }
  }, [location]);

  const handleCreateNew = () => {
    setLocation('/builder/new');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Score Report Builder</h1>
              <p className="mt-1 text-sm text-gray-500">Create and manage professional score report templates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Page Builder</TabsTrigger>
            <TabsTrigger value="templates">Template Manager</TabsTrigger>
            <TabsTrigger value="api">API Endpoints</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Create New Template
                </CardTitle>
                <CardDescription>
                  Design professional score reports with our drag-and-drop page builder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Drag & Drop Components</h3>
                      <p className="text-sm text-gray-500">Add headers, charts, tables, and more</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Search className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Dynamic Data</h3>
                      <p className="text-sm text-gray-500">Import JSON data for live previews</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <History className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Export Options</h3>
                      <p className="text-sm text-gray-500">Generate HTML, PDF, and PNG files</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button onClick={handleCreateNew} className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Building
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplateManager />
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <APITester />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}