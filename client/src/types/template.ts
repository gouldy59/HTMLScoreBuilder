export interface TemplateComponent {
  id: string;
  type: string;
  content: Record<string, any>;
  style: Record<string, any>;
  position: {
    x: number;
    y: number;
  };
  children?: TemplateComponent[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  defaultValue?: any;
}

export interface ComponentType {
  id: string;
  name: string;
  icon: string;
  category: 'report' | 'layout';
  description: string;
  defaultContent: Record<string, any>;
  defaultStyle: Record<string, any>;
}

export const COMPONENT_TYPES: ComponentType[] = [
  {
    id: 'header',
    name: 'Header',
    icon: 'fas fa-heading',
    category: 'report',
    description: 'Title and subtitle sections',
    defaultContent: {
      title: '{{studentName}} - Academic Score Report',
      subtitle: 'Academic Year {{academicYear}} • Grade {{grade}}'
    },
    defaultStyle: {
      backgroundColor: '#DBEAFE',
      textColor: '#1F2937',
      fontSize: 'large'
    }
  },
  {
    id: 'horizontal-bar-chart',
    name: 'Horizontal Bar Chart',
    icon: 'fas fa-chart-bar',
    category: 'report',
    description: 'Segmented horizontal bar chart with multiple data series',
    defaultContent: {
      title: 'Chart Title',
      subtitle: 'Add your chart description here',
      showPercentages: true,
      chartData: [
        {
          label: "Category A",
          scoreValue: 65,
          segments: [
            { value: 25, color: "#FDE2E7", label: "0%-25%" },
            { value: 25, color: "#FB923C", label: "26%-50%" },
            { value: 25, color: "#FEF3C7", label: "51%-75%" },
            { value: 25, color: "#D1FAE5", label: "76%-100%" }
          ]
        },
        {
          label: "Category B",
          scoreValue: 78,
          segments: [
            { value: 25, color: "#FDE2E7", label: "0%-25%" },
            { value: 25, color: "#FB923C", label: "26%-50%" },
            { value: 25, color: "#FEF3C7", label: "51%-75%" },
            { value: 25, color: "#D1FAE5", label: "76%-100%" }
          ]
        },
        {
          label: "Category C",
          scoreValue: 42,
          segments: [
            { value: 25, color: "#FDE2E7", label: "0%-25%" },
            { value: 25, color: "#FB923C", label: "26%-50%" },
            { value: 25, color: "#86EFAC", label: "51%-75%" },
            { value: 25, color: "#D1FAE5", label: "76%-100%" }
          ]
        }
      ]
    },
    defaultStyle: {
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '8px'
    }
  },
  {
    id: 'student-info',
    name: 'Student Info',
    icon: 'fas fa-user',
    category: 'report',
    description: 'Student details card',
    defaultContent: {
      fields: {
        'Student Name': '{{studentName}}',
        'Student ID': '{{studentId}}',
        'Class': '{{className}}',
        'Teacher': '{{teacherName}}'
      }
    },
    defaultStyle: {
      backgroundColor: '#F0FDF4',
      textColor: '#1F2937'
    }
  },
  {
    id: 'score-table',
    name: 'Score Table',
    icon: 'fas fa-table',
    category: 'report',
    description: 'Structured score display',
    defaultContent: {
      headers: ['Subject', 'Score', 'Grade', 'Max Score'],
      rows: [
        { subject: 'Mathematics', score: '{{mathScore}}', grade: '{{mathGrade}}', maxScore: '100' },
        { subject: 'Science', score: '{{scienceScore}}', grade: '{{scienceGrade}}', maxScore: '100' },
        { subject: 'English', score: '{{englishScore}}', grade: '{{englishGrade}}', maxScore: '100' }
      ]
    },
    defaultStyle: {
      backgroundColor: '#FFF7ED',
      borderColor: '#D97706'
    }
  },
  {
    id: 'chart',
    name: 'Chart',
    icon: 'fas fa-chart-bar',
    category: 'report',
    description: 'Visual data representation',
    defaultContent: {
      chartType: 'bar',
      data: '{{chartData}}',
      title: 'Performance Overview'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      height: '300px'
    }
  },
  {
    id: 'text-block',
    name: 'Text Block',
    icon: 'fas fa-paragraph',
    category: 'report',
    description: 'Formatted text content',
    defaultContent: {
      text: 'Add your text content here. You can use variables like {{studentName}} to make it dynamic.'
    },
    defaultStyle: {
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937'
    }
  },
  {
    id: 'grade-summary',
    name: 'Grade Summary',
    icon: 'fas fa-medal',
    category: 'report',
    description: 'Overall grade display',
    defaultContent: {
      overallGrade: '{{overallGrade}}',
      gpa: '{{gpa}}',
      rank: '{{rank}}'
    },
    defaultStyle: {
      backgroundColor: '#EFF6FF',
      textColor: '#1F2937'
    }
  },
  {
    id: 'container',
    name: 'Container',
    icon: 'fas fa-square',
    category: 'layout',
    description: 'Content wrapper',
    defaultContent: {},
    defaultStyle: {
      backgroundColor: '#F9FAFB',
      padding: '16px',
      borderRadius: '8px'
    }
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: 'fas fa-minus',
    category: 'layout',
    description: 'Section separator',
    defaultContent: {},
    defaultStyle: {
      height: '1px',
      backgroundColor: '#E5E7EB',
      margin: '16px 0'
    }
  },
  {
    id: 'spacer',
    name: 'Spacer',
    icon: 'fas fa-arrows-alt-v',
    category: 'layout',
    description: 'Vertical spacing',
    defaultContent: {},
    defaultStyle: {
      height: '32px'
    }
  }
];

export const DEFAULT_VARIABLES: TemplateVariable[] = [
  { name: 'studentName', type: 'string', description: 'Student full name' },
  { name: 'studentId', type: 'string', description: 'Student identification number' },
  { name: 'className', type: 'string', description: 'Class or grade level' },
  { name: 'teacherName', type: 'string', description: 'Teacher name' },
  { name: 'academicYear', type: 'string', description: 'Academic year' },
  { name: 'grade', type: 'string', description: 'Grade level' },
  { name: 'mathScore', type: 'number', description: 'Mathematics score' },
  { name: 'mathGrade', type: 'string', description: 'Mathematics grade letter' },
  { name: 'scienceScore', type: 'number', description: 'Science score' },
  { name: 'scienceGrade', type: 'string', description: 'Science grade letter' },
  { name: 'englishScore', type: 'number', description: 'English score' },
  { name: 'englishGrade', type: 'string', description: 'English grade letter' },
  { name: 'overallGrade', type: 'string', description: 'Overall grade' },
  { name: 'gpa', type: 'number', description: 'Grade Point Average' },
  { name: 'rank', type: 'number', description: 'Class rank' }
];
