import { TemplateComponent } from '@/types/template';
import { GoogleChartComponent } from '@/components/GoogleChartComponent';

interface BubbleChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: any;
}

export function BubbleChartComponent(props: BubbleChartComponentProps) {
  return (
    <GoogleChartComponent
      {...props}
      chartType="bubble"
      chartTitle="Bubble Chart"
    />
  );
}