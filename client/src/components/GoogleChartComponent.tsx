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

  // Handle component click to prevent multiple drag zones
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  };

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

        // Use chartData from component content for stacked charts
        if (!chartData && content.chartData) {
          chartData = content.chartData;
        }

        const googleData = convertToGoogleChartData(chartData, chartType);
        
        // Extract colors from stacked bar chart segments
        let extractedColors: string[] | undefined;
        if (Array.isArray(chartData) && chartData.length > 0 && chartData[0].segments) {
          extractedColors = chartData[0].segments.map((seg: any) => seg.color || '#3B82F6');
        }

        const config: GoogleChartConfig = {
          type: chartType,
          title: content.title || chartTitle || 'Chart',
          width: parseInt((style.width || '400px').replace('px', '')) || 400,
          height: parseInt((style.height || '300px').replace('px', '')) || 300,
          backgroundColor: style.backgroundColor || 'transparent',
          colors: extractedColors || content.colors || undefined,
          legend: { position: 'bottom', alignment: 'center' },
          hAxis: { title: content.hAxisTitle || '' },
          vAxis: { title: content.vAxisTitle || '' },
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
      className="component-content w-full h-full"
      style={{
        width: style.width || '400px',
        height: style.height || '300px',
        backgroundColor: style.backgroundColor || '#ffffff',
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column'
      }}
      data-chart-component="true"
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
            minHeight: '200px',
            display: isLoading || error ? 'none' : 'block'
          }}
        />
    </div>
  );
}