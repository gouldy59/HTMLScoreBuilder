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
  category: 'report' | 'layout' | 'charts';
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
      fontSize: 'large',
      width: '400px',
      height: '120px'
    }
  },
  {
    id: 'bar-chart',
    name: 'Stacked Bar Chart',
    icon: 'fas fa-chart-bar',
    category: 'charts',
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
      borderRadius: '8px',
      width: '500px',
      height: '300px'
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
      textColor: '#1F2937',
      width: '350px',
      height: '200px'
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
      borderColor: '#D97706',
      width: '400px',
      height: '250px'
    }
  },
  {
    id: 'column-chart',
    name: 'Column Chart',
    icon: 'fas fa-chart-bar',
    category: 'charts',
    description: 'Vertical bar chart visualization',
    defaultContent: {
      title: 'Performance Overview',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    icon: 'fas fa-chart-line',
    category: 'charts',
    description: 'Line chart visualization',
    defaultContent: {
      title: 'Performance Trend',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    icon: 'fas fa-chart-pie',
    category: 'charts',
    description: 'Pie chart visualization',
    defaultContent: {
      title: 'Performance Distribution',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'lollipop-chart',
    name: 'Lollipop Chart',
    icon: 'fas fa-circle-dot',
    category: 'charts',
    description: 'Lollipop chart with dots and stems',
    defaultContent: {
      title: 'Performance Metrics',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'nightingale-chart',
    name: 'Nightingale Chart',
    icon: 'fas fa-dharmachakra',
    category: 'charts',
    description: 'Radial area chart (Rose diagram)',
    defaultContent: {
      title: 'Radial Analysis',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'icon-chart',
    name: 'Icon Chart',
    icon: 'fas fa-icons',
    category: 'charts',
    description: 'Data visualization using icons',
    defaultContent: {
      title: 'Icon-based Metrics',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'word-cloud',
    name: 'Word Cloud',
    icon: 'fas fa-cloud',
    category: 'charts',
    description: 'Word frequency visualization',
    defaultContent: {
      title: 'Key Terms',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'table-chart',
    name: 'Table Chart',
    icon: 'fas fa-table',
    category: 'charts',
    description: 'Enhanced data table with sorting',
    defaultContent: {
      title: 'Data Summary',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'bubble-chart',
    name: 'Bubble Chart',
    icon: 'fas fa-circle',
    category: 'charts',
    description: 'Multi-dimensional bubble visualization',
    defaultContent: {
      title: 'Bubble Analysis',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'stacked-column-chart',
    name: 'Stacked Column Chart',
    icon: 'fas fa-chart-column',
    category: 'charts',
    description: 'Vertical stacked bar chart',
    defaultContent: {
      title: 'Stacked Performance',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'donut-chart',
    name: 'Donut Chart',
    icon: 'far fa-circle',
    category: 'charts',
    description: 'Donut chart with center space',
    defaultContent: {
      title: 'Distribution Overview',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'venn-diagram',
    name: 'Venn Diagram',
    icon: 'fas fa-circle-notch',
    category: 'charts',
    description: 'Set relationships visualization',
    defaultContent: {
      title: 'Set Analysis',
      data: '{{chartData}}'
    },
    defaultStyle: {
      backgroundColor: '#F8FAFC',
      width: '400px',
      height: '300px'
    }
  },
  {
    id: 'image',
    name: 'Image',
    icon: 'fas fa-image',
    category: 'report',
    description: 'Add images to your report',
    defaultContent: {
      src: '',
      alt: 'Image description',
      caption: ''
    },
    defaultStyle: {
      width: '300px',
      height: 'auto',
      borderRadius: '8px'
    }
  },
  {
    id: 'qr-code',
    name: 'QR Code',
    icon: 'fas fa-qrcode',
    category: 'report',
    description: 'Generate QR codes for URLs or text',
    defaultContent: {
      data: 'https://example.com',
      label: 'Scan QR Code',
      size: 150
    },
    defaultStyle: {
      textAlign: 'center',
      backgroundColor: '#FFFFFF',
      padding: '16px'
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
  { name: 'rank', type: 'number', description: 'Class rank' },
  { name: 'imageUrl', type: 'string', description: 'Image URL for dynamic images' },
  { name: 'websiteUrl', type: 'string', description: 'Website URL for QR codes' },
  { name: 'studentPortal', type: 'string', description: 'Student portal URL' }
];
