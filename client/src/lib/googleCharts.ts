// Google Charts integration utilities

// Google Charts global types
declare global {
  interface Window {
    google: any;
    googleChartsLoaded?: boolean;
  }
}

export interface GoogleChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }>;
}

export interface GoogleChartConfig {
  type: 'bar' | 'column' | 'pie' | 'line' | 'area' | 'scatter' | 'bubble' | 'donut' | 'histogram';
  title?: string;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  colors?: string[];
  legend?: {
    position: 'top' | 'bottom' | 'left' | 'right' | 'none';
    alignment?: 'start' | 'center' | 'end';
  };
  hAxis?: {
    title?: string;
    minValue?: number;
    maxValue?: number;
  };
  vAxis?: {
    title?: string;
    minValue?: number;
    maxValue?: number;
  };
  is3D?: boolean;
  pieHole?: number; // For donut charts
}

// Load Google Charts API
export const loadGoogleCharts = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.googleChartsLoaded) {
      resolve();
      return;
    }

    if (window.google?.charts) {
      window.googleChartsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', { packages: ['corechart', 'bar', 'line', 'scatter'] });
      window.google.charts.setOnLoadCallback(() => {
        window.googleChartsLoaded = true;
        resolve();
      });
    };
    script.onerror = () => reject(new Error('Failed to load Google Charts'));
    document.head.appendChild(script);
  });
};

// Convert template data to Google Charts format
export const convertToGoogleChartData = (templateData: any, chartType: string) => {
  // Default sample data structure
  const defaultData = [
    ['Subject', 'Score'],
    ['Math', 85],
    ['Science', 92],
    ['English', 78],
    ['History', 88],
    ['Art', 95]
  ];

  // If no template data, return default
  if (!templateData) return defaultData;

  // Handle stacked bar chart data (segments-based)
  if (Array.isArray(templateData) && templateData.length > 0 && templateData[0].segments) {
    // Get all unique segment labels across all categories to ensure consistency
    const segmentLabelsSet = new Set<string>();
    templateData.forEach((category: any) => {
      if (category.segments) {
        category.segments.forEach((seg: any) => {
          segmentLabelsSet.add(seg.label || `Segment ${seg.value}`);
        });
      }
    });
    
    const segmentLabels = Array.from(segmentLabelsSet);
    const headers = ['Category', ...segmentLabels];
    
    const rows = templateData.map((category: any) => {
      const row = [category.label || 'Unlabeled'];
      
      // For each segment label, find the corresponding value
      segmentLabels.forEach((label: string) => {
        const segment = category.segments?.find((seg: any) => seg.label === label);
        row.push(Number(segment?.value) || 0);
      });
      
      return row;
    });
    
    return [headers, ...rows];
  }

  // Handle Chart.js format data (legacy compatibility)
  if (templateData.labels && templateData.datasets) {
    const labels = templateData.labels;
    const data = templateData.datasets[0]?.data || [];
    
    const result: (string | number)[][] = [['Category', 'Value']];
    labels.forEach((label: string, index: number) => {
      result.push([label, data[index] || 0]);
    });
    return result;
  }

  // Handle direct score data
  const scoreFields = ['mathScore', 'scienceScore', 'englishScore', 'historyScore', 'artScore'];
  const scores: (string | number)[][] = [];
  
  scoreFields.forEach(field => {
    if (templateData[field] && typeof templateData[field] === 'number') {
      const subjectName = field.replace('Score', '').charAt(0).toUpperCase() + field.replace('Score', '').slice(1);
      scores.push([subjectName, templateData[field]]);
    }
  });

  if (scores.length > 0) {
    return [['Subject', 'Score'], ...scores];
  }

  return defaultData;
};

