import express from 'express';
import { createInsertSchema } from 'drizzle-zod';
import { templates } from '@shared/schema';
import { storage } from './storage';
import pdf from 'html-pdf-node';
import puppeteer from 'puppeteer';
import { generateImage } from './openai';

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
    // Default sample data structure
    const defaultData = [
      ['Subject', 'Score'],
      ['Math', variables.mathScore || 85],
      ['Science', variables.scienceScore || 92],
      ['English', variables.englishScore || 78],
      ['History', variables.historyScore || 88],
      ['Art', variables.artScore || 95]
    ];

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

  function generateGoogleChartHTML(
    chartId: string,
    data: any[][],
    chartType: string,
    title: string,
    width: number = 400,
    height: number = 300,
    backgroundColor: string = 'transparent'
  ): string {
    const dataString = JSON.stringify(data);
    const optionsString = JSON.stringify({
      title: title,
      width: width,
      height: height,
      backgroundColor: backgroundColor,
      colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'],
      legend: { position: 'bottom' },
      hAxis: {},
      vAxis: {},
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

  function renderComponent(component: any): string {
    const { type, content, style, position } = component;
    const positionStyle = `position: absolute; left: ${position?.x || 0}px; top: ${position?.y || 0}px; width: ${style?.width || '400px'}; height: ${style?.height || '300px'};`;

    switch (type) {
      case 'header':
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#DBEAFE'}; color: ${style?.textColor || '#1F2937'}; padding: 24px; border-radius: 8px;">
            <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 8px;">${replaceVariables(content?.title || 'Header', variables)}</h1>
            ${content?.subtitle ? `<p style="font-size: 1.125rem; opacity: 0.8;">${replaceVariables(content.subtitle, variables)}</p>` : ''}
          </div>`;

      case 'column-chart':
        const googleData = convertToGoogleChartData(variables);
        const columnChartId = `column-chart-${Math.random().toString(36).substr(2, 9)}`;
        const chartWidth = parseInt(style?.width?.toString().replace('px', '') || '400');
        const chartHeight = parseInt(style?.height?.toString().replace('px', '') || '300') - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              columnChartId, 
              googleData, 
              'column',
              replaceVariables(content?.title || 'Column Chart', variables),
              chartWidth,
              chartHeight,
              style?.backgroundColor || '#ffffff'
            )}
          </div>`;

      case 'bar-chart':
        const barGoogleData = convertToGoogleChartData(variables);
        const barChartId = `bar-chart-${Math.random().toString(36).substr(2, 9)}`;
        const barChartWidth = parseInt(style?.width?.toString().replace('px', '') || '400');
        const barChartHeight = parseInt(style?.height?.toString().replace('px', '') || '300') - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              barChartId, 
              barGoogleData, 
              'bar',
              replaceVariables(content?.title || 'Bar Chart', variables),
              barChartWidth,
              barChartHeight,
              style?.backgroundColor || '#ffffff'
            )}
          </div>`;

      case 'pie-chart':
        const pieGoogleData = convertToGoogleChartData(variables);
        const pieChartId = `pie-chart-${Math.random().toString(36).substr(2, 9)}`;
        const pieChartWidth = parseInt(style?.width?.toString().replace('px', '') || '400');
        const pieChartHeight = parseInt(style?.height?.toString().replace('px', '') || '300') - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              pieChartId, 
              pieGoogleData, 
              'pie',
              replaceVariables(content?.title || 'Pie Chart', variables),
              pieChartWidth,
              pieChartHeight,
              style?.backgroundColor || '#ffffff'
            )}
          </div>`;

      case 'line-chart':
        const lineGoogleData = convertToGoogleChartData(variables);
        const lineChartId = `line-chart-${Math.random().toString(36).substr(2, 9)}`;
        const lineChartWidth = parseInt(style?.width?.toString().replace('px', '') || '400');
        const lineChartHeight = parseInt(style?.height?.toString().replace('px', '') || '300') - 50;
        
        return `
          <div style="${positionStyle} background-color: ${style?.backgroundColor || '#ffffff'}; padding: 16px; border-radius: 8px;">
            ${generateGoogleChartHTML(
              lineChartId, 
              lineGoogleData, 
              'line',
              replaceVariables(content?.title || 'Line Chart', variables),
              lineChartWidth,
              lineChartHeight,
              style?.backgroundColor || '#ffffff'
            )}
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
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px;
              background-color: #f5f5f5;
            }
            .report-container {
              position: relative; 
              width: 794px;
              min-height: 1123px;
              background-color: ${reportBackground};
              ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}'); background-size: cover; background-repeat: no-repeat; background-position: center;` : ''}
              margin: 0 auto;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
      await page.setViewport({ width: 794, height: 1123 });
      
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const imageBuffer = await page.screenshot({ 
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 794, height: 1123 } 
      });
      
      await browser.close();
      
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
