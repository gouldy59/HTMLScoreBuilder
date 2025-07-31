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
  const PAGE_MARGIN = 40; // 20px margin on each side
  const USABLE_WIDTH = A4_WIDTH - (PAGE_MARGIN * 2);
  const USABLE_HEIGHT = A4_HEIGHT - (PAGE_MARGIN * 2);
  
  // Sort components by Y position to process them top to bottom
  const sortedComponents = [...components].sort((a, b) => 
    (a.position?.y || 0) - (b.position?.y || 0)
  );
  
  // Split components into pages based on A4 height limits
  const pagedComponents: PagedComponent[] = [];
  let currentPage = 1;
  let currentPageHeight = 0;
  
  sortedComponents.forEach((component) => {
    const position = component.position || { x: 0, y: 0 };
    const actualHeight = component.style?.height ? 
      parseInt(component.style.height.toString().replace('px', '')) : 100;
    
    // Scale from canvas dimensions to preview dimensions
    const scaleX = A4_WIDTH / 1152;
    const scaleY = A4_HEIGHT / 1632;
    
    const scaledX = Math.max(20, Math.min(position.x * scaleX, USABLE_WIDTH - 20));
    const scaledY = position.y * scaleY;
    const scaledHeight = actualHeight * scaleY;
    
    // Check if component fits on current page
    const componentBottomY = currentPageHeight + scaledHeight;
    
    if (componentBottomY > USABLE_HEIGHT && currentPageHeight > 0) {
      // Move to next page
      currentPage++;
      currentPageHeight = scaledHeight;
    } else {
      currentPageHeight = Math.max(currentPageHeight, scaledY + scaledHeight - ((currentPage - 1) * USABLE_HEIGHT));
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
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 0.5in;
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
        
        @media screen {
          .report-page {
            width: 794px;
            min-height: 1123px;
            margin: 20px auto;
            page-break-after: always;
          }
          
          .report-page:last-child {
            page-break-after: auto;
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
<div class="report-page" style="position: relative; width: 210mm; min-height: 297mm; height: auto; background-color: ${reportBackground} !important; ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}') !important; background-size: cover !important; background-repeat: no-repeat !important; background-position: center !important;` : ''} overflow: visible; padding: 20px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">`;
    
    pageComponents.forEach(component => {
      html += generatePagedComponentHTML(component, variables);
    });
    
    // Add page number footer
    if (totalPages > 1) {
      html += `<div style="position: absolute; bottom: 10px; right: 20px; font-size: 12px; color: #666;">Page ${pageNum} of ${totalPages}</div>`;
    }
    
    html += `</div>`;
  }

  html += `
</body>
</html>`;

  return html;
}

function generateChartData(variables: Record<string, any>) {
  // Check if we have Chart.js format data
  if (variables.chartData && variables.chartData.labels && variables.chartData.datasets) {
    return variables.chartData;
  }
  
  // Generate data from individual score fields
  const scoreFields = ['mathScore', 'scienceScore', 'englishScore', 'historyScore', 'artScore'];
  const labels = [];
  const data = [];
  
  scoreFields.forEach(field => {
    if (variables[field] && typeof variables[field] === 'number') {
      const subjectName = field.replace('Score', '').charAt(0).toUpperCase() + field.replace('Score', '').slice(1);
      labels.push(subjectName);
      data.push(variables[field]);
    }
  });
  
  // If no data found, use sample data
  if (labels.length === 0) {
    return {
      labels: ['Math', 'Science', 'English', 'History', 'Art'],
      datasets: [{
        label: 'Scores',
        data: [85, 92, 78, 88, 95],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        borderWidth: 1
      }]
    };
  }
  
  return {
    labels,
    datasets: [{
      label: 'Scores',
      data,
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderWidth: 1
    }]
  };
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
      const showPercentages = content.showPercentages !== false;
      const wrapLabels = content.wrapLabels === true;
      
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
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
                      Math.min(200, Math.max(80, horizontalChartData.reduce((longest, item) => {
                        const labelLength = (item.label || 'Category').length * 7;
                        return labelLength > longest ? labelLength : longest;
                      }, 80))) + 'px' : '80px'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
                }">${item.label || 'Category'}</div>
                <div style="position: relative; width: ${
                  wrapLabels ? 'calc(100% - 132px - 48px)' :
                    `calc(100% - ${horizontalChartData.length > 0 ? 
                      Math.min(200, Math.max(80, horizontalChartData.reduce((longest, item) => {
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
      // Handle chart data - check component's own data first, then variables
      let verticalChartData = null;
      
      if (content.data && content.data.trim()) {
        if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
          // Template variable
          const variableName = content.data.slice(2, -2);
          verticalChartData = variables[variableName];
        } else {
          // Direct JSON data
          try {
            verticalChartData = JSON.parse(content.data);
          } catch (e) {
            verticalChartData = null;
          }
        }
      }
      
      // Fallback to generated chart data
      if (!verticalChartData) {
        verticalChartData = generateChartData(variables);
      }
      
      let verticalChartHTML = `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">`;
      verticalChartHTML += `<h3 class="text-lg font-semibold mb-4 text-center">${replaceVariables(content.title || 'Vertical Bar Chart', variables)}</h3>`;
      
      // Chart container with axes
      verticalChartHTML += `<div style="position: relative; width: 100%; height: 300px;">
        <!-- Y-axis -->
        <div style="position: absolute; left: 0; top: 0; bottom: 50px; width: 40px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding-right: 8px;">
          <span style="font-size: 11px; color: #666;">100</span>
          <span style="font-size: 11px; color: #666;">75</span>
          <span style="font-size: 11px; color: #666;">50</span>
          <span style="font-size: 11px; color: #666;">25</span>
          <span style="font-size: 11px; color: #666;">0</span>
        </div>
        
        <!-- Chart area -->
        <div style="margin-left: 50px; height: 250px; position: relative; border-left: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb;">
          <!-- Bars container -->
          <div class="flex items-end justify-center" style="height: 100%; padding: 20px 20px 0px 20px;">`;
      
      if (verticalChartData.labels && verticalChartData.datasets && verticalChartData.datasets[0]) {
        verticalChartData.labels.forEach((label: string, index: number) => {
          const value = Math.min(verticalChartData.datasets[0].data[index], 100); // Cap at 100
          const height = Math.max((value / 100) * 210, 5); // Use 210px as max height to match chart area
          
          // Use custom colors if available, otherwise use default colors
          const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
          const barColors = content.barColors || defaultColors;
          const barColor = barColors[index % barColors.length];
          
          // Calculate bar width based on number of bars to prevent overflow
          const barCount = verticalChartData.labels.length;
          const availableWidth = 500; // Available width for bars
          const spacing = 8; // Space between bars
          const totalSpacing = (barCount - 1) * spacing;
          const maxBarWidth = Math.min(50, (availableWidth - totalSpacing) / barCount);
          
          verticalChartHTML += `<div class="flex items-end mx-1">
            <div style="width: ${maxBarWidth}px; height: ${height}px; background-color: ${barColor}; border-radius: 4px 4px 0 0; border: 1px solid ${barColor};"></div>
          </div>`;
        });
        
        verticalChartHTML += `</div>
        </div>
        <!-- Labels container - outside and below chart area -->
        <div style="margin-left: 50px; padding: 5px 20px; height: 50px;" class="flex justify-center">`;
        
        verticalChartData.labels.forEach((label: string, index: number) => {
          const value = Math.min(verticalChartData.datasets[0].data[index], 100);
          const barCount = verticalChartData.labels.length;
          const availableWidth = 500;
          const spacing = 8;
          const totalSpacing = (barCount - 1) * spacing;
          const maxBarWidth = Math.min(50, (availableWidth - totalSpacing) / barCount);
          
          verticalChartHTML += `<div class="flex flex-col items-center mx-1" style="width: ${maxBarWidth + 8}px;">
            <div class="text-sm text-gray-700 text-center" style="font-size: ${barCount > 8 ? '10px' : '12px'}; word-wrap: break-word; max-width: ${maxBarWidth + 10}px; margin-top: 2px;">${label}</div>
            <div class="text-xs text-gray-500 text-center" style="font-size: ${barCount > 8 ? '8px' : '10px'}; margin-top: 1px;">${value}</div>
          </div>`;
        });
      }
      
      verticalChartHTML += `</div>
      </div>`;
      verticalChartHTML += '</div>';
      return verticalChartHTML;

    case 'line-chart':
      const lineChartId = `line-chart-${Math.random().toString(36).substr(2, 9)}`;
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#F8FAFC'}; padding: 24px; border-radius: 8px;">
          <h3 class="text-lg font-semibold mb-4 text-center">${replaceVariables(content.title || 'Line Chart', variables)}</h3>
          <div style="height: 300px;">
            <canvas id="${lineChartId}" width="400" height="200"></canvas>
          </div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const ctx = document.getElementById('${lineChartId}').getContext('2d');
              const chartData = ${JSON.stringify(generateChartData(variables))};
              
              new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }
              });
            });
          </script>
        </div>`;

    case 'pie-chart':
      const pieChartId = `pie-chart-${Math.random().toString(36).substr(2, 9)}`;
      return `
        <div style="${positionStyle} background-color: ${style.backgroundColor || '#F8FAFC'}; padding: 24px; border-radius: 8px;">
          <h3 class="text-lg font-semibold mb-4 text-center">${replaceVariables(content.title || 'Pie Chart', variables)}</h3>
          <div style="height: 300px;">
            <canvas id="${pieChartId}" width="400" height="200"></canvas>
          </div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const ctx = document.getElementById('${pieChartId}').getContext('2d');
              const chartData = ${JSON.stringify(generateChartData(variables))};
              
              new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: {
                  responsive: true,
                  maintainAspectRatio: false
                }
              });
            });
          </script>
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
      if ((component as any).children && (component as any).children.length > 0) {
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
        (component as any).children.forEach((child: any) => {
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

    case 'bubble-chart':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Bubble Chart', variables)}</h3>
        <div class="relative h-48 bg-gray-50 rounded-lg">
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <circle cx="20" cy="30" r="5" fill="#3B82F6" opacity="0.7" />
            <circle cx="60" cy="20" r="6" fill="#10B981" opacity="0.7" />
          </svg>
        </div>
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

    case 'donut-chart':
      return `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
        <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Donut Chart', variables)}</h3>
        <div class="flex items-center justify-center">
          <svg width="200" height="160" viewBox="0 0 200 160">
            <path d="M 100 80 L 100 10 A 70 70 0 0 1 170 80 L 135 80 A 35 35 0 0 0 100 45 Z" fill="#3B82F6" opacity="0.8" />
            <text x="100" y="75" text-anchor="middle" class="text-sm font-semibold fill-gray-700">Total</text>
            <text x="100" y="90" text-anchor="middle" class="text-lg font-bold fill-gray-800">100%</text>
          </svg>
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
      return `<div style="${positionStyle} page-break-before: always; height: 2px; background-color: ${style.backgroundColor || '#EF4444'}; border: 2px dashed ${style.backgroundColor || '#EF4444'}; margin: ${style.margin || '8px 0'}; display: flex; align-items: center; justify-content: center; position: relative;">
        <span style="background-color: white; padding: 4px 8px; font-size: 12px; color: ${style.backgroundColor || '#EF4444'}; font-weight: bold; position: absolute;">
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
