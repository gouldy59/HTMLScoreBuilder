import express from 'express';
import { createInsertSchema } from 'drizzle-zod';
import { templates } from '@shared/schema';
import { storage } from './storage';
import pdf from 'html-pdf-node';
import puppeteer from 'puppeteer';

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
      
      const imageBuffer = await page.screenshot({ 
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 794, height: 1123 } 
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
  const components = template.components || [];
  const styles = template.styles || {};
  
  let htmlContent = '';
  
  components.forEach((component: any) => {
    // Generate position style for absolute positioning like the client-side version
    const position = component.position || { x: 0, y: 0 };
    const size = component.size || { width: 200, height: 100 };
    // Use component style dimensions if available for better sizing
    const actualWidth = component.style?.width ? parseInt(component.style.width) : size.width;
    const actualHeight = component.style?.height ? parseInt(component.style.height) : size.height;
    const positionStyle = `position: absolute; left: ${position.x}px; top: ${position.y}px; width: ${actualWidth}px; height: ${actualHeight}px;`;
    
    const style = component.style || {};
    switch (component.type) {
      case 'header':
        htmlContent += `<div class="header" style="${positionStyle} background-color: ${style.backgroundColor || '#f0f0f0'}; color: ${style.textColor || '#000'}; padding: 20px; border-radius: 8px;">`;
        htmlContent += `<h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">${replaceVariables(component.content?.title || '', data)}</h1>`;
        htmlContent += `<h2 style="margin: 0; font-size: 18px; font-weight: normal; opacity: 0.8;">${replaceVariables(component.content?.subtitle || '', data)}</h2>`;
        htmlContent += `</div>`;
        break;
      
      case 'student-info':
        htmlContent += `<div class="student-info" style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">`;
        htmlContent += `<h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: ${style.textColor || '#1f2937'};">Student Information</h3>`;
        htmlContent += `<p style="margin: 4px 0; color: ${style.textColor || '#374151'};"><strong>Name:</strong> ${replaceVariables('{{studentName}}', data) || data.studentName || 'N/A'}</p>`;
        htmlContent += `<p style="margin: 4px 0; color: ${style.textColor || '#374151'};"><strong>ID:</strong> ${replaceVariables('{{studentId}}', data) || data.studentId || 'N/A'}</p>`;
        htmlContent += `<p style="margin: 4px 0; color: ${style.textColor || '#374151'};"><strong>Class:</strong> ${replaceVariables('{{className}}', data) || data.className || 'N/A'}</p>`;
        htmlContent += `</div>`;
        break;
      
      case 'horizontal-bar-chart':
      case 'bar-chart':
      case 'chart':
        // Generate chart HTML with proper data
        const chartData = component.content?.chartData || [];
        console.log('Chart data for PDF generation:', JSON.stringify(chartData, null, 2));
        
        // Calculate proper chart dimensions - use actual component dimensions
        const chartWidth = Math.max(actualWidth - 20, 200); // Use component width with small padding
        const chartHeight = Math.max(actualHeight - 60, 150); // Use most of component height
        
        console.log(`Chart dimensions: width=${chartWidth}, height=${chartHeight}, actualSize=${actualWidth}x${actualHeight}, originalSize=${size.width}x${size.height}`);
        
        htmlContent += `<div class="chart-container" style="${positionStyle} background-color: ${style.backgroundColor || '#ffffff'}; padding: 10px; border-radius: 8px; overflow: visible; box-sizing: border-box; width: 100%; height: 100%;">`;
        htmlContent += `<h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${component.content?.title || 'Chart'}</h3>`;
        htmlContent += `<p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280;">${component.content?.subtitle || ''}</p>`;
        
        // If no chart data, show placeholder
        if (chartData.length === 0) {
          htmlContent += `<div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">`;
          htmlContent += `<p style="color: #6c757d; margin: 0;">No chart data available</p>`;
          htmlContent += `</div>`;
        } else {
          chartData.forEach((item: any, itemIndex: number) => {
            const percentage = item.scoreValue || 0;
            htmlContent += `<div style="margin: ${itemIndex > 0 ? '12px' : '0'} 0 12px 0;">`;
            
            // Label and percentage row
            htmlContent += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">`;
            htmlContent += `<span style="font-size: 14px; font-weight: 500; color: #374151;">${item.label}</span>`;
            htmlContent += `<span style="font-size: 14px; font-weight: 600; color: #1f2937;">${percentage}%</span>`;
            htmlContent += `</div>`;
            
            // Create the bar container that fits within chart width
            const barWidth = Math.min(chartWidth - 10, chartWidth * 0.9); // Use 90% of chart width with margin
            console.log(`Bar width: ${barWidth}px (chartWidth: ${chartWidth}px, componentWidth: ${actualWidth}px)`);
            htmlContent += `<div style="width: ${barWidth}px; height: 28px; background-color: #f3f4f6; border-radius: 14px; position: relative; overflow: hidden; border: 1px solid #e5e7eb; margin: 0 auto;">`;
            
            // Create segments if they exist
            if (item.segments && item.segments.length > 0) {
              let currentWidth = 0;
              item.segments.forEach((segment: any, index: number) => {
                const segmentColor = segment.color || '#e5e7eb';
                const segmentWidth = segment.value || 0;
                console.log(`Segment ${index}: color=${segmentColor}, width=${segmentWidth}%, left=${currentWidth}%`);
                
                // Create segment div with solid background colors
                htmlContent += `<div style="position: absolute; left: ${currentWidth}%; width: ${segmentWidth}%; height: 100%; background-color: ${segmentColor}; border-radius: ${index === 0 ? '14px 0 0 14px' : (index === item.segments.length - 1 ? '0 14px 14px 0' : '0')};">`;
                htmlContent += `</div>`;
                currentWidth += segmentWidth;
              });
            } else {
              // Fallback: create a simple progress bar if no segments
              htmlContent += `<div style="position: absolute; left: 0%; width: ${Math.min(percentage, 100)}%; height: 100%; background-color: #3B82F6; border-radius: 14px;"></div>`;
            }
            
            // Add score pointer with enhanced visibility - positioned relative to actual bar width
            if (percentage >= 0 && percentage <= 100) {
              // Calculate actual pixel position based on bar width instead of percentage
              const pointerPosition = (percentage / 100) * barWidth;
              console.log(`Pointer for ${item.label}: ${percentage}% = ${pointerPosition}px (barWidth: ${barWidth}px)`);
              htmlContent += `<div style="position: absolute; left: ${pointerPosition}px; top: 50%; transform: translateX(-50%) translateY(-50%); width: 12px; height: 12px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; z-index: 10; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`;
            }
            
            htmlContent += `</div>`;  // Close bar container
            htmlContent += `</div>`;  // Close item container
          });
        }
        
        htmlContent += `</div>`;
        break;

      case 'column-chart':
      case 'line-chart':
      case 'pie-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0; text-align: center;">`;
        htmlContent += `<h3>${component.content?.title || 'Chart'}</h3>`;
        htmlContent += `<div style="height: 200px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center;">`;
        htmlContent += `<p style="color: #666;">${component.type.charAt(0).toUpperCase() + component.type.slice(1)} visualization</p>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'lollipop-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0;">`;
        htmlContent += `<h3>${component.content?.title || 'Lollipop Chart'}</h3>`;
        htmlContent += `<div style="margin: 20px 0;">`;
        htmlContent += `<div style="display: flex; align-items: center; margin: 15px 0;">`;
        htmlContent += `<span style="width: 80px; font-size: 14px; font-weight: 500;">Math</span>`;
        htmlContent += `<div style="flex: 1; display: flex; align-items: center;">`;
        htmlContent += `<div style="height: 2px; width: 170px; background-color: #60A5FA;"></div>`;
        htmlContent += `<div style="width: 16px; height: 16px; border-radius: 50%; background-color: #2563EB; margin-left: -6px;"></div>`;
        htmlContent += `<span style="margin-left: 8px; font-size: 14px; color: #666;">85%</span>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'nightingale-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0; text-align: center;">`;
        htmlContent += `<h3>${component.content?.title || 'Nightingale Chart'}</h3>`;
        htmlContent += `<div style="height: 200px; display: flex; align-items: center; justify-content: center;">`;
        htmlContent += `<svg width="200" height="200" viewBox="0 0 200 200">`;
        htmlContent += `<circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" stroke-width="1" />`;
        htmlContent += `<path d="M 100 100 L 100 20 A 80 80 0 0 1 156.57 56.57 Z" fill="#3B82F6" opacity="0.8" />`;
        htmlContent += `<path d="M 100 100 L 156.57 56.57 A 80 80 0 0 1 180 100 Z" fill="#10B981" opacity="0.8" />`;
        htmlContent += `</svg>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'icon-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0;">`;
        htmlContent += `<h3>${component.content?.title || 'Icon Chart'}</h3>`;
        htmlContent += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">`;
        htmlContent += `<div style="text-align: center;">`;
        htmlContent += `<div style="font-size: 32px; margin-bottom: 8px;">👨‍🎓</div>`;
        htmlContent += `<div style="font-size: 18px; font-weight: 600; color: #374151;">85</div>`;
        htmlContent += `<div style="font-size: 14px; color: #6B7280;">Students</div>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'word-cloud':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0; text-align: center;">`;
        htmlContent += `<h3>${component.content?.title || 'Word Cloud'}</h3>`;
        htmlContent += `<div style="height: 200px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px;">`;
        htmlContent += `<span style="font-size: 24px; color: #3B82F6; font-weight: bold;">Excellence</span>`;
        htmlContent += `<span style="font-size: 20px; color: #10B981; font-weight: bold;">Achievement</span>`;
        htmlContent += `<span style="font-size: 18px; color: #F59E0B; font-weight: bold;">Performance</span>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'table-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0;">`;
        htmlContent += `<h3>${component.content?.title || 'Performance Table'}</h3>`;
        htmlContent += `<table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">`;
        htmlContent += `<thead>`;
        htmlContent += `<tr style="background-color: #f9fafb;">`;
        htmlContent += `<th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: left;">Subject</th>`;
        htmlContent += `<th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: center;">Score</th>`;
        htmlContent += `<th style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: center;">Grade</th>`;
        htmlContent += `</tr>`;
        htmlContent += `</thead>`;
        htmlContent += `<tbody>`;
        htmlContent += `<tr><td style="border: 1px solid #d1d5db; padding: 8px 16px;">Mathematics</td><td style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: center;">85</td><td style="border: 1px solid #d1d5db; padding: 8px 16px; text-align: center;">A</td></tr>`;
        htmlContent += `</tbody>`;
        htmlContent += `</table>`;
        htmlContent += `</div>`;
        break;

      case 'bubble-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0; text-align: center;">`;
        htmlContent += `<h3>${component.content?.title || 'Bubble Chart'}</h3>`;
        htmlContent += `<div style="height: 200px; background: #f9fafb; border-radius: 8px; position: relative;">`;
        htmlContent += `<svg width="100%" height="100%" viewBox="0 0 100 100">`;
        htmlContent += `<circle cx="20" cy="30" r="5" fill="#3B82F6" opacity="0.7" />`;
        htmlContent += `<circle cx="60" cy="20" r="6" fill="#10B981" opacity="0.7" />`;
        htmlContent += `</svg>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'stacked-column-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0; text-align: center;">`;
        htmlContent += `<h3>${component.content?.title || 'Stacked Column Chart'}</h3>`;
        htmlContent += `<div style="height: 200px; display: flex; align-items: end; justify-content: center; gap: 16px;">`;
        htmlContent += `<div style="display: flex; flex-direction: column; align-items: center;">`;
        htmlContent += `<div style="width: 48px; display: flex; flex-direction: column;" >`;
        htmlContent += `<div style="height: 30px; background-color: #3B82F6;"></div>`;
        htmlContent += `<div style="height: 40px; background-color: #10B981;"></div>`;
        htmlContent += `<div style="height: 50px; background-color: #F59E0B;"></div>`;
        htmlContent += `</div>`;
        htmlContent += `<div style="font-size: 12px; color: #6B7280; margin-top: 8px;">Q1</div>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'donut-chart':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0; text-align: center;">`;
        htmlContent += `<h3>${component.content?.title || 'Donut Chart'}</h3>`;
        htmlContent += `<div style="display: flex; align-items: center; justify-content: center;">`;
        htmlContent += `<svg width="200" height="160" viewBox="0 0 200 160">`;
        htmlContent += `<path d="M 100 80 L 100 10 A 70 70 0 0 1 170 80 L 135 80 A 35 35 0 0 0 100 45 Z" fill="#3B82F6" opacity="0.8" />`;
        htmlContent += `<text x="100" y="75" text-anchor="middle" style="font-size: 14px; font-weight: 600; fill: #374151;">Total</text>`;
        htmlContent += `<text x="100" y="90" text-anchor="middle" style="font-size: 18px; font-weight: bold; fill: #1F2937;">100%</text>`;
        htmlContent += `</svg>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'venn-diagram':
        htmlContent += `<div class="chart-container" style="padding: 20px; margin: 20px 0; text-align: center;">`;
        htmlContent += `<h3>${component.content?.title || 'Venn Diagram'}</h3>`;
        htmlContent += `<div style="display: flex; align-items: center; justify-content: center; height: 200px;">`;
        htmlContent += `<svg width="240" height="180" viewBox="0 0 240 180">`;
        htmlContent += `<circle cx="80" cy="90" r="50" fill="#3B82F6" opacity="0.6" stroke="#3B82F6" stroke-width="2" />`;
        htmlContent += `<circle cx="160" cy="90" r="50" fill="#10B981" opacity="0.6" stroke="#10B981" stroke-width="2" />`;
        htmlContent += `<text x="60" y="95" text-anchor="middle" style="font-size: 12px; font-weight: 500; fill: white;">25</text>`;
        htmlContent += `<text x="120" y="95" text-anchor="middle" style="font-size: 12px; font-weight: 500; fill: white;">15</text>`;
        htmlContent += `<text x="180" y="95" text-anchor="middle" style="font-size: 12px; font-weight: 500; fill: white;">30</text>`;
        htmlContent += `</svg>`;
        htmlContent += `</div>`;
        htmlContent += `</div>`;
        break;

      case 'qr-code':
        const qrData = replaceVariables(component.content?.data || 'https://example.com', data);
        const qrLabel = replaceVariables(component.content?.label || '', data);
        const qrSize = component.content?.size || 150;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrData)}&format=png&margin=10`;
        
        htmlContent += `<div class="qr-code-container" style="text-align: ${component.style?.textAlign || 'center'}; background-color: ${component.style?.backgroundColor || '#FFFFFF'}; padding: ${component.style?.padding || '16px'}; border-radius: 8px; margin: 20px 0;">`;
        
        if (qrLabel) {
          htmlContent += `<h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${component.style?.textColor || '#1F2937'};">${qrLabel}</h4>`;
        }
        
        htmlContent += `<div style="display: inline-block;">`;
        htmlContent += `<img src="${qrCodeUrl}" alt="QR Code for ${qrData}" style="width: ${qrSize}px; height: ${qrSize}px; display: block; margin: 0 auto; background-color: #FFFFFF; padding: 4px; border-radius: 4px;" />`;
        htmlContent += `</div>`;
        
        if (qrData && qrData !== 'https://example.com') {
          htmlContent += `<p style="margin: 8px 0 0 0; font-size: 12px; color: ${component.style?.textColor || '#6B7280'}; word-break: break-all; max-width: ${qrSize + 20}px; margin-left: auto; margin-right: auto;">${qrData}</p>`;
        }
        
        htmlContent += `</div>`;
        break;

      case 'image':
        const imageSrc = replaceVariables(component.content?.src || '', data);
        const imageAlt = replaceVariables(component.content?.alt || 'Report image', data);
        const imageCaption = replaceVariables(component.content?.caption || '', data);
        
        htmlContent += `<div class="image-container" style="text-align: center; margin: 20px 0;">`;
        
        if (imageSrc) {
          htmlContent += `<img src="${imageSrc}" alt="${imageAlt}" style="max-width: 100%; height: auto; border-radius: ${component.style?.borderRadius || '8px'}; width: ${component.style?.width || 'auto'}; ${component.style?.height ? `height: ${component.style.height};` : ''}" />`;
          
          if (imageCaption) {
            htmlContent += `<p style="margin-top: 8px; font-size: 14px; color: ${component.style?.textColor || '#6B7280'}; font-style: italic;">${imageCaption}</p>`;
          }
        } else {
          // Placeholder for missing image
          htmlContent += `<div style="width: ${component.style?.width || '300px'}; height: ${component.style?.height || '200px'}; background-color: #F3F4F6; border: 2px dashed #D1D5DB; border-radius: ${component.style?.borderRadius || '8px'}; display: flex; align-items: center; justify-content: center; color: #6B7280;">`;
          htmlContent += `<span>Image not available</span>`;
          htmlContent += `</div>`;
        }
        
        htmlContent += `</div>`;
        break;
      
      case 'text-block':
        const textContent = replaceVariables(component.content?.text || 'Text content', data);
        htmlContent += `<div class="text-block" style="${positionStyle} padding: ${style.padding || '12px'}; color: ${style.textColor || '#000000'}; font-size: ${style.fontSize || '16px'}; text-align: ${style.textAlign || 'left'}; background-color: ${style.backgroundColor || 'transparent'}; border-radius: ${style.borderRadius || '8px'}; line-height: 1.5;">`;
        htmlContent += textContent;
        htmlContent += `</div>`;
        break;

      case 'container':
        const containerChildren = component.children || [];
        const containerLayout = component.content?.layout || 'vertical';
        const containerGap = component.content?.gap || '16px';
        
        htmlContent += `<div class="container" style="padding: ${component.style?.padding || '20px'}; margin: ${component.style?.margin || '10px 0'}; background-color: ${component.style?.backgroundColor || '#f8f9fa'}; border-radius: ${component.style?.borderRadius || '8px'}; border: ${component.style?.border || '1px solid #e9ecef'};">`;
        
        if (containerChildren.length > 0) {
          let layoutStyle = '';
          switch (containerLayout) {
            case 'horizontal':
              layoutStyle = `display: flex; flex-direction: row; gap: ${containerGap};`;
              break;
            case 'grid':
              layoutStyle = `display: grid; grid-template-columns: 1fr 1fr; gap: ${containerGap};`;
              break;
            case 'vertical':
            default:
              layoutStyle = `display: flex; flex-direction: column; gap: ${containerGap};`;
          }
          
          htmlContent += `<div style="${layoutStyle}">`;
          containerChildren.forEach((child: any) => {
            htmlContent += generateHTMLFromTemplate({ components: [child] }, data).replace(/<!DOCTYPE html>[\s\S]*<body[^>]*>|<\/body>[\s\S]*<\/html>/g, '');
          });
          htmlContent += `</div>`;
        } else {
          htmlContent += `<div style="min-height: 96px; display: flex; align-items: center; justify-content: center; border: 2px dashed #D1D5DB; border-radius: 4px; color: #9CA3AF;">`;
          htmlContent += `<p style="text-align: center; font-size: 14px;">Container Content Area</p>`;
          htmlContent += `</div>`;
        }
        
        htmlContent += `</div>`;
        break;

      default:
        htmlContent += `<div class="component" style="padding: 10px; margin: 10px 0; border: 1px dashed #ccc; background-color: #f8f9fa; border-radius: 4px;">`;
        htmlContent += `<p style="color: #6c757d; font-style: italic;">Unsupported component type: ${component.type}</p>`;
        htmlContent += `</div>`;
    }
  });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.name}</title>
    <style>
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @page {
          size: A4;
          margin: 0.5in;
        }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: ${styles.reportBackground || '#ffffff'};
          ${styles.reportBackgroundImage ? `background-image: url('${styles.reportBackgroundImage}'); background-size: cover; background-repeat: no-repeat; background-position: center;` : ''}
          min-height: 100vh;
        }
        .report-container {
          position: relative; 
          width: 100%; 
          min-height: 800px; 
          background: ${styles.reportBackground || '#ffffff'}; 
          overflow: visible;
        }
        
        /* Enhanced styling for chart components */
        .chart-container {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Ensure all colored elements render in PDF */
        div[style*="background"] {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Force color rendering for chart segments */
        .chart-container div {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
    </style>
</head>
<body>
    <div class="report-container">
        ${htmlContent}
    </div>
</body>
</html>`;
}

function replaceVariables(text: string, data: any): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}