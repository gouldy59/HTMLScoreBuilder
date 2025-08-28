import { TemplateComponent } from '@/types/template';
import { GoogleChartComponent } from '@/components/GoogleChartComponent';

interface StackedColumnChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function StackedColumnChartComponent(props: StackedColumnChartComponentProps) {
  return (
    <GoogleChartComponent
      {...props}
      chartType="column"
      chartTitle="Stacked Column Chart"
    />
  );
}