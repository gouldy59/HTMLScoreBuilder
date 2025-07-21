import express from 'express';
import { createInsertSchema } from 'drizzle-zod';
import { templates } from '@shared/schema';
import { storage } from './storage';

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
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create template" });
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
      
      // Generate PDF using html-pdf-node
      const pdf = require('html-pdf-node');
      const options = { 
        format: 'A4',
        border: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      };

      const file = { content: html };
      const pdfBuffer = await pdf.generatePdf(file, options);
      
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
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.setViewport({ width: 1200, height: 1600 });
      
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const imageBuffer = await page.screenshot({ 
        type: 'png',
        fullPage: true 
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

// Helper function to generate HTML from template
function generateHTMLFromTemplate(template: any, data: any): string {
  // This is a simplified version - you'd want to implement the full HTML generation logic
  const components = template.components || [];
  const styles = template.styles || {};
  
  let htmlContent = '';
  
  components.forEach((component: any) => {
    switch (component.type) {
      case 'header':
        htmlContent += `<div class="header" style="background-color: ${component.style?.backgroundColor || '#f0f0f0'}; color: ${component.style?.textColor || '#000'}; padding: 20px;">`;
        htmlContent += `<h1>${replaceVariables(component.content?.title || '', data)}</h1>`;
        htmlContent += `<h2>${replaceVariables(component.content?.subtitle || '', data)}</h2>`;
        htmlContent += `</div>`;
        break;
      
      case 'student-info':
        htmlContent += `<div class="student-info" style="padding: 15px; border: 1px solid #ddd; margin: 10px 0;">`;
        htmlContent += `<h3>Student Information</h3>`;
        htmlContent += `<p><strong>Name:</strong> ${data.studentName || 'N/A'}</p>`;
        htmlContent += `<p><strong>ID:</strong> ${data.studentId || 'N/A'}</p>`;
        htmlContent += `<p><strong>Class:</strong> ${data.className || 'N/A'}</p>`;
        htmlContent += `</div>`;
        break;
      
      case 'horizontal-bar-chart':
      case 'chart':
        // Generate chart HTML with proper data
        const chartData = component.content?.chartData || [];
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0;">`;
        htmlContent += `<h3>${component.content?.title || 'Chart'}</h3>`;
        htmlContent += `<p>${component.content?.subtitle || ''}</p>`;
        
        chartData.forEach((item: any) => {
          const percentage = item.scoreValue || 0;
          htmlContent += `<div style="margin: 15px 0;">`;
          htmlContent += `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">`;
          htmlContent += `<span>${item.label}</span>`;
          htmlContent += `<span>${percentage}%</span>`;
          htmlContent += `</div>`;
          htmlContent += `<div style="background: #f0f0f0; height: 30px; border-radius: 15px; position: relative; overflow: hidden;">`;
          
          // Create segments
          let currentWidth = 0;
          (item.segments || []).forEach((segment: any) => {
            htmlContent += `<div style="position: absolute; left: ${currentWidth}%; width: ${segment.value}%; height: 100%; background-color: ${segment.color};"></div>`;
            currentWidth += segment.value;
          });
          
          // Add score pointer
          htmlContent += `<div style="position: absolute; left: ${percentage}%; top: 50%; transform: translateX(-50%) translateY(-50%); width: 12px; height: 12px; background: #333; border-radius: 50%; border: 2px solid white; z-index: 10;"></div>`;
          htmlContent += `</div>`;
          htmlContent += `</div>`;
        });
        
        htmlContent += `</div>`;
        break;
      
      default:
        htmlContent += `<div class="component" style="padding: 10px; margin: 10px 0; border: 1px dashed #ccc;">`;
        htmlContent += `<p>Component type: ${component.type}</p>`;
        htmlContent += `</div>`;
    }
  });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${template.name}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: ${styles.reportBackground || '#ffffff'};
        }
        .header { border-radius: 8px; margin-bottom: 20px; }
        .student-info { border-radius: 8px; }
        .chart-container { border-radius: 8px; background: white; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;
}

function replaceVariables(text: string, data: any): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}