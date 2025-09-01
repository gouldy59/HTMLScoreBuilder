using Microsoft.EntityFrameworkCore;
using HTMLScoreBuilder.API.Data;
using HTMLScoreBuilder.API.Models;
using HTMLScoreBuilder.API.Models.DTOs;
using System.Text.Json;

namespace HTMLScoreBuilder.API.Services;

public class TemplateService : ITemplateService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TemplateService> _logger;

    public TemplateService(ApplicationDbContext context, ILogger<TemplateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // User operations
    public async Task<User?> GetUserAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetUserByUsernameAsync(string username)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User> CreateUserAsync(string username, string password)
    {
        var user = new User
        {
            Username = username,
            Password = password // Note: In production, hash this password
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    // Template CRUD operations
    public async Task<Template?> GetTemplateAsync(int id)
    {
        return await _context.Templates.FindAsync(id);
    }

    public async Task<IEnumerable<Template>> GetAllTemplatesAsync()
    {
        return await _context.Templates
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<TemplateFamilyDto>> GetTemplateFamiliesAsync()
    {
        var latestTemplates = await _context.Templates
            .Where(t => t.IsLatest)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();

        var families = new List<TemplateFamilyDto>();

        foreach (var template in latestTemplates)
        {
            var familyId = template.ParentId ?? template.Id;
            var versionsCount = await _context.Templates
                .CountAsync(t => t.ParentId == familyId || t.Id == familyId);

            families.Add(new TemplateFamilyDto
            {
                FamilyId = familyId,
                Name = template.Name,
                Description = template.Description,
                TotalVersions = versionsCount,
                LatestVersion = template,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt,
                IsPublished = template.IsPublished,
                PublishedAt = template.PublishedAt
            });
        }

        return families;
    }

    public async Task<Template> CreateTemplateAsync(CreateTemplateDto templateDto)
    {
        // Check for unique name
        var existingTemplate = await _context.Templates
            .FirstOrDefaultAsync(t => t.Name == templateDto.Name);

        if (existingTemplate != null)
        {
            // Generate unique name with timestamp
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
            templateDto.Name = $"{templateDto.Name} {timestamp}";
        }

        var template = new Template
        {
            Name = templateDto.Name,
            Description = templateDto.Description,
            Components = JsonSerializer.Serialize(templateDto.Components ?? new object[0]),
            Variables = JsonSerializer.Serialize(templateDto.Variables ?? new Dictionary<string, object>()),
            Styles = JsonSerializer.Serialize(templateDto.Styles ?? new Dictionary<string, object>()),
            Version = 1,
            IsLatest = true,
            ParentId = null,
            ChangeDescription = null,
            IsPublished = false,
            PublishedAt = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Templates.Add(template);
        await _context.SaveChangesAsync();

        // Create audit log
        await CreateAuditLogAsync(template.Id, "create", null, template, "Template created");

        return template;
    }

    public async Task<Template?> UpdateTemplateAsync(int id, UpdateTemplateDto templateDto)
    {
        var existing = await _context.Templates.FindAsync(id);
        if (existing == null) return null;

        // Check for unique name if name is being updated
        if (!string.IsNullOrEmpty(templateDto.Name) && templateDto.Name != existing.Name)
        {
            var nameExists = await _context.Templates
                .AnyAsync(t => t.Name == templateDto.Name && t.Id != id);

            if (nameExists)
            {
                throw new InvalidOperationException($"Template with name '{templateDto.Name}' already exists");
            }
        }

        var oldValues = JsonSerializer.Serialize(existing);

        // Update fields
        if (!string.IsNullOrEmpty(templateDto.Name))
            existing.Name = templateDto.Name;

        if (templateDto.Description != null)
            existing.Description = templateDto.Description;

        if (templateDto.Components != null)
            existing.Components = JsonSerializer.Serialize(templateDto.Components);

        if (templateDto.Variables != null)
            existing.Variables = JsonSerializer.Serialize(templateDto.Variables);

        if (templateDto.Styles != null)
            existing.Styles = JsonSerializer.Serialize(templateDto.Styles);

        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Create audit log
        await CreateAuditLogAsync(id, "update", oldValues, existing, "Template updated");

        return existing;
    }

    public async Task<bool> DeleteTemplateAsync(int id)
    {
        var template = await _context.Templates.FindAsync(id);
        if (template == null) return false;

        var familyId = template.ParentId ?? id;

        // Delete all versions of this template family
        var familyTemplates = await _context.Templates
            .Where(t => t.ParentId == familyId || t.Id == familyId)
            .ToListAsync();

        _context.Templates.RemoveRange(familyTemplates);
        await _context.SaveChangesAsync();

        return true;
    }

    // Template versioning operations
    public async Task<Template> CreateTemplateVersionAsync(int templateId, CreateVersionDto versionDto)
    {
        var originalTemplate = await _context.Templates.FindAsync(templateId);
        if (originalTemplate == null)
        {
            throw new ArgumentException($"Template with id {templateId} not found");
        }

        // Get the family ID
        var familyId = originalTemplate.ParentId ?? templateId;

        // Get current versions in this family
        var versions = await _context.Templates
            .Where(t => t.ParentId == familyId || t.Id == familyId)
            .ToListAsync();

        var nextVersion = versions.Max(v => v.Version) + 1;

        // Mark previous latest as not latest
        var latestVersions = versions.Where(v => v.IsLatest).ToList();
        foreach (var version in latestVersions)
        {
            version.IsLatest = false;
        }

        // Create new version
        var newVersion = new Template
        {
            Name = versionDto.Name,
            Description = versionDto.Description,
            Components = JsonSerializer.Serialize(versionDto.Components ?? new object[0]),
            Variables = JsonSerializer.Serialize(versionDto.Variables ?? new Dictionary<string, object>()),
            Styles = JsonSerializer.Serialize(versionDto.Styles ?? new Dictionary<string, object>()),
            Version = nextVersion,
            IsLatest = true,
            ParentId = familyId,
            ChangeDescription = versionDto.ChangeDescription,
            IsPublished = false,
            PublishedAt = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Templates.Add(newVersion);
        await _context.SaveChangesAsync();

        // Create audit log
        await CreateAuditLogAsync(newVersion.Id, "version_created", originalTemplate, newVersion, 
            versionDto.ChangeDescription ?? "New version created");

        return newVersion;
    }

    public async Task<IEnumerable<Template>> GetTemplateVersionsAsync(int templateId)
    {
        var template = await _context.Templates.FindAsync(templateId);
        if (template == null) return new List<Template>();

        var familyId = template.ParentId ?? templateId;

        return await _context.Templates
            .Where(t => t.ParentId == familyId || t.Id == familyId)
            .OrderByDescending(t => t.Version)
            .ToListAsync();
    }

    public async Task<IEnumerable<Template>> GetTemplateHistoryAsync(int templateId)
    {
        return await GetTemplateVersionsAsync(templateId);
    }

    public async Task<Template?> RevertToVersionAsync(int templateId, int targetVersionId)
    {
        var targetVersion = await _context.Templates.FindAsync(targetVersionId);
        if (targetVersion == null) return null;

        var currentTemplate = await _context.Templates.FindAsync(templateId);
        if (currentTemplate == null) return null;

        // Get family ID
        var familyId = currentTemplate.ParentId ?? templateId;

        // Make sure target version belongs to the same family
        var family = await _context.Templates
            .Where(t => t.ParentId == familyId || t.Id == familyId)
            .ToListAsync();

        if (!family.Any(t => t.Id == targetVersionId)) return null;

        // Create new version based on target version
        var revertedVersion = await CreateTemplateVersionAsync(templateId, new CreateVersionDto
        {
            Name = targetVersion.Name,
            Description = targetVersion.Description,
            Components = targetVersion.GetComponents<object[]>(),
            Variables = targetVersion.GetVariables<Dictionary<string, object>>(),
            Styles = targetVersion.GetStyles<Dictionary<string, object>>(),
            ChangeDescription = $"Reverted to version {targetVersion.Version}"
        });

        return revertedVersion;
    }

    public async Task<Template?> GetLatestVersionAsync(int templateId)
    {
        var template = await _context.Templates.FindAsync(templateId);
        if (template == null) return null;

        var familyId = template.ParentId ?? templateId;

        return await _context.Templates
            .Where(t => (t.ParentId == familyId || t.Id == familyId) && t.IsLatest)
            .FirstOrDefaultAsync();
    }

    // Template publish operations
    public async Task<Template?> PublishTemplateAsync(int templateId)
    {
        var template = await _context.Templates.FindAsync(templateId);
        if (template == null) return null;

        var oldValues = JsonSerializer.Serialize(template);

        template.IsPublished = true;
        template.PublishedAt = DateTime.UtcNow;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Create audit log
        await CreateAuditLogAsync(templateId, "publish", oldValues, template, "Template published");

        return template;
    }

    public async Task<Template?> UnpublishTemplateAsync(int templateId)
    {
        var template = await _context.Templates.FindAsync(templateId);
        if (template == null) return null;

        var oldValues = JsonSerializer.Serialize(template);

        template.IsPublished = false;
        template.PublishedAt = null;
        template.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Create audit log
        await CreateAuditLogAsync(templateId, "unpublish", oldValues, template, "Template unpublished");

        return template;
    }

    // Audit log operations
    public async Task<TemplateAuditLog> CreateAuditLogAsync(int templateId, string action, object? oldValues, object? newValues, string? changeDescription)
    {
        var auditLog = new TemplateAuditLog
        {
            TemplateId = templateId,
            Action = action,
            OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
            NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
            ChangeDescription = changeDescription,
            Timestamp = DateTime.UtcNow
        };

        _context.TemplateAuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        return auditLog;
    }

    public async Task<IEnumerable<TemplateAuditLog>> GetTemplateAuditHistoryAsync(int templateId)
    {
        return await _context.TemplateAuditLogs
            .Where(a => a.TemplateId == templateId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();
    }

    // HTML generation
    public async Task<string> GenerateHtmlAsync(int templateId, Dictionary<string, object>? data = null)
    {
        var template = await _context.Templates.FindAsync(templateId);
        if (template == null)
        {
            throw new ArgumentException($"Template with id {templateId} not found");
        }

        // Get template data
        var templateData = data ?? new Dictionary<string, object>();
        var components = template.GetComponents<object[]>() ?? new object[0];
        var styles = template.GetStyles<Dictionary<string, object>>() ?? new Dictionary<string, object>();

        // Generate HTML using template components and provided data
        var html = GenerateTemplateHtml(
            components,
            templateData,
            template.Name,
            styles.GetValueOrDefault("reportBackground", "#ffffff")?.ToString() ?? "#ffffff",
            styles.GetValueOrDefault("reportBackgroundImage", "")?.ToString() ?? ""
        );

        return html;
    }

    private string GenerateTemplateHtml(object[] components, Dictionary<string, object> variables, string templateName, string reportBackground, string reportBackgroundImage)
    {
        var html = $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{templateName}</title>
    <script src=""https://cdn.tailwindcss.com""></script>
    <script src=""https://cdn.jsdelivr.net/npm/chart.js""></script>
    <style>
        * {{
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          box-sizing: border-box;
        }}
        
        @page {{
          size: A4;
          margin: 0.5in;
        }}
        
        body {{ 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 0;
          background-color: #f5f5f5;
        }}
        
        .report-page {{
          width: 794px;
          min-height: 1123px;
          margin: 0 auto 20px auto;
          background-color: {reportBackground};
          {(string.IsNullOrEmpty(reportBackgroundImage) ? "" : $"background-image: url('{reportBackgroundImage}'); background-size: cover; background-repeat: no-repeat; background-position: center;")}
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          position: relative;
          padding: 20px;
        }}
    </style>
</head>
<body>
  <div class=""report-page"">";

        // Render components
        foreach (var component in components)
        {
            var componentDict = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(component));
            if (componentDict == null) continue;

            var type = componentDict.GetValueOrDefault("type", "")?.ToString() ?? "";
            var position = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(componentDict.GetValueOrDefault("position", new { x = 0, y = 0 })));
            var style = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(componentDict.GetValueOrDefault("style", new { })));
            var content = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(componentDict.GetValueOrDefault("content", new { })));

            if (position == null || style == null || content == null) continue;

            var x = GetDoubleValue(position.GetValueOrDefault("x", 0)) * 0.69;
            var y = GetDoubleValue(position.GetValueOrDefault("y", 0)) * 0.69;
            var width = style.GetValueOrDefault("width", "auto")?.ToString() ?? "auto";
            var height = style.GetValueOrDefault("height", "auto")?.ToString() ?? "auto";

            var positionStyle = $"position: absolute; left: {x}px; top: {y}px; width: {width}; height: {height};";

            switch (type)
            {
                case "header":
                    var headerTitle = ReplaceVariables(content.GetValueOrDefault("title", "Header")?.ToString() ?? "Header", variables);
                    var headerSubtitle = content.ContainsKey("subtitle") ? ReplaceVariables(content["subtitle"]?.ToString() ?? "", variables) : "";
                    var backgroundColor = style.GetValueOrDefault("backgroundColor", "#DBEAFE")?.ToString() ?? "#DBEAFE";
                    var textColor = style.GetValueOrDefault("textColor", "#1F2937")?.ToString() ?? "#1F2937";
                    
                    html += $@"<div style=""{positionStyle} background-color: {backgroundColor}; color: {textColor}; padding: 24px; border-radius: 8px;"">
                      <h1 style=""font-size: 24px; font-weight: bold; margin-bottom: 8px;"">{headerTitle}</h1>
                      {(string.IsNullOrEmpty(headerSubtitle) ? "" : $"<p style=\"font-size: 16px; opacity: 0.8;\">{headerSubtitle}</p>")}
                    </div>";
                    break;

                case "text-block":
                    var textContent = ReplaceVariables(content.GetValueOrDefault("text", "Text content")?.ToString() ?? "Text content", variables);
                    var textBgColor = style.GetValueOrDefault("backgroundColor", "#FFFFFF")?.ToString() ?? "#FFFFFF";
                    var textTextColor = style.GetValueOrDefault("textColor", "#1F2937")?.ToString() ?? "#1F2937";
                    
                    html += $@"<div style=""{positionStyle} background-color: {textBgColor}; color: {textTextColor}; padding: 16px; border-radius: 4px;"">
                      <p style=""margin: 0;"">{textContent}</p>
                    </div>";
                    break;

                case "student-info":
                    var infoBgColor = style.GetValueOrDefault("backgroundColor", "#F0FDF4")?.ToString() ?? "#F0FDF4";
                    var infoTextColor = style.GetValueOrDefault("textColor", "#1F2937")?.ToString() ?? "#1F2937";
                    var studentInfoHtml = $@"<div style=""{positionStyle} background-color: {infoBgColor}; color: {infoTextColor}; padding: 16px; border-radius: 8px;"">
                      <h3 style=""font-size: 18px; font-weight: 600; margin-bottom: 12px;"">Student Information</h3>";

                    if (content.ContainsKey("fields"))
                    {
                        var fields = JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(content["fields"]));
                        if (fields != null)
                        {
                            foreach (var field in fields)
                            {
                                var processedValue = ReplaceVariables(field.Value?.ToString() ?? "", variables);
                                studentInfoHtml += $@"<div style=""margin-bottom: 8px;""><strong>{field.Key}:</strong> {processedValue}</div>";
                            }
                        }
                    }

                    studentInfoHtml += "</div>";
                    html += studentInfoHtml;
                    break;

                case "bar-chart":
                    var chartTitle = ReplaceVariables(content.GetValueOrDefault("title", "Chart Title")?.ToString() ?? "Chart Title", variables);
                    var chartBgColor = style.GetValueOrDefault("backgroundColor", "#ffffff")?.ToString() ?? "#ffffff";
                    
                    html += $@"<div style=""{positionStyle} background-color: {chartBgColor}; padding: 24px; border-radius: 8px;"">
                      <h3 style=""font-size: 18px; font-weight: 600; margin-bottom: 16px;"">{chartTitle}</h3>
                      <div style=""background-color: #f3f4f6; height: 200px; border-radius: 4px; display: flex; align-items: center; justify-content: center;"">
                        <p style=""color: #6b7280;"">Chart rendering placeholder</p>
                      </div>
                    </div>";
                    break;

                case "page-break":
                    var pageBreakLabel = ReplaceVariables(content.GetValueOrDefault("label", "Page Break")?.ToString() ?? "Page Break", variables);
                    html += $@"<div style=""{positionStyle} page-break-before: always; height: 12px; background-color: #EF4444; border: 2px dashed #EF4444; margin: 8px 0; display: flex; align-items: center; justify-content: center; position: relative; opacity: 0.8;"">
                      <span style=""background-color: white; padding: 4px 8px; font-size: 10px; color: #EF4444; font-weight: bold; position: absolute; border-radius: 4px;"">
                        {pageBreakLabel}
                      </span>
                    </div>";
                    break;

                default:
                    html += $@"<div style=""{positionStyle} padding: 16px; border: 2px dashed #d1d5db; border-radius: 8px;"">
                      <p style=""color: #9ca3af;"">Component: {type}</p>
                    </div>";
                    break;
            }
        }

        html += @"
  </div>
</body>
</html>";

        return html;
    }

    private string ReplaceVariables(string text, Dictionary<string, object> variables)
    {
        if (string.IsNullOrEmpty(text)) return text;

        foreach (var variable in variables)
        {
            var placeholder = $"{{{{{variable.Key}}}}}";
            if (text.Contains(placeholder))
            {
                text = text.Replace(placeholder, variable.Value?.ToString() ?? "");
            }
        }

        return text;
    }

    private double GetDoubleValue(object? value)
    {
        if (value is JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.Number => element.GetDouble(),
                JsonValueKind.String when double.TryParse(element.GetString(), out var d) => d,
                _ => 0.0
            };
        }
        
        return value switch
        {
            double d => d,
            int i => i,
            float f => f,
            string s when double.TryParse(s, out var d) => d,
            _ => 0.0
        };
    }
}