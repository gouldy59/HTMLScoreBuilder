import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useLocation } from 'wouter';

interface TemplateNameWizardProps {
  onContinue: (templateName: string) => void;
  initialName?: string;
}

export function TemplateNameWizard({ onContinue, initialName = '' }: TemplateNameWizardProps) {
  const [location, setLocation] = useLocation();
  const [templateName, setTemplateName] = useState(initialName);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!templateName.trim()) {
      setError('Please enter a template name');
      return;
    }
    
    if (templateName.trim().length < 3) {
      setError('Template name must be at least 3 characters long');
      return;
    }

    setError('');
    onContinue(templateName.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleContinue();
    }
  };

  const handleBack = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Create New Template</CardTitle>
          <CardDescription>
            Start by giving your template a descriptive name. You can always change it later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              type="text"
              placeholder="e.g., Student Report Card, Math Assessment..."
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                if (error) setError('');
              }}
              onKeyPress={handleKeyPress}
              className={error ? 'border-red-500 focus:ring-red-500' : ''}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleBack} 
              variant="outline" 
              size="lg"
              className="flex-1 min-w-0"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <Button 
              onClick={handleContinue} 
              size="lg"
              className="flex-1 min-w-0"
              disabled={!templateName.trim()}
            >
              Continue to Builder
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            Step 1 of 1 • Template Setup
          </div>
        </CardContent>
      </Card>
    </div>
  );
}