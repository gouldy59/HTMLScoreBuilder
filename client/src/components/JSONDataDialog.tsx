import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validateJSON, validateTemplateData, validateChartData, validateStudentInfo, validateScoreData, getExampleJSON } from '@/lib/jsonValidator';
import { useToast } from '@/hooks/use-toast';

interface JSONDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: any) => void;
  title?: string;
  description?: string;
}

export function JSONDataDialog({ isOpen, onClose, onApplyData, title = "Import JSON Data", description = "Import and validate JSON data for your template" }: JSONDataDialogProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [validationType, setValidationType] = useState<'template' | 'chart' | 'student' | 'score'>('template');
  const [validationError, setValidationError] = useState('');
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  const validateInput = (input: string, type: string) => {
    if (!input.trim()) {
      setValidationError('');
      setIsValid(false);
      return;
    }

    const jsonValidation = validateJSON(input);
    if (!jsonValidation.isValid) {
      setValidationError(`JSON Format Error: ${jsonValidation.error}`);
      setIsValid(false);
      return;
    }

    let dataValidation;
    switch (type) {
      case 'template':
        dataValidation = validateTemplateData(jsonValidation.data);
        break;
      case 'chart':
        dataValidation = validateChartData(jsonValidation.data);
        break;
      case 'student':
        dataValidation = validateStudentInfo(jsonValidation.data);
        break;
      case 'score':
        dataValidation = validateScoreData(jsonValidation.data);
        break;
      default:
        dataValidation = { isValid: true, data: jsonValidation.data };
    }

    if (!dataValidation.isValid) {
      setValidationError(dataValidation.error || 'Validation failed');
      setIsValid(false);
    } else {
      setValidationError('');
      setIsValid(true);
    }
  };

  const handleInputChange = (value: string) => {
    setJsonInput(value);
    validateInput(value, validationType);
  };

  const handleValidationTypeChange = (type: string) => {
    setValidationType(type as any);
    validateInput(jsonInput, type);
  };

  const handleLoadExample = () => {
    const example = getExampleJSON(validationType);
    setJsonInput(example);
    validateInput(example, validationType);
  };

  const handleApply = () => {
    if (!isValid) {
      toast({ 
        title: 'Invalid Data', 
        description: 'Please fix validation errors before applying', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const data = JSON.parse(jsonInput);
      onApplyData(data);
      onClose();
      setJsonInput('');
      setValidationError('');
      setIsValid(false);
      toast({ 
        title: 'Data Applied', 
        description: 'JSON data has been successfully applied to your template' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to apply data', 
        variant: 'destructive' 
      });
    }
  };

  const handleClose = () => {
    onClose();
    setJsonInput('');
    setValidationError('');
    setIsValid(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-gray-600">{description}</p>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <Label htmlFor="validationType">Data Type</Label>
            <Select value={validationType} onValueChange={handleValidationTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Template Data (Student Info + Scores)</SelectItem>
                <SelectItem value="chart">Chart Data</SelectItem>
                <SelectItem value="student">Student Information</SelectItem>
                <SelectItem value="score">Score Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="jsonInput">JSON Data</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadExample}
                >
                  <i className="fas fa-lightbulb mr-1 text-xs"></i>
                  Load Example
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => validateInput(jsonInput, validationType)}
                >
                  <i className="fas fa-check mr-1 text-xs"></i>
                  Validate
                </Button>
              </div>
            </div>
            <Textarea
              id="jsonInput"
              value={jsonInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="min-h-64 font-mono text-sm"
            />
            {validationError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {validationError}
                </p>
              </div>
            )}
            {isValid && !validationError && jsonInput && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  <i className="fas fa-check-circle mr-2"></i>
                  JSON data is valid and ready to apply
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use the "Load Example" button to see the expected data format</li>
              <li>All JSON data must be properly formatted with correct syntax</li>
              <li>Template data should include student information and scores</li>
              <li>Chart data requires labels and datasets with numeric values</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!isValid}
            className={isValid ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <i className="fas fa-upload mr-2"></i>
            Apply Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}