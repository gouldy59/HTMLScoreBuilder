import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

interface ChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function ChartComponent({ component, isSelected, onSelect, onDelete, templateData = {} }: ChartComponentProps) {
  const { content, style } = component;



  // Use useMemo to ensure chart data recalculates when templateData changes
  const chartData = useMemo(() => {
    // Default sample data
    const sampleData = [
      { subject: 'Math', score: 85, grade: 'B+' },
      { subject: 'Science', score: 92, grade: 'A-' },
      { subject: 'English', score: 78, grade: 'B' },
      { subject: 'History', score: 88, grade: 'B+' },
      { subject: 'Art', score: 95, grade: 'A' },
    ];

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
  }, [templateData]); // Re-calculate when templateData changes



  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const renderChart = () => {
    const chartType = content.chartType || 'bar';
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} key={JSON.stringify(chartData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} key={JSON.stringify(chartData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={JSON.stringify(chartData)}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={60}
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
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <i className="fas fa-chart-bar text-3xl mb-2"></i>
              <p>Unsupported chart type: {chartType}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative p-6 rounded-lg cursor-pointer transition-all group ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
      style={{
        backgroundColor: style.backgroundColor || '#F8FAFC',
        height: style.height || '300px',
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

      <h3 className="text-lg font-semibold mb-4">{content.title || 'Performance Chart'}</h3>
      <div className="h-48">
        {renderChart()}
      </div>
    </div>
  );
}
