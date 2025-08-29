import { TemplateComponent } from '@/types/template';
import { GoogleChartComponent } from '@/components/GoogleChartComponent';

interface VerticalBarChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function VerticalBarChartComponent(props: VerticalBarChartComponentProps) {
  return (
    <GoogleChartComponent
      {...props}
      chartType="column"
      chartTitle="Column Chart"
    />
  );
}