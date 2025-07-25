import { TemplateComponent } from '@/types/template';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TableChartComponentProps {
  component: TemplateComponent;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TemplateComponent>) => void;
  onDelete: () => void;
  templateData?: Record<string, any>;
}

export function TableChartComponent({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  templateData = {}
}: TableChartComponentProps) {
  const { style, content } = component;

  // Sample table data
  const tableData = [
    { subject: 'Mathematics', score: 85, grade: 'A', trend: '↗️', status: 'Excellent' },
    { subject: 'Science', score: 92, grade: 'A+', trend: '↗️', status: 'Outstanding' },
    { subject: 'English', score: 78, grade: 'B+', trend: '→', status: 'Good' },
    { subject: 'History', score: 88, grade: 'A', trend: '↗️', status: 'Excellent' },
    { subject: 'Art', score: 95, grade: 'A+', trend: '↗️', status: 'Outstanding' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Outstanding': return 'text-green-600 bg-green-50';
      case 'Excellent': return 'text-blue-600 bg-blue-50';
      case 'Good': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
      <Card className="p-4" style={{ backgroundColor: style.backgroundColor, height: style.height }}>
        <h3 className="text-lg font-semibold mb-4">{content.title || 'Performance Table'}</h3>
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.slice(0, 4).map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.subject}</TableCell>
                  <TableCell className="text-center font-semibold">{row.score}</TableCell>
                  <TableCell className="text-center font-semibold">{row.grade}</TableCell>
                  <TableCell className="text-center text-lg">{row.trend}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      )}
    </div>
  );
}