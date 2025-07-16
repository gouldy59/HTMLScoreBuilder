import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTemplateSchema, createVersionSchema } from "@shared/schema";
import { z } from "zod";
import puppeteer from 'puppeteer';
import htmlPdf from 'html-pdf-node';

// Server-side validation schemas
const componentSchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.record(z.any()),
  style: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  children: z.array(z.any()).optional()
});

const templateValidationSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  components: z.array(componentSchema),
  variables: z.record(z.any()),
  styles: z.record(z.any())
});

const jsonDataSchema = z.record(z.any()).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'JSON data cannot be empty' }
);

export async function registerRoutes(app: Express): Promise<Server> {
  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
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
      const validation = insertTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid template data",
          errors: validation.error.errors
        });
      }

      const template = await storage.createTemplate(validation.data);
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const validation = insertTemplateSchema.partial().safeParse(req.body);
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
    } catch (error) {
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

      const data = req.body.data || {};
      
      // Basic HTML generation logic
      const components = Array.isArray(template.components) ? template.components : [];
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white p-8">`;

      // Generate component HTML
      components.forEach((component: any) => {
        const content = component.content || {};
        switch (component.type) {
          case 'header':
            html += `<div class="mb-6"><h1 class="text-2xl font-bold">${replaceVariables(content.title || 'Header', data)}</h1>`;
            if (content.subtitle) {
              html += `<p class="text-gray-600">${replaceVariables(content.subtitle, data)}</p>`;
            }
            html += '</div>';
            break;
          case 'student-info':
            html += '<div class="mb-6 grid grid-cols-2 gap-4">';
            Object.entries(content.fields || {}).forEach(([key, value]) => {
              html += `<div><label class="text-sm font-medium text-gray-700">${key}:</label><p class="text-gray-900">${replaceVariables(String(value), data)}</p></div>`;
            });
            html += '</div>';
            break;
          case 'score-table':
            html += '<div class="mb-6"><table class="w-full border-collapse border border-gray-300">';
            html += '<thead><tr class="bg-gray-50">';
            (content.headers || ['Subject', 'Score', 'Grade']).forEach((header: string) => {
              html += `<th class="border border-gray-300 px-4 py-2 text-left">${header}</th>`;
            });
            html += '</tr></thead><tbody>';
            (content.rows || []).forEach((row: any) => {
              html += '<tr>';
              Object.values(row).forEach((cell: any) => {
                html += `<td class="border border-gray-300 px-4 py-2">${replaceVariables(String(cell), data)}</td>`;
              });
              html += '</tr>';
            });
            html += '</tbody></table></div>';
            break;
          case 'text-block':
            html += `<div class="mb-6"><p>${replaceVariables(content.text || '', data)}</p></div>`;
            break;
          default:
            html += `<div class="mb-6">${replaceVariables(content.html || '', data)}</div>`;
        }
      });

      html += '</body></html>';

      res.json({ html });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate HTML" });
    }
  });

  // Generate PDF endpoint
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

      const data = req.body.data || {};
      const html = await generateFullHTML(template, data);
      
      // Debug endpoint to view HTML
      if (req.query.debug === 'html') {
        res.setHeader('Content-Type', 'text/html');
        return res.send(html);
      }

      // Generate PDF using Puppeteer (more reliable than html-pdf-node)
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
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set content and wait for it to load completely
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for elements to render (using a Promise delay instead of waitForTimeout)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px', 
          bottom: '20px',
          left: '20px'
        }
      });
      
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name || 'report'}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.end(pdfBuffer, 'binary');
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Generate Image endpoint
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

      const data = req.body.data || {};
      const html = await generateFullHTML(template, data);

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
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.setViewport({ width: 1200, height: 1600 });
      
      const imageBuffer = await page.screenshot({
        type: 'png',
        fullPage: true
      });
      
      await browser.close();

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name || 'report'}.png"`);
      res.setHeader('Content-Length', imageBuffer.length.toString());
      res.end(imageBuffer, 'binary');
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function replaceVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return data[variable] || match;
  });
}

