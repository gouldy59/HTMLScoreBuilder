import { TemplateComponent } from '@/types/template';
import { GoogleChartComponent } from '@/components/GoogleChartComponent';

interface DonutChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function DonutChartComponent(props: DonutChartComponentProps) {
  return (
    <GoogleChartComponent
      {...props}
      chartType="donut"
      chartTitle="Donut Chart"
    />
  );
}