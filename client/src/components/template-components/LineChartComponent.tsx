import { TemplateComponent } from '@/types/template';
import { GoogleChartComponent } from '@/components/GoogleChartComponent';

interface LineChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function LineChartComponent(props: LineChartComponentProps) {
  return (
    <GoogleChartComponent
      {...props}
      chartType="line"
      chartTitle="Line Chart"
    />
  );
}