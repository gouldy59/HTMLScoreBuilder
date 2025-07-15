import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTemplateSchema, createVersionSchema } from "@shared/schema";
import { z } from "zod";
import puppeteer from 'puppeteer';
import htmlPdf from 'html-pdf-node';

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

      // Generate PDF using html-pdf-node
      const options = { 
        format: 'A4',
        border: {
          top: "20px",
          right: "20px", 
          bottom: "20px",
          left: "20px"
        }
      };
      
      const file = { content: html };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name || 'report'}.pdf"`);
      res.send(pdfBuffer);
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
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
      res.send(imageBuffer);
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
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .chart-bar { transition: none; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style>
</head>
<body class="bg-white p-8">`;

  // Generate component HTML using existing logic
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
      case 'horizontal-bar-chart':
        // Add comprehensive chart rendering for PDF/Image
        const chartData = content.chartData || [];
        const title = replaceVariables(content.title || 'Chart Title', data);
        const subtitle = replaceVariables(content.subtitle || '', data);
        const wrapLabels = content.wrapLabels === true;
        
        html += `<div class="mb-6 p-6 rounded-lg bg-white">
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">${title}</h3>
            <p class="text-sm text-gray-600">${subtitle}</p>
          </div>
          <div class="space-y-3">`;
          
        chartData.forEach((item: any) => {
          const labelWidth = wrapLabels ? '120px' : 'auto';
          html += `<div style="display: flex; align-items: center;">
            <div style="width: ${labelWidth}; padding-right: 12px; font-size: 12px; font-weight: 500; ${wrapLabels ? 'word-wrap: break-word; white-space: normal; line-height: 1.2;' : 'white-space: nowrap;'}">${item.label || 'Category'}</div>
            <div style="flex: 1; position: relative;">
              <div style="display: flex; height: 24px; background-color: #f3f4f6; border-radius: 4px; overflow: hidden;">`;
              
          (item.segments || []).forEach((segment: any, segIndex: number) => {
            html += `<div style="width: ${segment.value || 0}%; background-color: ${segment.color || '#E5E7EB'}; ${segIndex > 0 ? 'border-left: 1px solid #fff;' : ''}"></div>`;
          });
          
          if (item.scoreValue !== undefined && item.scoreValue !== null) {
            const scorePosition = Math.min(Math.max(item.scoreValue || 0, 0), 100);
            html += `<div style="position: absolute; top: 50%; left: calc(${scorePosition}% - 6px); transform: translateY(-50%); width: 12px; height: 12px; background-color: #dc2626; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`;
          }
          
          html += '</div></div></div>';
        });
        
        html += '</div></div>';
        break;
      default:
        html += `<div class="mb-6">${replaceVariables(content.html || '', data)}</div>`;
    }
  });

  html += '</body></html>';
  return html;
}
