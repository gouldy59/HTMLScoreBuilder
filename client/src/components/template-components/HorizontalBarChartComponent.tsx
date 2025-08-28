import { TemplateComponent } from '@/types/template';
import { GoogleChartComponent } from '@/components/GoogleChartComponent';

interface HorizontalBarChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function HorizontalBarChartComponent(props: HorizontalBarChartComponentProps) {
  return (
    <GoogleChartComponent
      {...props}
      chartType="bar"
      chartTitle="Horizontal Bar Chart"
    />
  );
}