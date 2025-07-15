import { TemplateComponent } from '@/types/template';
import { replaceVariables } from './templateEngine';

export function generateHTML(
  components: TemplateComponent[],
  variables: Record<string, any> = {},
  templateName: string = 'Generated Report',
  reportBackground: string = '#ffffff'
): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .print-only { display: none; }
        @media print {
            .no-print { display: none; }
            .print-only { display: block; }
        }
    </style>
</head>
<body class="p-8 max-w-4xl mx-auto" style="background-color: ${reportBackground};">`;

  // Sort components by position
  const sortedComponents = [...components].sort((a, b) => a.position.y - b.position.y);

  sortedComponents.forEach(component => {
    html += generateComponentHTML(component, variables);
  });

  html += `
</body>
</html>`;

  return html;
}

function generateComponentHTML(component: TemplateComponent, variables: Record<string, any>): string {
  const { type, content, style } = component;

  switch (type) {
    case 'header':
      return `
        <div class="mb-6 p-6 rounded-lg" style="background-color: ${style.backgroundColor || '#DBEAFE'}; color: ${style.textColor || '#1F2937'};">
          <h1 class="text-3xl font-bold mb-2">${replaceVariables(content.title || 'Header', variables)}</h1>
          ${content.subtitle ? `<p class="text-lg opacity-80">${replaceVariables(content.subtitle, variables)}</p>` : ''}
        </div>`;

    case 'student-info':
      let studentInfoHTML = `<div class="mb-6 p-6 rounded-lg grid grid-cols-2 gap-4" style="background-color: ${style.backgroundColor || '#F0FDF4'}; color: ${style.textColor || '#1F2937'};">`;
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
      let tableHTML = `<div class="mb-6 p-6 rounded-lg" style="background-color: ${style.backgroundColor || '#FFF7ED'};">`;
      tableHTML += '<div class="overflow-x-auto">';
      tableHTML += '<table class="w-full border-collapse border border-gray-300 bg-white rounded-lg overflow-hidden">';
      
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

    case 'horizontal-bar-chart':
      const horizontalChartData = component.content.chartData || [];
      const title = replaceVariables(component.content.title || '主要领域', variables);
      const subtitle = replaceVariables(component.content.subtitle || '您在各个主要领域的表现', variables);
      
      return `
        <div class="mb-6 p-6 rounded-lg" style="background-color: ${style.backgroundColor || '#ffffff'}; max-width: 768px; margin-left: auto; margin-right: auto;">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">${title}</h3>
            <p class="text-sm text-gray-600">${subtitle}</p>
          </div>
          
          <div class="flex justify-between text-xs text-gray-500 mb-2" style="padding: 0 128px;">
            <span>0%</span><span>25%</span><span>26%</span><span>50%</span><span>51%</span><span>75%</span><span>76%</span><span>100%</span>
          </div>
          
          <div class="space-y-3 mb-6">
            ${horizontalChartData.length === 0 ? `
              <div class="text-center py-8 text-gray-500">
                <p class="text-sm">No chart data available</p>
              </div>
            ` : horizontalChartData.map((item: any) => `
              <div class="flex items-center">
                <div class="w-24 text-sm text-gray-700 pr-3 font-medium">${item.label || 'Category'}</div>
                <div class="flex-1 relative">
                  <div class="flex h-6 bg-gray-100 rounded overflow-hidden relative">
                    ${(item.segments || []).map((segment: any, segIndex: number) => `
                      <div class="flex items-center justify-center text-xs font-medium" 
                           style="width: ${segment.value || 0}%; background-color: ${segment.color || '#E5E7EB'}; ${segIndex > 0 ? 'border-left: 1px solid #fff;' : ''}"
                           title="${segment.label}: ${segment.value || 0}%">
                        ${(segment.value || 0) > 10 ? (segment.value || 0) + '%' : ''}
                      </div>
                    `).join('') || ''}
                    
                    ${item.scoreValue !== undefined && item.scoreValue !== null ? `
                      <div style="position: absolute; top: 0; bottom: 0; width: 2px; background-color: #dc2626; left: ${Math.min(Math.max(item.scoreValue || 0, 0), 100)}%; z-index: 10;"
                           title="Score: ${item.scoreValue}%">
                        <div style="position: absolute; top: -8px; left: -8px; width: 16px; height: 16px; background-color: #dc2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
                        <div style="position: absolute; bottom: -8px; left: -8px; width: 16px; height: 16px; background-color: #dc2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
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

    case 'chart':
      const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;
      const chartType = content.chartType || 'bar';
      return `
        <div class="mb-6 p-6 rounded-lg" style="background-color: ${style.backgroundColor || '#F8FAFC'};">
          <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Performance Chart', variables)}</h3>
          <div style="height: 300px;">
            <canvas id="${chartId}" width="400" height="200"></canvas>
          </div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const ctx = document.getElementById('${chartId}').getContext('2d');
              const sampleData = {
                labels: ['Math', 'Science', 'English', 'History', 'Art'],
                datasets: [{
                  label: 'Scores',
                  data: [85, 92, 78, 88, 95],
                  backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                  borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
                  borderWidth: 1
                }]
              };
              
              new Chart(ctx, {
                type: '${chartType}',
                data: sampleData,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: ${chartType !== 'pie' ? `{
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }` : '{}'}
                }
              });
            });
          </script>
        </div>`;

    case 'text-block':
      return `
        <div class="mb-6 p-6 rounded-lg" style="background-color: ${style.backgroundColor || '#FFFFFF'}; color: ${style.textColor || '#1F2937'};">
          <div class="prose max-w-none">
            ${replaceVariables(content.text || '', variables).split('\n').map(line => `<p>${line}</p>`).join('')}
          </div>
        </div>`;

    case 'grade-summary':
      return `
        <div class="mb-6 p-6 rounded-lg text-center" style="background-color: ${style.backgroundColor || '#EFF6FF'}; color: ${style.textColor || '#1F2937'};">
          <h3 class="text-2xl font-bold mb-4">Overall Performance</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="text-sm opacity-70">Grade</p>
              <p class="text-3xl font-bold">${replaceVariables(content.overallGrade || '{{overallGrade}}', variables)}</p>
            </div>
            <div>
              <p class="text-sm opacity-70">GPA</p>
              <p class="text-3xl font-bold">${replaceVariables(content.gpa || '{{gpa}}', variables)}</p>
            </div>
            <div>
              <p class="text-sm opacity-70">Class Rank</p>
              <p class="text-3xl font-bold">${replaceVariables(content.rank || '{{rank}}', variables)}</p>
            </div>
          </div>
        </div>`;

    case 'divider':
      return `
        <div class="mb-6" style="height: ${style.height || '1px'}; background-color: ${style.backgroundColor || '#E5E7EB'}; margin: ${style.margin || '16px 0'};"></div>`;

    case 'spacer':
      return `
        <div style="height: ${style.height || '32px'};"></div>`;

    case 'container':
      const containerStyle = `
        background-color: ${style.backgroundColor || '#F9FAFB'};
        padding: ${style.padding || '16px'};
        border-radius: ${style.borderRadius || '8px'};
        color: ${style.textColor || '#374151'};
        margin-bottom: 24px;
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
      if (component.children && component.children.length > 0) {
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
        component.children.forEach((child: any) => {
          containerHTML += generateComponentHTML(child, variables);
        });
        containerHTML += `</div>`;
      } else {
        containerHTML += `<div style="min-height: 96px; display: flex; align-items: center; justify-content: center; border: 2px dashed #D1D5DB; border-radius: 4px; color: #9CA3AF;">`;
        containerHTML += `<p style="text-align: center; font-size: 14px;">Container Content Area</p>`;
        containerHTML += `</div>`;
      }
      
      containerHTML += `</div>`;
      return containerHTML;

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