// Create Google Chart instance
export const createGoogleChart = (
  element: HTMLElement,
  data: any[][],
  config: GoogleChartConfig
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.charts) {
      reject(new Error('Google Charts not loaded'));
      return;
    }

    let chart: any;
    const dataTable = window.google.visualization.arrayToDataTable(data);
    
    const options = {
      title: config.title || '',
      width: config.width || 400,
      height: config.height || 300,
      backgroundColor: config.backgroundColor || 'transparent',
      colors: config.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'],
      legend: { position: 'bottom', alignment: 'center' },
      hAxis: {
        title: config.hAxis?.title || '',
        titleTextStyle: { fontSize: 12 },
        textStyle: { fontSize: 11 }
      },
      vAxis: {
        title: config.vAxis?.title || '',
        titleTextStyle: { fontSize: 12 },
        textStyle: { fontSize: 11 },
        format: 'short'
      },
      is3D: config.is3D || false,
      pieHole: config.pieHole || 0,
      animation: {
        startup: true,
        duration: 800,
        easing: 'out'
      },
      chartArea: {
        left: config.type === 'bar' ? 120 : 80,
        top: 60,
        width: config.type === 'bar' ? '65%' : '70%',
        height: config.type === 'column' ? '75%' : '65%'
      },
      bar: { groupWidth: '75%' },
      fontSize: 11,
      focusTarget: 'category',
      tooltip: {
        isHtml: true,
        showColorCode: true
      }
    };

    // Add stacking configuration for bar and column charts with segments
    if ((config.type === 'bar' || config.type === 'column') && data.length > 1 && data[0].length > 2) {
      options.isStacked = true;
      options.focusTarget = 'category';
      
      // Enhanced stacking options for better visualization
      if (config.type === 'column') {
        options.bar = { groupWidth: '60%' };
        options.vAxis = {
          ...options.vAxis,
          minValue: 0,
          textStyle: { fontSize: 10 }
        };
        options.hAxis = {
          ...options.hAxis,
          textStyle: { fontSize: 10 },
          slantedText: false
        };
      } else if (config.type === 'bar') {
        options.bar = { groupWidth: '60%' };
        options.hAxis = {
          ...options.hAxis,
          minValue: 0,
          textStyle: { fontSize: 10 }
        };
        options.vAxis = {
          ...options.vAxis,
          textStyle: { fontSize: 10 }
        };
      }
    }

    // Create appropriate chart type
    switch (config.type) {
      case 'bar':
        chart = new window.google.visualization.BarChart(element);
        break;
      case 'column':
        chart = new window.google.visualization.ColumnChart(element);
        break;
      case 'pie':
        chart = new window.google.visualization.PieChart(element);
        break;
      case 'donut':
        chart = new window.google.visualization.PieChart(element);
        options.pieHole = config.pieHole || 0.4;
        break;
      case 'line':
        chart = new window.google.visualization.LineChart(element);
        break;
      case 'area':
        chart = new window.google.visualization.AreaChart(element);
        break;
      case 'scatter':
        chart = new window.google.visualization.ScatterChart(element);
        break;
      case 'bubble':
        chart = new window.google.visualization.BubbleChart(element);
        break;
      case 'histogram':
        chart = new window.google.visualization.Histogram(element);
        break;
      default:
        chart = new window.google.visualization.ColumnChart(element);
    }

    chart.draw(dataTable, options);
    resolve(chart);
  });
};

// Generate Google Charts HTML for server-side rendering
export const generateGoogleChartHTML = (
  chartId: string,
  data: any[][],
  config: GoogleChartConfig
): string => {
  const dataString = JSON.stringify(data);
  const optionsString = JSON.stringify({
    title: config.title || '',
    width: config.width || 400,
    height: config.height || 300,
    backgroundColor: config.backgroundColor || 'transparent',
    colors: config.colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    legend: config.legend || { position: 'bottom' },
    hAxis: config.hAxis || {},
    vAxis: config.vAxis || {},
    is3D: config.is3D || false,
    pieHole: config.pieHole || 0,
    chartArea: {
      left: 60,
      top: 40,
      width: '75%',
      height: '70%'
    }
  });

  let chartType = 'ColumnChart';
  switch (config.type) {
    case 'bar': chartType = 'BarChart'; break;
    case 'pie': chartType = 'PieChart'; break;
    case 'line': chartType = 'LineChart'; break;
    case 'area': chartType = 'AreaChart'; break;
    case 'scatter': chartType = 'ScatterChart'; break;
    case 'bubble': chartType = 'BubbleChart'; break;
    case 'donut': chartType = 'PieChart'; break;
    case 'histogram': chartType = 'Histogram'; break;
    default: chartType = 'ColumnChart';
  }

  return `
    <div id="${chartId}" style="width: ${config.width || 400}px; height: ${config.height || 300}px;"></div>
    <script type="text/javascript">
      google.charts.setOnLoadCallback(function() {
        var data = google.visualization.arrayToDataTable(${dataString});
        var options = ${optionsString};
        var chart = new google.visualization.${chartType}(document.getElementById('${chartId}'));
        chart.draw(data, options);
      });
    </script>
  `;
};