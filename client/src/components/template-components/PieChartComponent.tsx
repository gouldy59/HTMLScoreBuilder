import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface PieChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function PieChartComponent({ component, isSelected, onSelect, onDelete, templateData = {} }: PieChartComponentProps) {
  const { content, style } = component;

  // Use useMemo to ensure chart data recalculates when templateData or component content changes
  const chartData = useMemo(() => {
    // Default sample data
    const sampleData = [
      { subject: 'Math', score: 85, grade: 'B+' },
      { subject: 'Science', score: 92, grade: 'A-' },
      { subject: 'English', score: 78, grade: 'B' },
      { subject: 'History', score: 88, grade: 'B+' },
      { subject: 'Art', score: 95, grade: 'A' },
    ];

    // First, check if component has its own data (from properties panel)
    if (content.data && content.data.trim()) {
      // Check if it's a template variable
      if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
        // Handle template variables - use templateData
        const variableName = content.data.slice(2, -2);
        if (templateData[variableName]) {
          const varData = templateData[variableName];
          if (varData.labels && varData.datasets && varData.datasets[0]?.data) {
            const labels = varData.labels;
            const data = varData.datasets[0].data;
            return labels.map((label: string, index: number) => {
              const score = data[index] || 0;
              let grade = 'C';
              if (score >= 90) grade = 'A';
              else if (score >= 80) grade = 'B';
              else if (score >= 70) grade = 'C';
              else if (score >= 60) grade = 'D';
              else grade = 'F';
              
              return { subject: label, score, grade };
            });
          }
        }
      } else {
        // Try to parse as JSON
        try {
          const parsedData = JSON.parse(content.data);
          if (parsedData.labels && parsedData.datasets && parsedData.datasets[0]?.data) {
            const labels = parsedData.labels;
            const data = parsedData.datasets[0].data;
            return labels.map((label: string, index: number) => {
              const score = data[index] || 0;
              let grade = 'C';
              if (score >= 90) grade = 'A';
              else if (score >= 80) grade = 'B';
              else if (score >= 70) grade = 'C';
              else if (score >= 60) grade = 'D';
              else grade = 'F';
              
              return { subject: label, score, grade };
            });
          }
        } catch (e) {
          // If JSON parsing fails, continue to other data sources
        }
      }
    }

    // If templateData has data, use it
    if (Object.keys(templateData).length > 0) {
      // Check if it's Chart.js format with labels and datasets
      if (templateData.labels && templateData.datasets && templateData.datasets[0]?.data) {
        const labels = templateData.labels;
        const data = templateData.datasets[0].data;
        const resultData = labels.map((label: string, index: number) => {
          const score = data[index] || 0;
          let grade = 'C';
          if (score >= 90) grade = 'A';
          else if (score >= 80) grade = 'B';
          else if (score >= 70) grade = 'C';
          else if (score >= 60) grade = 'D';
          else grade = 'F';
          
          return { subject: label, score, grade };
        });

        return resultData;
      }
      
      // Check for individual score fields (mathScore, scienceScore, etc.)
      const scoreFields = ['mathScore', 'scienceScore', 'englishScore', 'historyScore', 'artScore'];
      const dynamicData = [];
      
      scoreFields.forEach(field => {
        if (templateData[field] && typeof templateData[field] === 'number') {
          const subjectName = field.replace('Score', '').charAt(0).toUpperCase() + field.replace('Score', '').slice(1);
          const score = templateData[field];
          let grade = 'C';
          if (score >= 90) grade = 'A';
          else if (score >= 80) grade = 'B';
          else if (score >= 70) grade = 'C';
          else if (score >= 60) grade = 'D';
          else grade = 'F';
          
          dynamicData.push({ subject: subjectName, score, grade });
        }
      });
      
      // If we found score data, use it, otherwise fall back to sample data
      if (dynamicData.length > 0) {
        return dynamicData;
      }
    }
    
    return sampleData;
  }, [templateData, content.data]); // Re-calculate when templateData or component data changes

  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div
      className={`relative p-4 rounded-lg cursor-pointer transition-all group ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
      style={{
        backgroundColor: style.backgroundColor || '#ffffff',
        minHeight: style.height || '300px',
        width: style.width || '100%',
      }}
      onClick={onSelect}
    >
      {/* Action buttons */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="w-6 h-6 p-0 bg-white border border-gray-300 hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <i className="fas fa-cog text-xs"></i>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-6 h-6 p-0 bg-white border border-gray-300 hover:bg-gray-50 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <i className="fas fa-trash text-xs"></i>
          </Button>
        </div>
      </div>

      {/* Chart title */}
      <h3 className="text-lg font-semibold mb-4 text-center">
        {content.title || 'Pie Chart'}
      </h3>

      {/* Chart container */}
      <div style={{ height: 'calc(100% - 60px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={JSON.stringify(chartData)}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="score"
              label={({ subject, score }) => `${subject}: ${score}`}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}