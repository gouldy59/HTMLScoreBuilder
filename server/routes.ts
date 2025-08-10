import express from 'express';
import { createInsertSchema } from 'drizzle-zod';
import { templates } from '@shared/schema';
import { storage } from './storage';
import pdf from 'html-pdf-node';
import puppeteer from 'puppeteer';
import { generateImage } from './openai';
// We'll create a simple HTML generator function here instead of importing from client

const createTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
const createVersionSchema = createInsertSchema(templates).pick({ 
  name: true, 
  description: true, 
  components: true, 
  variables: true, 
  styles: true,
  changeDescription: true 
});

// Simple variable replacement function
function replaceVariables(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : match;
  });
}

// Simple HTML generator function for server-side use
function generateTemplateHTML(components: any[], variables: Record<string, any> = {}, templateName: string = 'Generated Report', reportBackground: string = '#ffffff', reportBackgroundImage: string = ''): string {
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  
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
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 0;
          background-color: #f5f5f5;
        }
        
        .report-page {
          width: 794px;
          min-height: 1123px;
          margin: 0 auto 20px auto;
          background-color: ${reportBackground};
          ${reportBackgroundImage ? `background-image: url('${reportBackgroundImage}'); background-size: cover; background-repeat: no-repeat; background-position: center;` : ''}
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          padding: 20px;
        }
    </style>
</head>
<body>
  <div class="report-page">`;

  // Render components
  (components || []).forEach((component: any) => {
    const position = component.position || { x: 0, y: 0 };
    const style = component.style || {};
    const content = component.content || {};
    
    const positionStyle = `position: absolute; left: ${position.x * 0.69}px; top: ${position.y * 0.69}px; width: ${style.width || 'auto'}; height: ${style.height || 'auto'};`;
    
    switch (component.type) {
      case 'header':
        const headerTitle = replaceVariables(content.title || 'Header', variables);
        const headerSubtitle = content.subtitle ? replaceVariables(content.subtitle, variables) : '';
        html += `<div style="${positionStyle} background-color: ${style.backgroundColor || '#DBEAFE'}; color: ${style.textColor || '#1F2937'}; padding: 24px; border-radius: 8px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">${headerTitle}</h1>
          ${headerSubtitle ? `<p style="font-size: 16px; opacity: 0.8;">${headerSubtitle}</p>` : ''}
        </div>`;
        break;
      case 'text-block':
        const textContent = replaceVariables(content.text || 'Text content', variables);
        html += `<div style="${positionStyle} background-color: ${style.backgroundColor || '#FFFFFF'}; color: ${style.textColor || '#1F2937'}; padding: 16px; border-radius: 4px;">
          <p style="margin: 0;">${textContent}</p>
        </div>`;
        break;
      case 'student-info':
        let studentInfoHtml = `<div style="${positionStyle} background-color: ${style.backgroundColor || '#F0FDF4'}; color: ${style.textColor || '#1F2937'}; padding: 16px; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">Student Information</h3>`;
        
        if (content.fields) {
          Object.entries(content.fields).forEach(([label, value]: [string, any]) => {
            const processedValue = replaceVariables(String(value), variables);
            studentInfoHtml += `<div style="margin-bottom: 8px;"><strong>${label}:</strong> ${processedValue}</div>`;
          });
        }
        
        studentInfoHtml += `</div>`;
        html += studentInfoHtml;
        break;
      case 'bar-chart':
        const chartTitle = replaceVariables(content.title || 'Chart Title', variables);
        html += `<div style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 24px; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">${chartTitle}</h3>
          <div style="background-color: #f3f4f6; height: 200px; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
            <p style="color: #6b7280;">Chart rendering placeholder</p>
          </div>
        </div>`;
        break;
      case 'page-break':
        const pageBreakLabel = replaceVariables(content.label || 'Page Break', variables);
        html += `<div style="${positionStyle} page-break-before: always; height: 12px; background-color: #EF4444; border: 2px dashed #EF4444; margin: 8px 0; display: flex; align-items: center; justify-content: center; position: relative; opacity: 0.8;">
          <span style="background-color: white; padding: 4px 8px; font-size: 10px; color: #EF4444; font-weight: bold; position: absolute; border-radius: 4px;">
            ${pageBreakLabel}
          </span>
        </div>`;
        break;
      default:
        html += `<div style="${positionStyle} padding: 16px; border: 2px dashed #d1d5db; border-radius: 8px;">
          <p style="color: #9ca3af;">Component: ${component.type}</p>
        </div>`;
    }
  });
  
  html += `
  </div>
</body>
</html>`;
  
  return html;
}

export function setupRoutes(app: express.Application) {
  // Template CRUD routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates", error: error instanceof Error ? error.message : 'Unknown error' });
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
      console.error("Error creating template:", error);
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create template", error: error instanceof Error ? error.message : 'Unknown error' });
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
      const html = generateTemplateHTML(
        template.components as any[] || [],
        templateData,
        template.name,
        (template.styles as any)?.reportBackground || '#ffffff',
        (template.styles as any)?.reportBackgroundImage || ''
      );
      
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
      const html = generateTemplateHTML(
        template.components as any[] || [],
        templateData,
        template.name,
        (template.styles as any)?.reportBackground || '#ffffff',
        (template.styles as any)?.reportBackgroundImage || ''
      );
      
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
      const html = generateTemplateHTML(
        template.components as any[] || [],
        templateData,
        template.name,
        (template.styles as any)?.reportBackground || '#ffffff',
        (template.styles as any)?.reportBackgroundImage || ''
      );
      
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

  // Template-specific HTML export endpoint
  app.post("/api/templates/:id/export-html", async (req, res) => {
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
      
      // Generate HTML using template components and provided data
      const html = generateTemplateHTML(
        template.components as any[] || [],
        templateData,
        template.name,
        (template.styles as any)?.reportBackground || '#ffffff',
        (template.styles as any)?.reportBackgroundImage || ''
      );
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="template_${id}.html"`);
      return res.send(html);
    } catch (error) {
      console.error('HTML export error:', error);
      return res.status(500).json({ message: "Failed to export HTML" });
    }
  });

  // Legacy export HTML endpoint
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
      const html = generateTemplateHTML(
        template.components as any[] || [],
        data,
        template.name,
        (template.styles as any)?.reportBackground || '#ffffff',
        (template.styles as any)?.reportBackgroundImage || ''
      );
      
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

      const html = generateTemplateHTML(
        template.components as any[] || [],
        data,
        template.name,
        (template.styles as any)?.reportBackground || '#ffffff',
        (template.styles as any)?.reportBackgroundImage || ''
      );
      
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

      const html = generateTemplateHTML(
        template.components as any[] || [],
        data,
        template.name,
        (template.styles as any)?.reportBackground || '#ffffff',
        (template.styles as any)?.reportBackgroundImage || ''
      );
      
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
