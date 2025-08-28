import { useEffect, useRef, useState } from 'react';
import { TemplateComponent } from '@/types/template';
import { Button } from '@/components/ui/button';
import { loadGoogleCharts, createGoogleChart, convertToGoogleChartData, GoogleChartConfig } from '@/lib/googleCharts';

interface GoogleChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
  chartType: 'bar' | 'column' | 'pie' | 'line' | 'area' | 'scatter' | 'bubble' | 'donut' | 'histogram';
  chartTitle?: string;
}

export function GoogleChartComponent({ 
  component, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  templateData = {}, 
  chartType,
  chartTitle 
}: GoogleChartComponentProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { content, style } = component;

  useEffect(() => {
    const initChart = async () => {
      if (!chartRef.current) return;

      try {
        setIsLoading(true);
        setError(null);
        
        await loadGoogleCharts();
        
        // Get chart data from template variables or component content
        let chartData;
        if (content.data && content.data.trim()) {
          if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
            // Template variable
            const variableName = content.data.slice(2, -2);
            chartData = templateData[variableName];
          } else {
            // Direct JSON data
            try {
              chartData = JSON.parse(content.data);
            } catch {
              chartData = null;
            }
          }
        }

        const googleData = convertToGoogleChartData(chartData, chartType);
        
        const config: GoogleChartConfig = {
          type: chartType,
          title: content.title || chartTitle || 'Chart',
          width: parseInt(style.width) || 400,
          height: parseInt(style.height) || 300,
          backgroundColor: style.backgroundColor || 'transparent',
          colors: content.colors || undefined,
          legend: { position: 'bottom' },
          hAxis: { title: content.hAxisTitle },
          vAxis: { title: content.vAxisTitle },
          is3D: content.is3D || false,
          pieHole: chartType === 'donut' ? 0.4 : undefined
        };

        await createGoogleChart(chartRef.current, googleData, config);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render chart');
        setIsLoading(false);
      }
    };

    initChart();
  }, [content, style, templateData, chartType, chartTitle]);

  return (
    <div
      className={`relative cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        zIndex: isSelected ? 10 : 1,
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-sm border"
        style={{
          width: style.width,
          height: style.height,
          backgroundColor: style.backgroundColor
        }}
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-500">Loading chart...</div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-red-500">Error: {error}</div>
          </div>
        )}
        
        <div 
          ref={chartRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            display: isLoading || error ? 'none' : 'block'
          }}
        />
      </div>

      {isSelected && (
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 p-0"
        >
          ×
        </Button>
      )}
    </div>
  );
}