// Helper function to generate full HTML from template
async function generateFullHTML(template: any, data: Record<string, any>): Promise<string> {
  const components = Array.isArray(template.components) ? template.components : [];
  const reportBackground = template.styles?.reportBackground || '#ffffff';
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        background-color: ${reportBackground} !important;
      }
      .chart-bar { transition: none; }
      @media print { 
        body { 
          -webkit-print-color-adjust: exact !important; 
          color-adjust: exact !important;
          background-color: ${reportBackground} !important;
        } 
      }
      * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
    </style>
</head>
<body class="p-8 max-w-4xl mx-auto" style="background-color: ${reportBackground};">`;

  // Generate component HTML using existing logic
  components.forEach((component: any) => {
    const content = component.content || {};
    switch (component.type) {
      case 'chart':
      case 'vertical-bar-chart':
      case 'line-chart':
      case 'pie-chart':
        // Handle all chart component types
        let chartData2 = content.chartData || [];
        
        // Check if data is a template variable
        if (typeof content.data === 'string' && content.data.includes('{{')) {
          const variableData = replaceVariables(content.data, data);
          try {
            chartData2 = JSON.parse(variableData);
          } catch (e) {
            chartData2 = [];
          }
        } else if (typeof content.data === 'string' && content.data.trim()) {
          try {
            chartData2 = JSON.parse(content.data);
          } catch (e) {
            console.error('Failed to parse chart data:', e);
            chartData2 = [];
          }
        }
        
        // Auto-generate chart data if needed
        if (!chartData2 || chartData2.length === 0) {
          if (data.mathScore || data.scienceScore || data.englishScore) {
            chartData2 = {
              labels: ['Math', 'Science', 'English', 'History'],
              datasets: [{
                label: 'Test Scores',
                data: [
                  data.mathScore || 75,
                  data.scienceScore || 80,
                  data.englishScore || 70,
                  data.historyScore || 85
                ]
              }]
            };
          }
        }
        
        // Check if chartData2 is in Chart.js format
        if (chartData2.labels && chartData2.datasets && chartData2.datasets[0]) {
          const labels = chartData2.labels;
          const chartValues = chartData2.datasets[0].data;
          
          if (component.type === 'vertical-bar-chart' || component.type === 'chart') {
            // Vertical bar chart with axes
            html += `<div class="mb-6">
              <h3 class="text-lg font-semibold mb-4 text-center">${content.title || 'Performance Chart'}</h3>
              
              <!-- Chart container with axes -->
              <div style="position: relative; width: 100%; height: 300px; margin: 0 auto; max-width: 600px;">
                <!-- Y-axis -->
                <div style="position: absolute; left: 0; top: 0; bottom: 40px; width: 40px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; padding-right: 8px;">
                  <span style="font-size: 11px; color: #666;">100</span>
                  <span style="font-size: 11px; color: #666;">75</span>
                  <span style="font-size: 11px; color: #666;">50</span>
                  <span style="font-size: 11px; color: #666;">25</span>
                  <span style="font-size: 11px; color: #666;">0</span>
                </div>
                
                <!-- Chart area -->
                <div style="margin-left: 50px; margin-bottom: 50px; height: 250px; position: relative; border-left: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb;">
                  <div style="display: flex; align-items: end; justify-content: center; height: 100%; padding: 20px;">`;
            
            labels.forEach((label, index) => {
              const value = Math.min(chartValues[index] || 0, 100); // Cap at 100
              const height = Math.max((value / 100) * 210, 1); // Use 210px as max height
              
              // Use custom colors if available, otherwise use default colors
              const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
              const barColors = content.barColors || defaultColors;
              const barColor = barColors[index % barColors.length];
              
              // Calculate bar width based on number of bars to prevent overflow
              const barCount = labels.length;
              const availableWidth = 500; // Available width for bars
              const spacing = 8; // Space between bars
              const totalSpacing = (barCount - 1) * spacing;
              const maxBarWidth = Math.min(50, (availableWidth - totalSpacing) / barCount);
              
              html += `<div style="display: flex; flex-direction: column; align-items: center; margin: 0 4px;">
                <div style="width: ${maxBarWidth}px; height: ${height}px; background-color: ${barColor}; margin-bottom: 10px; border-radius: 4px 4px 0 0; border: 1px solid ${barColor};"></div>
                <div style="font-size: ${barCount > 8 ? '10px' : '12px'}; color: #374151; text-align: center; word-wrap: break-word; max-width: ${maxBarWidth + 10}px;">${label}</div>
                <div style="font-size: ${barCount > 8 ? '8px' : '10px'}; color: #6b7280; text-align: center;">${value}</div>
              </div>`;
            });
            
            html += `</div>
                </div>
              </div>
            </div>`;
          } else if (component.type === 'line-chart') {
            // Line chart as table for PDF
            html += `<div class="mb-6">
              <h3 class="text-lg font-semibold mb-4 text-center">${content.title || 'Line Chart'}</h3>
              <table class="w-full border-collapse border border-gray-300">
                <thead><tr class="bg-gray-50">
                  <th class="border border-gray-300 px-4 py-2">Subject</th>
                  <th class="border border-gray-300 px-4 py-2">Score</th>
                </tr></thead>
                <tbody>`;
            
            labels.forEach((label, index) => {
              const value = chartValues[index] || 0;
              html += `<tr>
                <td class="border border-gray-300 px-4 py-2">${label}</td>
                <td class="border border-gray-300 px-4 py-2">${value}</td>
              </tr>`;
            });
            
            html += `</tbody></table></div>`;
          } else if (component.type === 'pie-chart') {
            // Pie chart as list for PDF
            html += `<div class="mb-6">
              <h3 class="text-lg font-semibold mb-4 text-center">${content.title || 'Pie Chart'}</h3>
              <div class="space-y-2">`;
            
            labels.forEach((label, index) => {
              const value = chartValues[index] || 0;
              html += `<div class="flex items-center">
                <div class="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span class="text-sm">${label}: ${value}</span>
              </div>`;
            });
            
            html += `</div></div>`;
          }
        }
        break;
      case 'header':
        const headerStyle = component.style || {};
        html += `<div class="mb-6 p-6 rounded-lg" style="background-color: ${headerStyle.backgroundColor || '#DBEAFE'}; color: ${headerStyle.textColor || '#1F2937'};">`;
        html += `<h1 class="text-3xl font-bold mb-2">${replaceVariables(content.title || 'Header', data)}</h1>`;
        if (content.subtitle) {
          html += `<p class="text-lg opacity-80">${replaceVariables(content.subtitle, data)}</p>`;
        }
        html += '</div>';
        break;
      case 'student-info':
        const studentStyle = component.style || {};
        html += `<div class="mb-6 p-6 rounded-lg grid grid-cols-2 gap-4" style="background-color: ${studentStyle.backgroundColor || '#F0FDF4'}; color: ${studentStyle.textColor || '#1F2937'};">`;
        Object.entries(content.fields || {}).forEach(([key, value]) => {
          html += `<div><label class="text-sm font-medium opacity-70">${key}:</label><p class="text-lg font-semibold">${replaceVariables(String(value), data)}</p></div>`;
        });
        html += '</div>';
        break;
      case 'score-table':
        const tableStyle = component.style || {};
        html += `<div class="mb-6 p-6 rounded-lg" style="background-color: ${tableStyle.backgroundColor || '#FFF7ED'};">`;
        html += '<div class="overflow-x-auto">';
        html += '<table class="w-full border-collapse border border-gray-300 bg-white rounded-lg overflow-hidden">';
        
        // Headers
        html += '<thead><tr class="bg-gray-50">';
        (content.headers || ['Subject', 'Score', 'Grade']).forEach((header: string) => {
          html += `<th class="border border-gray-300 px-4 py-3 text-left font-semibold">${header}</th>`;
        });
        html += '</tr></thead>';

        // Rows
        html += '<tbody>';
        (content.rows || []).forEach((row: any) => {
          html += '<tr class="hover:bg-gray-50">';
          Object.values(row).forEach((cell: any) => {
            html += `<td class="border border-gray-300 px-4 py-3">${replaceVariables(String(cell), data)}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody></table></div></div>';
        break;
      case 'text-block':
        const textStyle = component.style || {};
        html += `<div class="mb-6 p-6 rounded-lg" style="background-color: ${textStyle.backgroundColor || '#ffffff'};">
          <p style="color: ${textStyle.textColor || '#1F2937'};">${replaceVariables(content.text || '', data)}</p>
        </div>`;
        break;
      case 'horizontal-bar-chart':
        // Add comprehensive chart rendering for PDF/Image
        const chartData = content.chartData || [];
        const title = replaceVariables(content.title || 'Chart Title', data);
        const subtitle = replaceVariables(content.subtitle || '', data);
        const wrapLabels = content.wrapLabels === true;
        
        const chartStyle = component.style || {};
        html += `<div class="mb-6 p-6 rounded-lg" style="background-color: ${chartStyle.backgroundColor || '#ffffff'}; max-width: 768px; margin-left: auto; margin-right: auto;">
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">${title}</h3>
            <p class="text-sm text-gray-600">${subtitle}</p>
          </div>
          
          <div class="space-y-3 mb-6">`;
          
        if (chartData.length === 0) {
          html += `<div class="text-center py-8 text-gray-500">
            <p class="text-sm">No chart data available</p>
          </div>`;
        } else {
          chartData.forEach((item: any) => {
            const labelWidth = wrapLabels ? '120px' : Math.min(200, Math.max(80, chartData.reduce((longest: number, item: any) => {
              const labelLength = (item.label || 'Category').length * 7;
              return labelLength > longest ? labelLength : longest;
            }, 80))) + 'px';
            
            html += `<div style="display: flex; align-items: center;">
              <div style="font-size: 12px; color: #374151; padding-right: 12px; font-weight: 500; ${
                wrapLabels ? 
                  'width: 120px; word-wrap: break-word; white-space: normal; line-height: 1.2;' :
                  `width: ${labelWidth}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
              }">${item.label || 'Category'}</div>
              <div style="position: relative; width: ${
                wrapLabels ? 'calc(100% - 132px - 48px)' : `calc(100% - ${labelWidth} - 12px - 48px)`
              };">
                <div style="display: flex; height: 24px; background-color: #f3f4f6; border-radius: 6px; overflow: hidden; position: relative;">`;
                
            (item.segments || []).forEach((segment: any, segIndex: number) => {
              html += `<div style="width: ${segment.value || 0}%; background-color: ${segment.color || '#E5E7EB'}; ${segIndex > 0 ? 'border-left: 1px solid #fff;' : ''} display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 500;" title="${segment.label}: ${segment.value || 0}%">`;
              if (content.showPercentages !== false && (segment.value || 0) > 8) {
                html += `${segment.value || 0}%`;
              }
              html += `</div>`;
            });
            
            if (item.scoreValue !== undefined && item.scoreValue !== null) {
              const scorePosition = Math.min(Math.max(item.scoreValue || 0, 0), 100);
              html += `<div style="position: absolute; top: 50%; left: calc(${scorePosition}% - 6px); transform: translateY(-50%); width: 12px; height: 12px; background-color: #dc2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 10;" title="Score: ${item.scoreValue}%"></div>`;
            }
            
            html += `</div>`;
            
            if (item.scoreValue !== undefined && item.scoreValue !== null) {
              html += `<div style="position: absolute; right: -48px; top: 0; bottom: 0; display: flex; align-items: center;">
                <span style="font-size: 12px; font-weight: bold; color: #dc2626; background-color: white; padding: 2px 4px; border-radius: 3px; box-shadow: 0 1px 2px rgba(0,0,0,0.2); border: 1px solid #e5e7eb;">
                  ${item.scoreValue}%
                </span>
              </div>`;
            }
            
            html += `</div>
            </div>`;
          });
        }
        
        html += `</div>
          
          <div style="display: flex; justify-content: center; gap: 24px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 16px; height: 16px; border-radius: 4px; background-color: #FDE2E7;"></div>
              <span style="font-size: 12px; color: #6b7280;">0%-25%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 16px; height: 16px; border-radius: 4px; background-color: #FB923C;"></div>
              <span style="font-size: 12px; color: #6b7280;">26%-50%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 16px; height: 16px; border-radius: 4px; background-color: #FEF3C7;"></div>
              <span style="font-size: 12px; color: #6b7280;">51%-75%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 16px; height: 16px; border-radius: 4px; background-color: #D1FAE5;"></div>
              <span style="font-size: 12px; color: #6b7280;">76%-100%</span>
            </div>
          </div>
        </div>`;
        break;
      default:
        // For unknown component types, log and add a placeholder with debug info
        console.log('Unknown component type:', component.type, 'defaulting to empty div');
        html += `<div class="mb-6"><!-- Unknown component type: ${component.type} --></div>`;
        break;
    }
  });

  html += '</body></html>';
  return html;
}
