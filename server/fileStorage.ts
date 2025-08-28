import fs from 'fs/promises';
import path from 'path';
import { type Template, type InsertTemplate, type User, type InsertUser, type CreateVersion, type InsertAuditLog, type AuditLog } from "@shared/schema";
import { IStorage } from './storage';

const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');

interface FileStorageData {
  templates: Template[];
  users: User[];
  auditLogs: AuditLog[];
  nextTemplateId: number;
  nextUserId: number;
  nextAuditLogId: number;
}

export class FileStorage implements IStorage {
  private data: FileStorageData;
  private initialized = false;

  constructor() {
    this.data = {
      templates: [],
      users: [],
      auditLogs: [],
      nextTemplateId: 1,
      nextUserId: 1,
      nextAuditLogId: 1
    };
  }

  private async ensureInitialized() {
    if (this.initialized) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      try {
        const templatesData = await fs.readFile(TEMPLATES_FILE, 'utf8');
        const usersData = await fs.readFile(USERS_FILE, 'utf8');
        const auditLogsData = await fs.readFile(AUDIT_LOGS_FILE, 'utf8');
        
        this.data = {
          templates: JSON.parse(templatesData),
          users: JSON.parse(usersData),
          auditLogs: JSON.parse(auditLogsData),
          nextTemplateId: Math.max(...JSON.parse(templatesData).map((t: Template) => t.id), 0) + 1,
          nextUserId: Math.max(...JSON.parse(usersData).map((u: User) => u.id), 0) + 1,
          nextAuditLogId: Math.max(...JSON.parse(auditLogsData).map((a: AuditLog) => a.id), 0) + 1
        };
      } catch (error) {
        // Files don't exist, create with initial data
        await this.saveData();
      }
    } catch (error) {
      console.error('Error initializing file storage:', error);
    }

    this.initialized = true;
  }

  private async saveData() {
    try {
      await fs.writeFile(TEMPLATES_FILE, JSON.stringify(this.data.templates, null, 2));
      await fs.writeFile(USERS_FILE, JSON.stringify(this.data.users, null, 2));
      await fs.writeFile(AUDIT_LOGS_FILE, JSON.stringify(this.data.auditLogs, null, 2));
    } catch (error) {
      console.error('Error saving file storage data:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    await this.ensureInitialized();
    return this.data.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    return this.data.users.find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureInitialized();
    const user: User = { ...insertUser, id: this.data.nextUserId++ };
    this.data.users.push(user);
    await this.saveData();
    return user;
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    await this.ensureInitialized();
    return this.data.templates.find(t => t.id === id);
  }

  async getAllTemplates(): Promise<Template[]> {
    await this.ensureInitialized();
    return [...this.data.templates].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }

  async getTemplateFamilies(): Promise<Template[]> {
    await this.ensureInitialized();
    return this.data.templates.filter(t => t.isLatest).sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    await this.ensureInitialized();
    
    // Check for name uniqueness
    if (this.data.templates.some(t => t.name === template.name)) {
      throw new Error(`Template with name "${template.name}" already exists`);
    }

    const now = new Date();
    const newTemplate: Template = {
      ...template,
      id: this.data.nextTemplateId++,
      version: 1,
      isLatest: true,
      parentId: null,
      isPublished: false,
      publishedAt: null,
      createdAt: now,
      updatedAt: now
    };

    this.data.templates.push(newTemplate);
    await this.saveData();
    return newTemplate;
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined> {
    await this.ensureInitialized();
    
    const index = this.data.templates.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    // Check for name uniqueness if name is being updated
    if (template.name && this.data.templates.some(t => t.name === template.name && t.id !== id)) {
      throw new Error(`Template with name "${template.name}" already exists`);
    }

    const updated = {
      ...this.data.templates[index],
      ...template,
      updatedAt: new Date()
    };

    this.data.templates[index] = updated;
    await this.saveData();
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    await this.ensureInitialized();
    
    const index = this.data.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.data.templates.splice(index, 1);
    await this.saveData();
    return true;
  }

  async createTemplateVersion(templateId: number, version: CreateVersion): Promise<Template> {
    await this.ensureInitialized();
    
    const originalTemplate = this.data.templates.find(t => t.id === templateId);
    if (!originalTemplate) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    // Mark original as not latest
    const parentId = originalTemplate.parentId || templateId;
    this.data.templates.forEach(t => {
      if (t.id === parentId || t.parentId === parentId) {
        t.isLatest = false;
      }
    });

    const now = new Date();
    const newVersion: Template = {
      ...version,
      id: this.data.nextTemplateId++,
      version: originalTemplate.version + 1,
      isLatest: true,
      parentId: parentId,
      isPublished: false,
      publishedAt: null,
      createdAt: now,
      updatedAt: now
    };

    this.data.templates.push(newVersion);
    await this.saveData();
    return newVersion;
  }

  async getTemplateVersions(templateId: number): Promise<Template[]> {
    await this.ensureInitialized();
    
    const template = this.data.templates.find(t => t.id === templateId);
    if (!template) return [];

    const parentId = template.parentId || templateId;
    return this.data.templates
      .filter(t => t.id === parentId || t.parentId === parentId)
      .sort((a, b) => b.version - a.version);
  }

  async getTemplateHistory(templateId: number): Promise<Template[]> {
    return this.getTemplateVersions(templateId);
  }

  async revertToVersion(templateId: number, targetVersionId: number): Promise<Template | undefined> {
    await this.ensureInitialized();
    
    const targetVersion = this.data.templates.find(t => t.id === targetVersionId);
    if (!targetVersion) return undefined;

    // Mark all versions as not latest
    const parentId = targetVersion.parentId || targetVersionId;
    this.data.templates.forEach(t => {
      if (t.id === parentId || t.parentId === parentId) {
        t.isLatest = false;
      }
    });

    // Mark target version as latest
    targetVersion.isLatest = true;
    await this.saveData();
    return targetVersion;
  }

  async getLatestVersion(templateId: number): Promise<Template | undefined> {
    await this.ensureInitialized();
    
    const template = this.data.templates.find(t => t.id === templateId);
    if (!template) return undefined;

    const parentId = template.parentId || templateId;
    return this.data.templates.find(t => (t.id === parentId || t.parentId === parentId) && t.isLatest);
  }

  async publishTemplate(templateId: number): Promise<Template | undefined> {
    await this.ensureInitialized();
    
    const template = this.data.templates.find(t => t.id === templateId);
    if (!template) return undefined;

    template.isPublished = true;
    template.publishedAt = new Date();
    template.updatedAt = new Date();
    
    await this.saveData();
    return template;
  }

  async unpublishTemplate(templateId: number): Promise<Template | undefined> {
    await this.ensureInitialized();
    
    const template = this.data.templates.find(t => t.id === templateId);
    if (!template) return undefined;

    template.isPublished = false;
    template.publishedAt = null;
    template.updatedAt = new Date();
    
    await this.saveData();
    return template;
  }

  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    await this.ensureInitialized();
    
    const log: AuditLog = {
      ...auditLog,
      id: this.data.nextAuditLogId++,
      timestamp: new Date()
    };

    this.data.auditLogs.push(log);
    await this.saveData();
    return log;
  }

  async getTemplateAuditHistory(templateId: number): Promise<AuditLog[]> {
    await this.ensureInitialized();
    
    return this.data.auditLogs
      .filter(log => log.templateId === templateId)
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  }
}