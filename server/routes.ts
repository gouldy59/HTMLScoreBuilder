import express from 'express';
import { createInsertSchema } from 'drizzle-zod';
import { templates } from '@shared/schema';
import { storage } from './storage';
import pdf from 'html-pdf-node';
import puppeteer from 'puppeteer';
import { generateImage } from './openai';
import { generatePDFFromHTML, generateImageFromHTML } from './pdf-utils';

// Server-side HTML generator that properly renders charts
function generateHTMLFromTemplate(template: any, variables: any = {}) {
  const components = template.components || [];
  const templateName = template.name || 'Generated Report';
  const reportBackground = (template.styles as any)?.reportBackground || '#ffffff';
  const reportBackgroundImage = (template.styles as any)?.reportBackgroundImage || '';

  function replaceVariables(text: string, vars: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vars[key] !== undefined ? String(vars[key]) : match;
    });
  }

  function convertToGoogleChartData(variables: Record<string, any>) {
    console.log('Converting chart data with variables:', variables);
    
    // Generate data from individual score fields
    const scoreFields = ['mathScore', 'scienceScore', 'englishScore', 'historyScore', 'artScore'];
    const scores: (string | number)[][] = [];
    
    scoreFields.forEach(field => {
      if (variables[field] !== undefined && variables[field] !== null) {
        const subjectName = field.replace('Score', '').charAt(0).toUpperCase() + field.replace('Score', '').slice(1);
        scores.push([subjectName, Number(variables[field])]);
      }
    });

    if (scores.length > 0) {
      console.log('Generated chart data from variables:', [['Subject', 'Score'], ...scores]);
      return [['Subject', 'Score'], ...scores];
    }

    // Fallback sample data only if no variables provided
    const fallbackData = [
      ['Subject', 'Score'],
      ['Math', 85],
      ['Science', 92],
      ['English', 78]
    ];
    
    console.log('Using fallback chart data:', fallbackData);
    return fallbackData;
  }

  function generateGoogleChartHTML(
    chartId: string,
    data: any[][],
    chartType: string,
    title: string,
    width: number = 400,
    height: number = 300,
    backgroundColor: string = 'transparent',
    customColors: string[] = []
  ): string {
    const dataString = JSON.stringify(data);
    
    // Use custom colors if provided, otherwise default colors
    const colors = customColors.length > 0 ? customColors : ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
    
    const optionsString = JSON.stringify({
      title: title,
      width: width,
      height: height,
      backgroundColor: backgroundColor,
      colors: colors,
      legend: { position: 'bottom' },
      hAxis: {},
      vAxis: {
        minValue: 0,
        maxValue: 100,
        format: '#\'%\''
      },
      pieHole: chartType === 'donut' ? 0.4 : 0,
      chartArea: {
        left: 60,
        top: 40,
        width: '75%',
        height: '70%'
      }
    });

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
      <div id="${chartId}" style="width: ${width}px; height: ${height}px; margin: 0 auto;"></div>
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

  // Calculate adjusted positions based on page breaks
  const pageBreaks = components.filter((comp: any) => comp.type === 'page-break');
  const pageHeight = 1123; // A4 height in pixels
  
  function getAdjustedPosition(component: any): { x: number; y: number } {
    const originalY = component.position?.y || 0;
    
    // Find page breaks that come before this component
    const precedingPageBreaks = pageBreaks.filter((pb: any) => (pb.position?.y || 0) < originalY);
    
    if (precedingPageBreaks.length === 0) {
      return { x: component.position?.x || 0, y: originalY };
    }
    
    // Find the closest page break before this component
    const lastPageBreak = precedingPageBreaks[precedingPageBreaks.length - 1];
    const pageBreakY = lastPageBreak.position?.y || 0;
    
    // Calculate which page this component should be on
    const targetPage = Math.floor(pageBreakY / pageHeight) + 1;
    const pageStartY = targetPage * pageHeight;
    
    // Calculate relative position from the page break
    const relativeY = originalY - pageBreakY;
    
    // If component is close to the page break (within 100px), move it to start of next page
    if (relativeY < 100) {
      return { x: component.position?.x || 0, y: pageStartY + 20 };
    }
    
    return { x: component.position?.x || 0, y: originalY };
  }

  function renderComponent(component: any): string {
    const { type, content, style, position } = component;
    
    // Get adjusted position considering page breaks
    const adjustedPos = getAdjustedPosition(component);
    
    // Scale positions for full-page layout (794px canvas -> 100vw, 1123px canvas -> 100vh)
    const scaleX = adjustedPos.x ? (adjustedPos.x / 794) * 100 : 0;
    const scaleY = adjustedPos.y ? (adjustedPos.y / 1123) * 100 : 0;
    const widthVw = style?.width ? (parseInt(style.width.toString().replace('px', '')) / 794) * 100 : 50;
    const heightVh = style?.height ? (parseInt(style.height.toString().replace('px', '')) / 1123) * 100 : 25;
    
    const positionStyle = `position: absolute; left: ${scaleX}vw; top: ${scaleY}vh; width: ${widthVw}vw; height: ${heightVh}vh;`;

    switch (type) {
      case 'header':
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#DBEAFE'}; color: ${style?.textColor || '#1F2937'}; padding: 24px; border-radius: 8px;">
            <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 8px;">${replaceVariables(content?.title || 'Header', variables)}</h1>
            ${content?.subtitle ? `<p style="font-size: 1.125rem; opacity: 0.8;">${replaceVariables(content.subtitle, variables)}</p>` : ''}
          </div>`;

      case 'column-chart':
        // Get chart data from component content or use provided variables
        let columnChartData = null;
        
        // First check for chartData in content (created by chart components)
        if (content?.chartData && Array.isArray(content.chartData)) {
          columnChartData = content.chartData;
        } else if (content?.data && content.data.trim()) {
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
        
        // Convert custom chartData format to Google Charts format and extract colors
        let googleData;
        let chartColors: string[] = [];
        if (columnChartData && Array.isArray(columnChartData) && columnChartData[0]?.label) {
          // Custom chart data format with labels
          googleData = [['Category', 'Score'], ...columnChartData.map(item => [item.label, item.scoreValue || 0])];
          // Extract colors from segments if available
          chartColors = columnChartData.map(item => 
            item.segments && item.segments[0] ? item.segments[0].color : '#3B82F6'
          );
        } else {
          googleData = columnChartData || convertToGoogleChartData(variables);
          chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        }

        const columnChartId = `column-chart-${Math.random().toString(36).substr(2, 9)}`;
        const chartWidth = Math.min(600, widthVw * 7.94); // Convert vw back to approximate px for chart sizing
        const chartHeight = Math.min(400, heightVh * 11.23) - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              columnChartId, 
              googleData, 
              'column',
              replaceVariables(content?.title || 'Column Chart', variables),
              chartWidth,
              chartHeight,
              style?.backgroundColor || '#ffffff',
              chartColors
            )}
          </div>`;

      case 'bar-chart':
        // Get chart data from component content or use provided variables
        let barChartData = null;
        
        // First check for chartData in content (created by chart components)
        if (content?.chartData && Array.isArray(content.chartData)) {
          barChartData = content.chartData;
        } else if (content?.data && content.data.trim()) {
          if (content.data.startsWith('{{') && content.data.endsWith('}}')) {
            const variableName = content.data.slice(2, -2);
            barChartData = variables[variableName];
          } else {
            try {
              barChartData = JSON.parse(content.data);
            } catch (e) {
              barChartData = null;
            }
          }
        }
        
        // Convert custom chartData format to Google Charts format and extract colors
        let barGoogleData;
        let barChartColors: string[] = [];
        if (barChartData && Array.isArray(barChartData) && barChartData[0]?.label) {
          // Custom chart data format with labels
          barGoogleData = [['Category', 'Score'], ...barChartData.map(item => [item.label, item.scoreValue || 0])];
          // Extract colors from segments if available
          barChartColors = barChartData.map(item => 
            item.segments && item.segments[0] ? item.segments[0].color : '#3B82F6'
          );
        } else {
          barGoogleData = barChartData || convertToGoogleChartData(variables);
          barChartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        }
        const barChartId = `bar-chart-${Math.random().toString(36).substr(2, 9)}`;
        const barChartWidth = Math.min(600, widthVw * 7.94);
        const barChartHeight = Math.min(400, heightVh * 11.23) - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              barChartId, 
              barGoogleData, 
              'bar',
              replaceVariables(content?.title || 'Bar Chart', variables),
              barChartWidth,
              barChartHeight,
              style?.backgroundColor || '#ffffff',
              barChartColors
            )}
          </div>`;

      case 'pie-chart':
        // Get chart data from component content or use provided variables
        let pieChartData = null;
        
        // First check for chartData in content (created by chart components)
        if (content?.chartData && Array.isArray(content.chartData)) {
          pieChartData = content.chartData;
        } else if (content?.data && content.data.trim()) {
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
        
        // Convert custom chartData format to Google Charts format and extract colors
        let pieGoogleData;
        let pieChartColors: string[] = [];
        if (pieChartData && Array.isArray(pieChartData) && pieChartData[0]?.label) {
          // Custom chart data format with labels
          pieGoogleData = [['Category', 'Score'], ...pieChartData.map(item => [item.label, item.scoreValue || 0])];
          // Extract colors from segments if available
          pieChartColors = pieChartData.map(item => 
            item.segments && item.segments[0] ? item.segments[0].color : '#3B82F6'
          );
        } else {
          pieGoogleData = pieChartData || convertToGoogleChartData(variables);
          pieChartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        }
        const pieChartId = `pie-chart-${Math.random().toString(36).substr(2, 9)}`;
        const pieChartWidth = Math.min(600, widthVw * 7.94);
        const pieChartHeight = Math.min(400, heightVh * 11.23) - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              pieChartId, 
              pieGoogleData, 
              'pie',
              replaceVariables(content?.title || 'Pie Chart', variables),
              pieChartWidth,
              pieChartHeight,
              style?.backgroundColor || '#ffffff',
              pieChartColors
            )}
          </div>`;

      case 'line-chart':
        // Get chart data from component content or use provided variables
        let lineChartData = null;
        
        // First check for chartData in content (created by chart components)
        if (content?.chartData && Array.isArray(content.chartData)) {
          lineChartData = content.chartData;
        } else if (content?.data && content.data.trim()) {
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
        
        // Convert custom chartData format to Google Charts format and extract colors
        let lineGoogleData;
        let lineChartColors: string[] = [];
        if (lineChartData && Array.isArray(lineChartData) && lineChartData[0]?.label) {
          // Custom chart data format with labels
          lineGoogleData = [['Category', 'Score'], ...lineChartData.map(item => [item.label, item.scoreValue || 0])];
          // Extract colors from segments if available
          lineChartColors = lineChartData.map(item => 
            item.segments && item.segments[0] ? item.segments[0].color : '#3B82F6'
          );
        } else {
          lineGoogleData = lineChartData || convertToGoogleChartData(variables);
          lineChartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        }
        const lineChartId = `line-chart-${Math.random().toString(36).substr(2, 9)}`;
        const lineChartWidth = Math.min(600, widthVw * 7.94);
        const lineChartHeight = Math.min(400, heightVh * 11.23) - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              lineChartId, 
              lineGoogleData, 
              'line',
              replaceVariables(content?.title || 'Line Chart', variables),
              lineChartWidth,
              lineChartHeight,
              style?.backgroundColor || '#ffffff',
              lineChartColors
            )}
          </div>`;

      case 'page-break':
        // Page breaks are invisible in PDF/image generation
        return `<div style="${positionStyle} height: 0px; page-break-before: always; display: block; visibility: hidden;"></div>`;

      case 'text-block':
        const textContent = content?.text ? replaceVariables(content.text, variables) : 'Add your text content here. You can use variables like {{studentName}} to make it dynamic.';
        const fontSize = style?.fontSize || '16px';
        const fontWeight = style?.fontWeight || 'normal';
        const textAlign = style?.textAlign || 'left';
        const lineHeight = style?.lineHeight || '1.5';
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || 'transparent'}; color: ${style?.color || '#000000'}; font-size: ${fontSize}; font-weight: ${fontWeight}; text-align: ${textAlign}; line-height: ${lineHeight}; padding: 8px; border-radius: 4px;">
            ${textContent.split('\n').map(line => `<p style="margin: 0 0 8px 0;">${line}</p>`).join('')}
          </div>`;

      default:
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#f0f0f0'}; padding: 16px; border-radius: 8px;">
            <h3>${replaceVariables(content?.title || type, variables)}</h3>
            <p>Component: ${type}</p>
          </div>`;
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${templateName}</title>
        <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
        <script type="text/javascript">
          google.charts.load('current', {'packages':['corechart', 'bar', 'line', 'scatter']});
        </script>
        <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: ${reportBackground};
              ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}'); background-size: cover; background-repeat: no-repeat; background-position: center;` : ''}
            }
            .report-container {
              position: relative;
              width: 100vw;
              height: 100vh;
              background-color: ${reportBackground};
              ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}'); background-size: cover; background-repeat: no-repeat; background-position: center;` : ''}
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
              }
              .report-container {
                width: 210mm;
                height: 297mm;
              }
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            ${components.map(renderComponent).join('')}
        </div>
    </body>
    </html>
  `;
}

const createTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
const createVersionSchema = createInsertSchema(templates).pick({ 
  name: true, 
  description: true, 
  components: true, 
  variables: true, 
  styles: true,
  changeDescription: true 
});

export function setupRoutes(app: express.Application) {
  // Template CRUD routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // New route for template families
  app.get("/api/template-families", async (req, res) => {
    try {
      const families = await storage.getTemplateFamilies();
      res.json(families);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template families" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const validation = createTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid template data",
          errors: validation.error.errors
        });
      }

      const template = await storage.createTemplate(validation.data);
      res.status(201).json(template);
    } catch (error: any) {
      console.error('Template creation error:', error);
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ 
        message: "Failed to create template",
        error: error.message 
      });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const validation = createTemplateSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid template data",
          errors: validation.error.errors
        });
      }

      const template = await storage.updateTemplate(id, validation.data);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error: any) {
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const success = await storage.deleteTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Template versioning routes
  app.post("/api/templates/:id/versions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const validation = createVersionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid version data",
          errors: validation.error.errors
        });
      }

      const newVersion = await storage.createTemplateVersion(id, validation.data);
      res.status(201).json(newVersion);
    } catch (error) {
      res.status(500).json({ message: "Failed to create template version" });
    }
  });

  app.get("/api/templates/:id/versions", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const versions = await storage.getTemplateVersions(id);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template versions" });
    }
  });

  app.get("/api/templates/:id/history", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const history = await storage.getTemplateHistory(id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template history" });
    }
  });

  app.post("/api/templates/:id/revert/:versionId", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const versionId = parseInt(req.params.versionId);
      
      if (isNaN(id) || isNaN(versionId)) {
        return res.status(400).json({ message: "Invalid template or version ID" });
      }

      const revertedTemplate = await storage.revertToVersion(id, versionId);
      if (!revertedTemplate) {
        return res.status(404).json({ message: "Template or version not found" });
      }

      res.json(revertedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to revert template" });
    }
  });

  app.get("/api/templates/:id/latest", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const latestVersion = await storage.getLatestVersion(id);
      if (!latestVersion) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(latestVersion);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest version" });
    }
  });

  // Template publish operations
  app.post("/api/templates/:id/publish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.publishTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to publish template" });
    }
  });

  app.post("/api/templates/:id/unpublish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.unpublishTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to unpublish template" });
    }
  });

  // Template audit history
  app.get("/api/templates/:id/audit", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const auditHistory = await storage.getTemplateAuditHistory(id);
      res.json(auditHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit history" });
    }
  });

  // HTML generation endpoint
  app.post("/api/templates/:id/generate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Use template data for HTML generation
      const templateData = req.body || {};
      
      // Generate HTML using template components and provided data
      const html = generateHTMLFromTemplate(template, templateData);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate HTML" });
    }
  });

  // Template-specific PDF generation endpoint
  app.post("/api/templates/:id/generate-pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const templateData = req.body?.data || {};
      const html = generateHTMLFromTemplate(template, templateData);
      
      // Generate PDF with full-page layout (no margins)
      const pdfBuffer = await generatePDFFromHTML(html, id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="template_${id}.pdf"`);
      res.end(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Template-specific image generation endpoint
  app.post("/api/templates/:id/generate-image", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const templateData = req.body?.data || {};
      const html = generateHTMLFromTemplate(template, templateData);
      
      // Generate image with full-page layout
      const imageBuffer = await generateImageFromHTML(html, id);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="template_${id}.png"`);
      res.end(imageBuffer);
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  // Export HTML endpoint
  app.post("/api/export-html", async (req, res) => {
    try {
      const { templateId, data = {} } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }

      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      // Generate HTML using template components and provided data
      const html = generateHTMLFromTemplate(template, data);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="template_${templateId}.html"`);
      res.send(html);
    } catch (error) {
      res.status(500).json({ message: "Failed to export HTML" });
    }
  });

  // PDF generation endpoint
  app.post("/api/generate-pdf", async (req, res) => {
    try {
      const { templateId, data = {} } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }

      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const html = generateHTMLFromTemplate(template, data);
      
      // Generate PDF using Puppeteer directly (more reliable than html-pdf-node)
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.setViewport({ width: 794, height: 1123 });
      
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pdfBuffer = await page.pdf({ 
        format: 'A4',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });
      
      await browser.close();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="template_${templateId}.pdf"`);
      res.end(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Image generation endpoint
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { templateId, data = {} } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }

      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      const html = generateHTMLFromTemplate(template, data);
      
      // Generate image using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.setViewport({ width: 1200, height: 800 });
      
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get actual content height from the generated HTML
      const actualContentHeight = await page.evaluate(() => {
        const container = document.querySelector('.report-container');
        return container ? container.scrollHeight : 1123;
      });
      
      console.log(`Screenshot dimensions: actualContentHeight=${actualContentHeight}px, using clip height=${Math.min(actualContentHeight + 40, 1123)}px`);
      
      const imageBuffer = await page.screenshot({ 
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1058, height: Math.min(actualContentHeight + 40, 1123) } 
      });
      
      await browser.close();
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="template_${templateId}.png"`);
      res.end(imageBuffer);
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });
}

// AI Image generation endpoint
export function setupImageRoutes(app: express.Application) {
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Text prompt is required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ message: "OpenAI API key not configured. Please add your API key to enable image generation." });
      }

      const result = await generateImage(prompt);
      res.json(result);
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate image" 
      });
    }
  });
}
