import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTemplateSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}

function replaceVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return data[variable] || match;
  });
}
