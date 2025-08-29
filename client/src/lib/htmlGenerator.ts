import { TemplateComponent } from '@/types/template';
import { replaceVariables } from './templateEngine';

interface PagedComponent extends TemplateComponent {
  pageNumber: number;
  adjustedPosition: { x: number; y: number };
}

export function generateHTML(
  components: TemplateComponent[],
  variables: Record<string, any> = {},
  templateName: string = 'Generated Report',
  reportBackground: string = '#ffffff',
  reportBackgroundImage: string = ''
): string {
  // A4 dimensions in pixels (at 96 DPI): 794px × 1123px (with margins: ~754px × 1043px usable)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const PAGE_MARGIN = 96; // 1-inch margin = 96px at 96 DPI
  const USABLE_WIDTH = A4_WIDTH - (PAGE_MARGIN * 2);  // 602px usable width
  const USABLE_HEIGHT = A4_HEIGHT - (PAGE_MARGIN * 2); // 931px usable height
  
  // Sort components by Y position to process them top to bottom
  const sortedComponents = [...components].sort((a, b) => 
    (a.position?.y || 0) - (b.position?.y || 0)
  );
  
  // Debug: Log component positions to understand the scaling issue
  console.log('Canvas components positions:', sortedComponents.map(c => ({
    type: c.type,
    position: c.position,
    style: { width: c.style?.width, height: c.style?.height }
  })));
  
  // Remove debug logging for production
  // console.log = () => {};
  
  // Split components into pages based on A4 height limits and manual page breaks
  const pagedComponents: PagedComponent[] = [];
  let currentPage = 1;
  let currentPageHeight = 0;
  let manualPageBreakProcessed = false;
  
  sortedComponents.forEach((component) => {
    const position = component.position || { x: 0, y: 0 };
    
    // No scaling needed - canvas and preview are now the same size
    // Canvas: 794x1123px, A4: 794x1123px (96dpi)
    const scaleX = 1.0;  // 1:1 scaling
    const scaleY = 1.0;  // 1:1 scaling
    
    // Apply scaling to position
    let scaledY = position.y * scaleY;
    console.log(`Component ${component.type}: original Y=${position.y}, scaled Y=${scaledY}, scale=${scaleY}`);
    
    // For stacked components, ensure they don't overlap by maintaining minimum spacing
    if (pagedComponents.length > 0) {
      const lastComponent = pagedComponents[pagedComponents.length - 1];
      const lastComponentHeight = lastComponent.style?.height ? parseInt(lastComponent.style.height.toString().replace('px', '')) * scaleY : 100;
      const lastComponentBottom = lastComponent.adjustedPosition.y + lastComponentHeight;
      const minSpacing = 20; // minimum 20px spacing between components
      
      if (scaledY < lastComponentBottom + minSpacing) {
        scaledY = lastComponentBottom + minSpacing;
        console.log(`Adjusted Y from ${position.y * scaleY} to ${scaledY} to prevent overlap`);
      }
    }
    
    // Handle manual page breaks
    if (component.type === 'page-break') {
      // Add the page break component to the current page as a visual separator
      pagedComponents.push({
        ...component,
        pageNumber: currentPage,
        adjustedPosition: { x: 20, y: Math.max(20, scaledY - ((currentPage - 1) * USABLE_HEIGHT)) }
      });
      
      // Force next component to start on new page
      currentPage++;
      currentPageHeight = 0;
      manualPageBreakProcessed = true;
      return;
    }
    
    // Get component height with better fallbacks for different component types
    let actualHeight = 100; // default fallback
    if (component.style?.height) {
      actualHeight = parseInt(component.style.height.toString().replace('px', ''));
    } else {
      // Set default heights based on component type for better auto-splitting
      switch(component.type) {
        case 'bar-chart':
        case 'column-chart':
        case 'line-chart':
        case 'pie-chart':
        case 'lollipop-chart':
        case 'nightingale-chart':
        case 'icon-chart':
        case 'word-cloud':
        case 'table-chart':
        case 'bubble-chart':
        case 'stacked-column-chart':
        case 'donut-chart':
        case 'venn-diagram':
          actualHeight = 300; // Standard chart height
          break;
        case 'header':
          actualHeight = 120;
          break;
        case 'student-info':
          actualHeight = 200;
          break;
        case 'score-table':
          actualHeight = 250;
          break;
        case 'text-block':
          actualHeight = 80;
          break;
        case 'container':
          actualHeight = 200;
          break;
        default:
          actualHeight = 100;
      }
    }
    
    const scaledX = Math.max(20, Math.min(position.x * scaleX, USABLE_WIDTH - 20));
    const scaledHeight = actualHeight * scaleY;
    
    // Improved page splitting logic for auto-splitter  
    const componentAbsoluteY = scaledY;
    const componentBottomY = componentAbsoluteY + scaledHeight;
    const currentPageBottomY = currentPage * USABLE_HEIGHT;
    
    // Check if component extends beyond current page boundary
    if (componentBottomY > currentPageBottomY && componentAbsoluteY < currentPageBottomY) {
      // Component overflows current page, move to next page
      currentPage++;
      currentPageHeight = scaledHeight;
    } else if (componentAbsoluteY >= currentPageBottomY) {
      // Component starts on or after next page
      currentPage = Math.ceil(componentAbsoluteY / USABLE_HEIGHT) || 1;
      currentPageHeight = scaledHeight;
    } else {
      // Component fits on current page
      currentPageHeight = Math.max(currentPageHeight, componentBottomY - ((currentPage - 1) * USABLE_HEIGHT));
    }
    
    // Calculate adjusted position for the current page
    const adjustedY = scaledY - ((currentPage - 1) * USABLE_HEIGHT);
    
    pagedComponents.push({
      ...component,
      pageNumber: currentPage,
      adjustedPosition: { x: scaledX, y: Math.max(20, adjustedY) }
    });
  });
  
  const totalPages = Math.max(1, currentPage);
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
    <script type="text/javascript">
      google.charts.load('current', {packages: ['corechart', 'bar', 'line', 'scatter']});
    </script>
    <style>
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 1in;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            height: 100vh;
            min-height: 100vh;
          }
          
          .report-container {
            min-height: calc(100vh - 40px);
            page-break-inside: avoid;
          }
          
          .no-print { display: none; }
          .print-only { display: block; }
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 0;
          height: 100%;
          min-height: 100vh;
          background-color: #f5f5f5;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        .report-container {
          position: relative; 
          width: 210mm;
          min-height: 297mm;
          height: auto;
          background-color: ${reportBackground} !important;
          ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}') !important; background-size: cover !important; background-repeat: no-repeat !important; background-position: center !important;` : ''}
          overflow: visible;
          padding: 20px;
          margin: 0 auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Builder canvas is 1152x1632px, Preview pages are 794x1123px - scale factor 0.69 */
        
        @media screen {
          .report-page {
            width: 794px;
            min-height: 1123px;
            margin: 0 auto 40px auto; /* 40px gap between pages */
            background-color: ${reportBackground};
            ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}'); background-size: cover; background-repeat: no-repeat; background-position: center;` : ''}
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            page-break-after: always;
            position: relative;
            padding: 20px;
          }
          
          .report-page:last-child {
            page-break-after: auto;
            margin-bottom: 20px;
          }
          
          .page-separator {
            height: 40px;
            background: linear-gradient(to bottom, #f5f5f5 0%, #e5e5e5 50%, #f5f5f5 100%);
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 12px;
            font-weight: 500;
          }
        }
        
        @media print {
          .report-page {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .report-page:last-child {
            page-break-after: auto;
          }
        }
        
        .print-only { display: none; }
        
        /* Force all background colors to render */
        div, span, p, h1, h2, h3, h4, h5, h6 {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
    </style>
</head>
<body>`;

  // Generate pages with components
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const pageComponents = pagedComponents.filter(comp => comp.pageNumber === pageNum);
    
    html += `
<div class="report-page" style="position: relative; width: 794px; min-height: 1123px; height: auto; background-color: ${reportBackground} !important; ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}') !important; background-size: cover !important; background-repeat: no-repeat !important; background-position: center !important;` : ''} overflow: visible; padding: 20px; margin: 0 auto ${pageNum < totalPages ? '40px' : '20px'} auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">`;
    
    pageComponents.forEach(component => {
      html += generatePagedComponentHTML(component, variables);
    });
    
    // Add page number footer
    if (totalPages > 1) {
      html += `<div style="position: absolute; bottom: 10px; right: 20px; font-size: 12px; color: #666;">Page ${pageNum} of ${totalPages}</div>`;
    }
    
    html += `</div>`;
    
    // Add visual page separator (except after last page)
    if (pageNum < totalPages) {
      html += `<div class="page-separator no-print" style="height: 20px; background: linear-gradient(to right, transparent 0%, #ddd 20%, #ddd 80%, transparent 100%); margin: 0 auto; width: 794px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 11px; font-weight: 500;">
        <span style="background: #f5f5f5; padding: 2px 12px; border-radius: 10px; border: 1px solid #ddd;">Page ${pageNum + 1}</span>
      </div>`;
    }
  }

  html += `
</body>
</html>`;

  return html;
}

function convertToGoogleChartData(variables: Record<string, any>, componentContent?: any) {
  // Default sample data structure
  const defaultData = [
    ['Subject', 'Score'],
    ['Math', 85],
    ['Science', 92],
    ['English', 78],
    ['History', 88],
    ['Art', 95]
  ];

  // Handle stacked bar/column chart data from component content
  if (componentContent?.chartData && Array.isArray(componentContent.chartData) && componentContent.chartData.length > 0 && componentContent.chartData[0].segments) {
    const headers = ['Category'];
    const segmentLabels = componentContent.chartData[0].segments.map((seg: any) => seg.label || `Segment ${seg.value}`);
    headers.push(...segmentLabels);
    
    const rows = componentContent.chartData.map((category: any) => {
      const row = [category.label || 'Unlabeled'];
      category.segments.forEach((segment: any) => {
        row.push(Number(segment.value) || 0);
      });
      return row;
    });
    
    return [headers, ...rows];
  }

  // Check if we have Chart.js format data (legacy compatibility)
  if (variables.chartData && variables.chartData.labels && variables.chartData.datasets) {
    const labels = variables.chartData.labels;
    const data = variables.chartData.datasets[0]?.data || [];
    
    const result: (string | number)[][] = [['Category', 'Value']];
    labels.forEach((label: string, index: number) => {
      result.push([label, data[index] || 0]);
    });
    return result;
  }

  // Generate data from individual score fields
  const scoreFields = ['mathScore', 'scienceScore', 'englishScore', 'historyScore', 'artScore'];
  const scores: (string | number)[][] = [];
  
  scoreFields.forEach(field => {
    if (variables[field] && typeof variables[field] === 'number') {
      const subjectName = field.replace('Score', '').charAt(0).toUpperCase() + field.replace('Score', '').slice(1);
      scores.push([subjectName, variables[field]]);
    }
  });

  if (scores.length > 0) {
    return [['Subject', 'Score'], ...scores];
  }

  return defaultData;
}

// Generate Google Charts HTML for server-side rendering
function generateGoogleChartHTML(
  chartId: string,
  data: any[][],
  chartType: string,
  title: string,
  width: number = 400,
  height: number = 300,
  backgroundColor: string = 'transparent',
  colors?: string[],
  content?: any
): string {
  const dataString = JSON.stringify(data);
  
  const chartOptions: any = {
    title: title,
    width: width,
    height: height,
    backgroundColor: backgroundColor,
    colors: colors || ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'],
    legend: colors && colors.length > 0 && !content?.hideLegend ? { position: 'bottom', alignment: 'center' } : 'none',
    hAxis: {
      textStyle: { fontSize: 11 },
      titleTextStyle: { fontSize: 12 }
    },
    vAxis: {
      textStyle: { fontSize: 11 },
      titleTextStyle: { fontSize: 12 }
    },
    pieHole: chartType === 'donut' ? 0.4 : 0,
    chartArea: {
      left: chartType === 'bar' ? 100 : 70,
      top: chartType === 'column' ? 60 : 50,
      width: chartType === 'bar' ? '60%' : '70%',
      height: chartType === 'column' ? '60%' : '60%'
    },
    fontSize: 11,
    focusTarget: 'category'
  };
  
  // Add stacking configuration for multi-series data
  if ((chartType === 'bar' || chartType === 'column') && data.length > 1 && data[0].length > 2) {
    chartOptions.isStacked = true;
    
    // Enhanced stacking options for better visualization
    if (chartType === 'column') {
      chartOptions.bar = { groupWidth: '70%' };
      chartOptions.vAxis = {
        ...chartOptions.vAxis,
        minValue: 0,
        textStyle: { fontSize: 11 },
        gridlines: { count: 5 }
      };
      chartOptions.hAxis = {
        ...chartOptions.hAxis,
        textStyle: { fontSize: 11 },
        slantedText: false,
        maxAlternation: 1
      };
    } else if (chartType === 'bar') {
      chartOptions.bar = { groupWidth: '70%' };
      chartOptions.hAxis = {
        ...chartOptions.hAxis,
        minValue: 0,
        textStyle: { fontSize: 11 }
      };
      chartOptions.vAxis = {
        ...chartOptions.vAxis,
        textStyle: { fontSize: 11 }
      };
    }
  }
  
  const optionsString = JSON.stringify(chartOptions);

  let googleChartType = 'ColumnChart';
  switch (chartType) {
    case 'bar': googleChartType = 'BarChart'; break;
    case 'pie': googleChartType = 'PieChart'; break;
    case 'line': googleChartType = 'LineChart'; break;
    case 'area': googleChartType = 'AreaChart'; break;
    case 'scatter': googleChartType = 'ScatterChart'; break;
    case 'bubble': googleChartType = 'BubbleChart'; break;
    case 'donut': googleChartType = 'PieChart'; break;
    case 'histogram': googleChartType = 'Histogram'; break;
    default: googleChartType = 'ColumnChart';
  }

  return `
    <div id="${chartId}" style="width: ${width}px; height: ${height}px; margin: 0 auto; overflow: hidden; box-sizing: border-box;"></div>
    <script type="text/javascript">
      google.charts.setOnLoadCallback(function() {
        var data = google.visualization.arrayToDataTable(${dataString});
        var options = ${optionsString};
        var chart = new google.visualization.${googleChartType}(document.getElementById('${chartId}'));
        chart.draw(data, options);
      });
    </script>
  `;
}

function generatePagedComponentHTML(pagedComponent: PagedComponent, variables: Record<string, any>): string {
  const { type, content, style, adjustedPosition } = pagedComponent;
  
  // Use the pre-calculated adjusted position for this page
  const scaledWidth = style?.width ? 
    `${parseInt(style.width.toString().replace('px', '')) * (794 / 1152)}px` : 'auto';
  const scaledHeight = style?.height ? 
    `${parseInt(style.height.toString().replace('px', '')) * (1123 / 1632)}px` : 'auto';
  
  // Generate positioning and sizing styles with page-adjusted values
  const positionStyle = `position: absolute; left: ${adjustedPosition.x}px; top: ${adjustedPosition.y}px; width: ${scaledWidth}; height: ${scaledHeight};`;

  switch (type) {
    case 'header':
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#DBEAFE'}; color: ${style.textColor || '#1F2937'}; padding: 24px; border-radius: 8px;">
          <h1 class="text-3xl font-bold mb-2">${replaceVariables(content.title || 'Header', variables)}</h1>
          ${content.subtitle ? `<p class="text-lg opacity-80">${replaceVariables(content.subtitle, variables)}</p>` : ''}
        </div>`;

    case 'student-info':
      let studentInfoHTML = `<div style="${positionStyle} background-color: ${style.backgroundColor || '#F0FDF4'}; color: ${style.textColor || '#1F2937'}; padding: 24px; border-radius: 8px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">`;
      Object.entries(content.fields || {}).forEach(([key, value]) => {
        studentInfoHTML += `
          <div>
            <label class="text-sm font-medium opacity-70">${key}:</label>
            <p class="text-lg font-semibold">${replaceVariables(String(value), variables)}</p>
          </div>`;
      });
      studentInfoHTML += '</div>';
      return studentInfoHTML;

    case 'score-table':
      let tableHTML = `<div style="${positionStyle} background-color: ${style.backgroundColor || '#FFF7ED'}; padding: 24px; border-radius: 8px;">`;
      tableHTML += '<div style="overflow-x: auto;">';
      tableHTML += '<table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; background-color: white; border-radius: 8px; overflow: hidden;">';
      
      // Headers
      tableHTML += '<thead><tr class="bg-gray-50">';
      (content.headers || ['Subject', 'Score', 'Grade']).forEach((header: string) => {
        tableHTML += `<th class="border border-gray-300 px-4 py-3 text-left font-semibold">${header}</th>`;
      });
      tableHTML += '</tr></thead>';

      // Rows
      tableHTML += '<tbody>';
      (content.rows || []).forEach((row: any) => {
        tableHTML += '<tr class="hover:bg-gray-50">';
        Object.values(row).forEach((cell: any) => {
          tableHTML += `<td class="border border-gray-300 px-4 py-3">${replaceVariables(String(cell), variables)}</td>`;
        });
        tableHTML += '</tr>';
      });
      tableHTML += '</tbody></table></div></div>';
      return tableHTML;

    case 'bar-chart':
      const horizontalChartData = content.chartData || [];
      const title = replaceVariables(content.title || '主要领域', variables);
      const subtitle = replaceVariables(content.subtitle || '您在各个主要领域的表现', variables);

      const wrapLabels = content.wrapLabels === true;
      
      const barBgColor = content.chartBackgroundTransparent ? 'transparent' : (style.backgroundColor || '#ffffff');
      
      return `
        <div style="${positionStyle} background-color: ${barBgColor}; padding: 24px; border-radius: 8px;">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">${title}</h3>
            <p class="text-sm text-gray-600">${subtitle}</p>
          </div>
          

          
          <div class="space-y-3 mb-6">
            ${horizontalChartData.length === 0 ? `
              <div class="text-center py-8 text-gray-500">
                <p class="text-sm">No chart data available</p>
              </div>
            ` : horizontalChartData.map((item: any) => `
              <div style="display: flex; align-items: center;">
                <div style="font-size: 12px; color: #374151; padding-right: 12px; font-weight: 500; ${
                  wrapLabels ? 
                    'width: 120px; word-wrap: break-word; white-space: normal; line-height: 1.2;' :
                    `width: ${horizontalChartData.length > 0 ? 
                      Math.min(200, Math.max(80, horizontalChartData.reduce((longest: number, item: any) => {
                        const labelLength = (item.label || 'Category').length * 7;
                        return labelLength > longest ? labelLength : longest;
                      }, 80))) + 'px' : '80px'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
                }">${item.label || 'Category'}</div>
                <div style="position: relative; width: ${
                  wrapLabels ? 'calc(100% - 132px - 48px)' :
                    `calc(100% - ${horizontalChartData.length > 0 ? 
                      Math.min(200, Math.max(80, horizontalChartData.reduce((longest: number, item: any) => {
                        const labelLength = (item.label || 'Category').length * 7;
                        return labelLength > longest ? labelLength : longest;
                      }, 80))) + 12 : 92}px - 48px)`
                };">
                  <div class="flex h-6 bg-gray-100 rounded overflow-hidden relative">
                    ${(item.segments || []).map((segment: any, segIndex: number) => `
                      <div class="flex items-center justify-center text-xs font-medium" 
                           style="width: ${segment.value || 0}%; background-color: ${segment.color || '#E5E7EB'}; ${segIndex > 0 ? 'border-left: 1px solid #fff;' : ''}"
                           title="${segment.label}: ${segment.value || 0}%">

                      </div>
                    `).join('') || ''}
                    
                    ${item.scoreValue !== undefined && item.scoreValue !== null ? `
                      <div style="position: absolute; top: 50%; left: calc(${Math.min(Math.max(item.scoreValue || 0, 0), 100)}% - 6px); transform: translateY(-50%); width: 12px; height: 12px; background-color: #dc2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 10;"
                           title="Score: ${item.scoreValue}%">
                      </div>
                    ` : ''}
                  </div>
                  
                  ${item.scoreValue !== undefined && item.scoreValue !== null ? `
                    <div style="position: absolute; right: -48px; top: 0; bottom: 0; display: flex; align-items: center;">
                      <span style="font-size: 12px; font-weight: bold; color: #dc2626; background-color: white; padding: 2px 4px; border-radius: 3px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); border: 1px solid #e5e7eb;">
                        ${item.scoreValue}%
                      </span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="flex justify-center space-x-6">
            <div class="flex items-center space-x-1">
              <div class="w-4 h-4 rounded" style="background-color: #FDE2E7;"></div>
              <span class="text-xs text-gray-600">0%-25%</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-4 h-4 rounded" style="background-color: #FB923C;"></div>
              <span class="text-xs text-gray-600">26%-50%</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-4 h-4 rounded" style="background-color: #86EFAC;"></div>
              <span class="text-xs text-gray-600">51%-75%</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-4 h-4 rounded" style="background-color: #D1FAE5;"></div>
              <span class="text-xs text-gray-600">76%-100%</span>
            </div>
          </div>
        </div>
      `;

    case 'column-chart':
      // Get chart data from template or variables
      let columnChartData = null;
      if (content.data && content.data.trim()) {
        if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
          const variableName = content.data.slice(2, -2);
          columnChartData = variables[variableName];
        } else {
          try {
            columnChartData = JSON.parse(content.data);
          } catch (e) {
            columnChartData = null;
          }
        }
      }

      const googleData = convertToGoogleChartData(columnChartData || variables, content);
      const columnChartId = `column-chart-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use consistent chart dimensions between builder and preview
      const originalWidth = parseInt((style.width || '400px').replace('px', ''));
      const originalHeight = parseInt((style.height || '300px').replace('px', ''));
      
      // Subtract padding to ensure chart fits within container
      const chartWidth = Math.max(150, originalWidth - 48); // 24px padding on each side
      const chartHeight = Math.max(120, originalHeight - 120); // 60px padding top/bottom for title and legend
      
      // Extract colors for stacked column charts
      let chartColors: string[] | undefined;
      if (content.chartData && Array.isArray(content.chartData) && content.chartData[0]?.segments) {
        const colorSet = new Set<string>();
        content.chartData.forEach((category: any) => {
          if (category.segments) {
            category.segments.forEach((seg: any) => {
              if (seg.color) colorSet.add(seg.color);
            });
          }
        });
        chartColors = Array.from(colorSet);
      }

      const chartBgColor = content.chartBackgroundTransparent ? 'transparent' : (style.backgroundColor || '#ffffff');
      
      return `
        <div style="${positionStyle} background-color: ${chartBgColor}; padding: 24px; border-radius: 8px; overflow: hidden; box-sizing: border-box;">
          ${generateGoogleChartHTML(
            columnChartId, 
            googleData, 
            {
              type: 'column',
              title: replaceVariables(content.title || 'Column Chart', variables),
              width: chartWidth,
              height: chartHeight,
              backgroundColor: chartBgColor,
              colors: chartColors,
              hideLegend: content.hideLegend === true
            }
          )}
        </div>`;

    case 'line-chart':
      // Get chart data from template or variables
      let lineChartData = null;
      if (content.data && content.data.trim()) {
        if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
          const variableName = content.data.slice(2, -2);
          lineChartData = variables[variableName];
        } else {
          try {
            lineChartData = JSON.parse(content.data);
          } catch (e) {
            lineChartData = null;
          }
        }
      }

      const lineGoogleData = convertToGoogleChartData(lineChartData || variables, content);
      const lineChartId = `line-chart-${Math.random().toString(36).substr(2, 9)}`;
      const lineChartWidth = parseInt((style.width || '400px').replace('px', '')) || 400;
      const lineChartHeight = parseInt((style.height || '300px').replace('px', '')) - 100 || 300;
      
      const lineBgColor = content.chartBackgroundTransparent ? 'transparent' : (style.backgroundColor || '#F8FAFC');
      
      return `
        <div style="${positionStyle} background-color: ${lineBgColor}; padding: 24px; border-radius: 8px;">
          ${generateGoogleChartHTML(
            lineChartId, 
            lineGoogleData, 
            {
              type: 'line',
              title: replaceVariables(content.title || 'Line Chart', variables),
              width: lineChartWidth,
              height: lineChartHeight,
              backgroundColor: lineBgColor,
              hideLegend: content.hideLegend === true
            }
          )}
        </div>`;

    case 'pie-chart':
      // Get chart data from template or variables
      let pieChartData = null;
      if (content.data && content.data.trim()) {
        if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
          const variableName = content.data.slice(2, -2);
          pieChartData = variables[variableName];
        } else {
          try {
            pieChartData = JSON.parse(content.data);
          } catch (e) {
            pieChartData = null;
          }
        }
      }

      const pieGoogleData = convertToGoogleChartData(pieChartData || variables);
      const pieChartId = `pie-chart-${Math.random().toString(36).substr(2, 9)}`;
      const pieChartWidth = parseInt((style.width || '400px').replace('px', '')) || 400;
      const pieChartHeight = parseInt((style.height || '300px').replace('px', '')) - 100 || 300;
      
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#F8FAFC'}; padding: 24px; border-radius: 8px;">
          ${generateGoogleChartHTML(
            pieChartId, 
            pieGoogleData, 
            'pie',
            replaceVariables(content.title || 'Pie Chart', variables),
            pieChartWidth,
            pieChartHeight,
            style.backgroundColor || '#F8FAFC',
            undefined,
            content
          )}
        </div>`;

    case 'donut-chart':
      // Get chart data from template or variables
      let donutChartData = null;
      if (content.data && content.data.trim()) {
        if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
          const variableName = content.data.slice(2, -2);
          donutChartData = variables[variableName];
        } else {
          try {
            donutChartData = JSON.parse(content.data);
          } catch (e) {
            donutChartData = null;
          }
        }
      }

      const donutGoogleData = convertToGoogleChartData(donutChartData || variables);
      const donutChartId = `donut-chart-${Math.random().toString(36).substr(2, 9)}`;
      const donutChartWidth = parseInt((style.width || '400px').replace('px', '')) || 400;
      const donutChartHeight = parseInt((style.height || '300px').replace('px', '')) - 100 || 300;
      
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#F8FAFC'}; padding: 24px; border-radius: 8px;">
          ${generateGoogleChartHTML(
            donutChartId, 
            donutGoogleData, 
            'donut',
            replaceVariables(content.title || 'Donut Chart', variables),
            donutChartWidth,
            donutChartHeight,
            style.backgroundColor || '#F8FAFC',
            undefined,
            content
          )}
        </div>`;

    case 'bubble-chart':
      // Get chart data from template or variables - for bubble charts we need x, y, size data
      let bubbleChartData = null;
      if (content.data && content.data.trim()) {
        if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
          const variableName = content.data.slice(2, -2);
          bubbleChartData = variables[variableName];
        } else {
          try {
            bubbleChartData = JSON.parse(content.data);
          } catch (e) {
            bubbleChartData = null;
          }
        }
      }

      // For bubble charts, use sample bubble data if no specific data provided
      const bubbleGoogleData = bubbleChartData || [
        ['ID', 'X', 'Y', 'Size'],
        ['Math',    85, 92, 85],
        ['Science', 78, 88, 78], 
        ['English', 95, 85, 95],
        ['History', 68, 75, 68],
        ['Art',     90, 95, 90]
      ];
      const bubbleChartId = `bubble-chart-${Math.random().toString(36).substr(2, 9)}`;
      const bubbleChartWidth = parseInt(scaledWidth.replace('px', '')) || 400;
      const bubbleChartHeight = parseInt(scaledHeight.replace('px', '')) - 100 || 300;
      
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#F8FAFC'}; padding: 24px; border-radius: 8px;">
          ${generateGoogleChartHTML(
            bubbleChartId, 
            bubbleGoogleData, 
            'bubble',
            replaceVariables(content.title || 'Bubble Chart', variables),
            bubbleChartWidth,
            bubbleChartHeight,
            style.backgroundColor || '#F8FAFC'
          )}
        </div>`;

    case 'text-block':
      const textContent = content.html || content.text || 'Add your text content here...';
      const displayHtml = content.html 
        ? replaceVariables(textContent, variables)
        : replaceVariables(textContent, variables).split('\n').map(line => `<p style="margin: 0 0 8px 0;">${line}</p>`).join('');
      
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#FFFFFF'}; color: ${style.textColor || '#1F2937'}; font-size: ${style.fontSize || '16px'}; padding: 24px; border-radius: 8px;">
          <div style="max-width: none;">
            ${displayHtml}
          </div>
        </div>`;

    case 'divider':
      return `
        <div style="${positionStyle} height: ${style.height || '1px'}; background-color: ${style.backgroundColor || '#E5E7EB'};"></div>`;

    case 'spacer':
      return `
        <div style="${positionStyle}"></div>`;

    case 'container':
      const containerStyle = `
        ${positionStyle}
        background-color: ${style.backgroundColor || '#F9FAFB'};
        padding: ${style.padding || '16px'};
        border-radius: ${style.borderRadius || '8px'};
        color: ${style.textColor || '#374151'};
        border: 1px solid #E5E7EB;
      `;
      
      let containerHTML = `<div style="${containerStyle}">`;
      
      if (content.title) {
        containerHTML += `<h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: ${style.textColor || '#374151'};">${content.title}</h3>`;
      }
      
      if (content.description) {
        containerHTML += `<p style="font-size: 14px; opacity: 0.75; margin-bottom: 16px; color: ${style.textColor || '#374151'};">${content.description}</p>`;
      }
      
      // Render child components if they exist
      if ((pagedComponent as any).children && (pagedComponent as any).children.length > 0) {
        const layoutDirection = content.layoutDirection || 'vertical';
        const spacing = content.itemSpacing || 'medium';
        
        const spacingMap = { small: '8px', medium: '16px', large: '24px' };
        const gap = spacingMap[spacing as keyof typeof spacingMap] || '16px';
        
        let layoutStyle = '';
        switch (layoutDirection) {
          case 'horizontal':
            layoutStyle = `display: flex; flex-direction: row; flex-wrap: wrap; gap: ${gap}; align-items: flex-start;`;
            break;
          case 'grid':
            layoutStyle = `display: grid; grid-template-columns: 1fr 1fr; gap: ${gap};`;
            break;
          case 'vertical':
          default:
            layoutStyle = `display: flex; flex-direction: column; gap: ${gap};`;
        }
        
        containerHTML += `<div style="${layoutStyle}">`;
        (pagedComponent as any).children.forEach((child: any) => {
          containerHTML += generatePagedComponentHTML(child, variables);
        });
        containerHTML += `</div>`;
      } else {
        containerHTML += `<div style="min-height: 96px; display: flex; align-items: center; justify-content: center; border: 2px dashed #D1D5DB; border-radius: 4px; color: #9CA3AF;">`;
        containerHTML += `<p style="text-align: center; font-size: 14px;">Container Content Area</p>`;
        containerHTML += `</div>`;
      }
      
      containerHTML += `</div>`;
      return containerHTML;

    case 'lollipop-chart':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Lollipop Chart', variables)}</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-20 text-sm font-medium text-gray-700">Math</div>
            <div class="flex-1 flex items-center">
              <div class="h-0.5 bg-blue-400" style="width: 170px;"></div>
              <div class="w-3 h-3 rounded-full bg-blue-600 -ml-1.5" title="85%"></div>
              <span class="ml-2 text-sm text-gray-600">85%</span>
            </div>
          </div>
        </div>
      </div>`;

    case 'nightingale-chart':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Nightingale Chart', variables)}</h3>
        <div class="flex items-center justify-center h-48">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" stroke-width="1" />
            <path d="M 100 100 L 100 20 A 80 80 0 0 1 156.57 56.57 Z" fill="#3B82F6" opacity="0.8" />
            <path d="M 100 100 L 156.57 56.57 A 80 80 0 0 1 180 100 Z" fill="#10B981" opacity="0.8" />
          </svg>
        </div>
      </div>`;

    case 'icon-chart':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Icon Chart', variables)}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="text-2xl mb-2">👨‍🎓</div>
            <div class="text-lg font-semibold text-gray-800">85</div>
            <div class="text-sm text-gray-600">Students</div>
          </div>
        </div>
      </div>`;

    case 'word-cloud':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Word Cloud', variables)}</h3>
        <div class="flex flex-wrap items-center justify-center gap-2 h-48">
          <span style="font-size: 24px; color: #3B82F6; font-weight: bold;">Excellence</span>
          <span style="font-size: 20px; color: #10B981; font-weight: bold;">Achievement</span>
          <span style="font-size: 18px; color: #F59E0B; font-weight: bold;">Performance</span>
        </div>
      </div>`;

    case 'table-chart':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Performance Table', variables)}</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-2 text-left">Subject</th>
              <th class="border border-gray-300 px-4 py-2 text-center">Score</th>
              <th class="border border-gray-300 px-4 py-2 text-center">Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="border border-gray-300 px-4 py-2">Mathematics</td><td class="border border-gray-300 px-4 py-2 text-center">85</td><td class="border border-gray-300 px-4 py-2 text-center">A</td></tr>
          </tbody>
        </table>
      </div>`;



    case 'stacked-column-chart':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Stacked Column Chart', variables)}</h3>
        <div class="h-48 flex items-end justify-center gap-4">
          <div class="flex flex-col items-center">
            <div class="w-12 flex flex-col" style="height: 120px;">
              <div style="height: 30px; background-color: #3B82F6;"></div>
              <div style="height: 40px; background-color: #10B981;"></div>
              <div style="height: 50px; background-color: #F59E0B;"></div>
            </div>
            <div class="text-xs text-gray-600 mt-2">Q1</div>
          </div>
        </div>
      </div>`;



    case 'venn-diagram':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Venn Diagram', variables)}</h3>
        <div class="flex items-center justify-center h-48">
          <svg width="240" height="180" viewBox="0 0 240 180">
            <circle cx="80" cy="90" r="50" fill="#3B82F6" opacity="0.6" stroke="#3B82F6" stroke-width="2" />
            <circle cx="160" cy="90" r="50" fill="#10B981" opacity="0.6" stroke="#10B981" stroke-width="2" />
            <text x="60" y="95" text-anchor="middle" class="text-xs font-medium fill-white">25</text>
            <text x="120" y="95" text-anchor="middle" class="text-xs font-medium fill-white">15</text>
            <text x="180" y="95" text-anchor="middle" class="text-xs font-medium fill-white">30</text>
          </svg>
        </div>
      </div>`;

    case 'page-break':
      return `<div style="${positionStyle} page-break-before: always; height: 12px; background-color: ${style.backgroundColor || '#EF4444'}; border: 2px dashed ${style.backgroundColor || '#EF4444'}; margin: ${style.margin || '8px 0'}; display: flex; align-items: center; justify-content: center; position: relative; opacity: 0.8;">
        <span style="background-color: white; padding: 4px 8px; font-size: 10px; color: ${style.backgroundColor || '#EF4444'}; font-weight: bold; position: absolute; border-radius: 4px;">
          ${replaceVariables(content.label || 'Page Break', variables)}
        </span>
      </div>`;

    default:
      return `
        <div class="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <p class="text-gray-500">Unknown component type: ${type}</p>
        </div>`;
  }
}

export function downloadHTML(html: string, filename: string = 'report.html') {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
