import { TemplateComponent } from '@/types/template';
import { GoogleChartComponent } from '@/components/GoogleChartComponent';

interface PieChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function PieChartComponent(props: PieChartComponentProps) {
  return (
    <GoogleChartComponent
      {...props}
      chartType="pie"
      chartTitle="Pie Chart"
    />
  );
}