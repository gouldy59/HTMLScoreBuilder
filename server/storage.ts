import { templates, users, templateAuditLog, type Template, type InsertTemplate, type User, type InsertUser, type CreateVersion, type InsertAuditLog, type AuditLog } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Template CRUD operations
  getTemplate(id: number): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  
  // Template versioning operations
  createTemplateVersion(templateId: number, version: CreateVersion): Promise<Template>;
  getTemplateVersions(templateId: number): Promise<Template[]>;
  getTemplateHistory(templateId: number): Promise<Template[]>;
  revertToVersion(templateId: number, targetVersionId: number): Promise<Template | undefined>;
  getLatestVersion(templateId: number): Promise<Template | undefined>;
  
  // Template publish operations
  publishTemplate(templateId: number): Promise<Template | undefined>;
  unpublishTemplate(templateId: number): Promise<Template | undefined>;
  
  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getTemplateAuditHistory(templateId: number): Promise<AuditLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private templates: Map<number, Template>;
  private auditLogs: Map<number, AuditLog>;
  private currentUserId: number;
  private currentTemplateId: number;
  private currentAuditLogId: number;
  // Map to track template families: parentId -> Set of version IDs
  private templateFamilies: Map<number, Set<number>>;

  constructor() {
    this.users = new Map();
    this.templates = new Map();
    this.auditLogs = new Map();
    this.templateFamilies = new Map();
    this.currentUserId = 1;
    this.currentTemplateId = 1;
    this.currentAuditLogId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    // Only return the latest version of each template family
    const familyLatestMap = new Map<number, Template>();
    
    Array.from(this.templates.values()).forEach(template => {
      const familyId = template.parentId || template.id;
      
      // Only include templates that are marked as latest
      if (template.isLatest) {
        familyLatestMap.set(familyId, template);
      }
    });
    
    return Array.from(familyLatestMap.values())
      .sort((a, b) => 
        new Date(b.updatedAt || b.createdAt || 0).getTime() - 
        new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    // Generate unique name if needed
    let finalName = insertTemplate.name;
    const existingTemplates = await this.getAllTemplates();
    
    // Check if name already exists and generate unique name
    const nameExists = existingTemplates.some(t => t.name === finalName);
    if (nameExists) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      finalName = `${insertTemplate.name} ${timestamp}`;
    }

    const id = this.currentTemplateId++;
    const now = new Date();
    const template: Template = {
      id,
      name: finalName,
      description: insertTemplate.description || null,
      components: insertTemplate.components || [],
      variables: insertTemplate.variables || {},
      styles: insertTemplate.styles || {},
      version: 1,
      isLatest: true,
      parentId: null,
      changeDescription: null,
      isPublished: false,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.templates.set(id, template);
    
    // Initialize template family
    this.templateFamilies.set(id, new Set([id]));
    
    // Create audit log
    await this.createAuditLog({
      templateId: id,
      action: 'create',
      oldValues: null,
      newValues: template,
      changeDescription: 'Template created'
    });
    
    return template;
  }

  async updateTemplate(id: number, templateUpdate: Partial<InsertTemplate>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;

    // Check for unique template name if name is being updated
    if (templateUpdate.name && templateUpdate.name !== existing.name) {
      const existingTemplates = await this.getAllTemplates();
      const nameExists = existingTemplates.some(t => t.name === templateUpdate.name && t.id !== id);
      if (nameExists) {
        throw new Error(`Template name "${templateUpdate.name}" already exists`);
      }
    }

    const updated: Template = {
      ...existing,
      ...templateUpdate,
      updatedAt: new Date(),
    };
    this.templates.set(id, updated);
    
    // Create audit log
    await this.createAuditLog({
      templateId: id,
      action: 'update',
      oldValues: existing,
      newValues: updated,
      changeDescription: 'Template updated'
    });
    
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) return false;
    
    // Get the parent ID (either this template's parentId or its own id if it's the original)
    const familyId = template.parentId || id;
    
    // Delete all versions of this template family
    const family = this.templateFamilies.get(familyId);
    if (family) {
      family.forEach(versionId => this.templates.delete(versionId));
      this.templateFamilies.delete(familyId);
    }
    
    return true;
  }

  // Template versioning operations
  async createTemplateVersion(templateId: number, version: CreateVersion): Promise<Template> {
    const originalTemplate = this.templates.get(templateId);
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    // Get the family ID (either parentId or the template's own ID)
    const familyId = originalTemplate.parentId || templateId;
    
    // Get current versions in this family
    const family = this.templateFamilies.get(familyId) || new Set();
    const versions = Array.from(family).map(id => this.templates.get(id)).filter(Boolean) as Template[];
    const nextVersion = Math.max(...versions.map(v => v.version)) + 1;

    // Mark previous latest as not latest
    versions.forEach(v => {
      if (v.isLatest) {
        this.templates.set(v.id, { ...v, isLatest: false });
      }
    });

    // Create new version
    const newVersionId = this.currentTemplateId++;
    const now = new Date();
    const newVersion: Template = {
      id: newVersionId,
      name: version.name,
      description: version.description || null,
      components: version.components || [],
      variables: version.variables || {},
      styles: version.styles || {},
      version: nextVersion,
      isLatest: true,
      parentId: familyId,
      changeDescription: version.changeDescription || null,
      isPublished: false,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(newVersionId, newVersion);
    
    // Add to family
    family.add(newVersionId);
    this.templateFamilies.set(familyId, family);
    
    // Create audit log
    await this.createAuditLog({
      templateId: newVersionId,
      action: 'version_created',
      oldValues: originalTemplate,
      newValues: newVersion,
      changeDescription: version.changeDescription || 'New version created'
    });

    return newVersion;
  }

  async getTemplateVersions(templateId: number): Promise<Template[]> {
    const template = this.templates.get(templateId);
    if (!template) return [];

    const familyId = template.parentId || templateId;
    const family = this.templateFamilies.get(familyId) || new Set();
    
    return Array.from(family)
      .map(id => this.templates.get(id))
      .filter(Boolean)
      .sort((a, b) => b!.version - a!.version) as Template[];
  }

  async getTemplateHistory(templateId: number): Promise<Template[]> {
    return this.getTemplateVersions(templateId);
  }

  async revertToVersion(templateId: number, targetVersionId: number): Promise<Template | undefined> {
    const targetVersion = this.templates.get(targetVersionId);
    if (!targetVersion) return undefined;

    const currentTemplate = this.templates.get(templateId);
    if (!currentTemplate) return undefined;

    // Get family ID
    const familyId = currentTemplate.parentId || templateId;
    
    // Make sure target version belongs to the same family
    const family = this.templateFamilies.get(familyId);
    if (!family || !family.has(targetVersionId)) return undefined;

    // Create new version based on target version
    const revertedVersion = await this.createTemplateVersion(templateId, {
      name: targetVersion.name,
      description: targetVersion.description,
      components: targetVersion.components,
      variables: targetVersion.variables,
      styles: targetVersion.styles,
      changeDescription: `Reverted to version ${targetVersion.version}`,
    });

    return revertedVersion;
  }

  async getLatestVersion(templateId: number): Promise<Template | undefined> {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const familyId = template.parentId || templateId;
    const family = this.templateFamilies.get(familyId) || new Set();
    
    const versions = Array.from(family)
      .map(id => this.templates.get(id))
      .filter(Boolean) as Template[];
    
    return versions.find(v => v.isLatest);
  }

  // Template publish operations
  async publishTemplate(templateId: number): Promise<Template | undefined> {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const oldValues = { ...template };
    const now = new Date();
    const updated: Template = {
      ...template,
      isPublished: true,
      publishedAt: now,
      updatedAt: now,
    };

    this.templates.set(templateId, updated);
    
    // Create audit log
    await this.createAuditLog({
      templateId: templateId,
      action: 'publish',
      oldValues: oldValues,
      newValues: updated,
      changeDescription: 'Template published'
    });

    return updated;
  }

  async unpublishTemplate(templateId: number): Promise<Template | undefined> {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const oldValues = { ...template };
    const updated: Template = {
      ...template,
      isPublished: false,
      publishedAt: null,
      updatedAt: new Date(),
    };

    this.templates.set(templateId, updated);
    
    // Create audit log
    await this.createAuditLog({
      templateId: templateId,
      action: 'unpublish',
      oldValues: oldValues,
      newValues: updated,
      changeDescription: 'Template unpublished'
    });

    return updated;
  }

  // Audit log operations
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.currentAuditLogId++;
    const now = new Date();
    const log: AuditLog = {
      id,
      templateId: auditLog.templateId,
      action: auditLog.action,
      oldValues: auditLog.oldValues,
      newValues: auditLog.newValues,
      changeDescription: auditLog.changeDescription,
      timestamp: now,
    };

    this.auditLogs.set(id, log);
    return log;
  }

  async getTemplateAuditHistory(templateId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .filter(log => log.templateId === templateId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

export const storage = new MemStorage();
