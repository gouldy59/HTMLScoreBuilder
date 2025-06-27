import { TemplateComponent } from '@/types/template';
import { replaceVariables } from './templateEngine';

export function generateHTML(
  components: TemplateComponent[],
  variables: Record<string, any> = {},
  templateName: string = 'Generated Report'
): string {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${templateName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .print-only { display: none; }
        @media print {
            .no-print { display: none; }
            .print-only { display: block; }
        }
    </style>
</head>
<body class="bg-white p-8 max-w-4xl mx-auto">`;

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

    case 'chart':
      return `
        <div class="mb-6 p-6 rounded-lg" style="background-color: ${style.backgroundColor || '#F8FAFC'}; height: ${style.height || '300px'};">
          <h3 class="text-lg font-semibold mb-4">${replaceVariables(content.title || 'Chart', variables)}</h3>
          <div class="flex items-center justify-center h-48 bg-gray-100 rounded border-2 border-dashed border-gray-300">
            <p class="text-gray-500">Chart visualization would appear here<br><small>Data: ${replaceVariables(content.data || 'No data', variables)}</small></p>
          </div>
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

    case 'container':
      return `
        <div class="mb-6 rounded-lg" style="background-color: ${style.backgroundColor || '#F9FAFB'}; padding: ${style.padding || '16px'}; border-radius: ${style.borderRadius || '8px'};">
          <div class="min-h-16 flex items-center justify-center text-gray-400">
            <p>Container - Drop components here</p>
          </div>
        </div>`;

    case 'divider':
      return `
        <div class="mb-6" style="height: ${style.height || '1px'}; background-color: ${style.backgroundColor || '#E5E7EB'}; margin: ${style.margin || '16px 0'};"></div>`;

    case 'spacer':
      return `
        <div style="height: ${style.height || '32px'};"></div>`;

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
