using System.Text.Json;
using HTMLScoreBuilder.API.Data;
using HTMLScoreBuilder.API.Models;
using HTMLScoreBuilder.API.Models.DTOs;
using Microsoft.EntityFrameworkCore;

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
    public async Task<string> GenerateHtmlAsync(int templateId, Dictionary<string, object>? data = null, string exportType = "html")
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
            styles.GetValueOrDefault("reportBackgroundImage", "")?.ToString() ?? "",
            exportType
        );

        return html;
    }

    private string GenerateTemplateHtml(object[] components, Dictionary<string, object> variables, string templateName, string reportBackground, string reportBackgroundImage, string exportType)
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
  {(exportType == "html" ? "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" : "")}
  position: relative;
  padding: 20px;
}}

.page-break-indicator {{width: 100%;
    height: 20px;
    margin: 20px 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
}}

    </style>
</head>
<body>
  <div class=""report-page"">";

        //double pageYOffset = 0;
        double currentPageStartY = 0;
        var firstPage = true;
        // Render components
        // Deserialize all components into dictionaries
        var componentDicts = components
            .Select(c => JsonSerializer.Deserialize<Dictionary<string, object>>(JsonSerializer.Serialize(c)))
            .Where(c => c != null)
            .ToList();

        // Sort by Y position
        componentDicts.Sort((a, b) =>
        {
            var posA = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(a.GetValueOrDefault("position", new { y = 0 })));
            var posB = JsonSerializer.Deserialize<Dictionary<string, object>>(
                JsonSerializer.Serialize(b.GetValueOrDefault("position", new { y = 0 })));

            double yA = GetDoubleValue(posA.GetValueOrDefault("y", 0));
            double yB = GetDoubleValue(posB.GetValueOrDefault("y", 0));
            return yA.CompareTo(yB);
        });

        foreach (var component in componentDicts)
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

            var x = GetDoubleValue(position.GetValueOrDefault("x", 0));
            var y = GetDoubleValue(position.GetValueOrDefault("y", 0));
            var width = style.GetValueOrDefault("width", "auto")?.ToString() ?? "auto";
            var height = style.GetValueOrDefault("height", "auto")?.ToString() ?? "auto";
            double pagePadding = 20; // match .report-page padding
            double effectiveX = x + pagePadding;
            double effectiveY = y + pagePadding;
            if (!firstPage)
            {
                effectiveY = (y - currentPageStartY) + pagePadding;
            }

            var zIndex = style.GetValueOrDefault("zIndex", "0")?.ToString() ?? "0";

            var positionStyle =
                $"position:absolute; left:{effectiveX}px; top:{effectiveY}px; " +
                $"width:{width}; height:{height}; z-index:{zIndex}; overflow:visible;";

            switch (type)
            {
                case "header":
                    var headerTitle = ReplaceVariables(content.GetValueOrDefault("title", "Header")?.ToString() ?? "Header", variables);
                    var headerSubtitle = content.ContainsKey("subtitle") ? ReplaceVariables(content["subtitle"]?.ToString() ?? "", variables) : "";
                    var backgroundColor = style.GetValueOrDefault("backgroundColor", "#DBEAFE")?.ToString() ?? "#DBEAFE";
                    var textColor = style.GetValueOrDefault("textColor", "#1F2937")?.ToString() ?? "#1F2937";

                    var headerPositionStyle = $"position: absolute; left: {effectiveX}px; top: {effectiveY}px; width: {width};";
                    html += $@"<div style=""{headerPositionStyle} background-color: {backgroundColor}; color: {textColor}; padding: 24px; border-radius: 8px;"">
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
                    var chartSubtitle = ReplaceVariables(content.GetValueOrDefault("subtitle", "description")?.ToString() ?? "description", variables);
                    var chartBgColor = style.GetValueOrDefault("backgroundColor", "#ffffff")?.ToString() ?? "#ffffff";

                    var chartDataRaw = JsonSerializer.Deserialize<List<JsonElement>>(JsonSerializer.Serialize(content["chartData"]));

                    // Compute dynamic label width
                    int longestLabel = chartDataRaw.Max(item =>
                    {
                        var label = item.TryGetProperty("label", out var lbl) ? lbl.GetString() ?? "" : "";
                        return label.Length * 7;
                    });
                    int labelWidth = Math.Min(200, Math.Max(80, longestLabel));

                    var chartHtml = $@"
    <div style=""{positionStyle} background-color:{chartBgColor}; padding:24px; border-radius:8px; overflow:visible;"">
        <h3 style=""font-size:18px; font-weight:600; margin-bottom:4px;"">{chartTitle}</h3>
        {(string.IsNullOrEmpty(chartSubtitle) ? "" : $"<p style='font-size:14px; color:#6b7280; margin-bottom:16px;'>{chartSubtitle}</p>")}
";


                    if (chartDataRaw == null || chartDataRaw.Count == 0)
                    {
                        chartHtml += @"
                            <div style=""background-color:#f3f4f6; height:200px; border-radius:4px; display:flex; align-items:center; justify-content:center;"">
                            <p style=""color:#6b7280;"">No chart data available</p>
                            </div>";
                    }
                    else
                    {
                        foreach (var item in chartDataRaw)
                        {
                            var label = ReplaceVariables(item.GetProperty("label").GetString() ?? "Category A", variables);
                            var scoreValue = ReplaceVariables(item.GetProperty("scoreValue").GetString() ?? "0", variables);
                            var rawScore = int.TryParse(scoreValue, out var score) ? score : 0;

                            var segments = item.GetProperty("segments").EnumerateArray();

                            // Label + Bar container
                            chartHtml += $@"
                                <div style=""display:flex; align-items:center; margin-bottom:8px;"">
                                <div style=""width:{labelWidth}px; font-size:12px; font-weight:500; margin-right:8px;"">{label}</div>
                                <div style=""flex:1; position:relative; height:20px; background:#f3f4f6; border-radius:4px; overflow:visible; display:flex;"">
                                ";

                            // Segments
                            foreach (var seg in segments)
                            {
                                var segValue = seg.GetProperty("value").GetInt32();
                                var segColor = seg.GetProperty("color").GetString() ?? "#E5E7EB";
                                var segLabel = seg.GetProperty("label").GetString() ?? "";

                                chartHtml += $@"<div title=""{segLabel}: {segValue}%"" 
                                  style=""width:{segValue}%; background-color:{segColor}; border-left:1px solid #fff;""></div>";
                            }

                            var clampedScore = Math.Max(0, Math.Min(100, rawScore));
                            chartHtml += $@"
                                <div style=""position:absolute; top:50%; left:calc({clampedScore}% - 6px); 
                                transform:translateY(-50%); width:12px; height:12px;
                                background-color:#dc2626; border:2px solid #fff; border-radius:50%; 
                                box-shadow:0 0 2px rgba(0,0,0,0.2);""
                                title=""Score: {clampedScore}%""></div>
                                <div style=""position:absolute; right:-48px; top:50%; transform:translateY(-50%);
                                    font-size:12px; font-weight:bold; color:#dc2626;
                                    background-color:#ffffff; padding:2px 4px; border:1px solid #d1d5db;
                                    border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);"">
                                    {clampedScore}%
                                </div>";

                            chartHtml += "</div></div>";
                        }

                        // Legend
                        chartHtml += $@"
                            <div style=""display:flex; gap:12px; justify-content:center; margin-top:12px; margin-left: {labelWidth + 12}px; font-size:12px; color:#6b7280;"">
                                <div style=""display:flex; align-items:center; gap:4px;"">
                                    <div style=""width:12px; height:12px; background-color:#FDE2E7; border-radius:2px;""></div>0%-25%
                                </div>
                            <div style=""display:flex; align-items:center; gap:4px;"">
                                <div style=""width:12px; height:12px; background-color:#FB923C; border-radius:2px;""></div>26%-50%
                            </div>
                            <div style=""display:flex; align-items:center; gap:4px;"">
                                <div style=""width:12px; height:12px; background-color:#86EFAC; border-radius:2px;""></div>51%-75%
                            </div>
                            <div style=""display:flex; align-items:center; gap:4px;"">
                                <div style=""width:12px; height:12px; background-color:#D1FAE5; border-radius:2px;""></div>76%-100%
                            </div>
                        </div>";
                    }

                    chartHtml += "</div>";
                    html += chartHtml;
                    break;
                case "page-break":
                    currentPageStartY = y; // ensure next components start at "0" for new page
                    firstPage = false;

                    var boxShadowCss = exportType == "html" ? "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" : "";

                    html += $@"</div>
<div class=""report-page"" style=""{boxShadowCss}"">";
                    break;
                case "image":
                    var imageSrc = content.GetValueOrDefault("src", "")?.ToString() ?? "";
                    var imageAlt = content.GetValueOrDefault("alt", "")?.ToString() ?? "Report image";
                    var imageCaption = content.GetValueOrDefault("caption", "")?.ToString() ?? "";
                    var borderRadius = style.GetValueOrDefault("borderRadius", "8px")?.ToString() ?? "8px";
                    var imgBackgroundColor = style.GetValueOrDefault("backgroundColor", "transparent")?.ToString() ?? "transparent";

                    html += $@"
    <div style=""{positionStyle} text-align: center; background-color: {imgBackgroundColor}; border-radius: {borderRadius}; padding: 8px;"">
        <img src=""{imageSrc}"" alt=""{imageAlt}"" style=""width: 100%; height: 100%; object-fit: cover; border-radius: {borderRadius}; display: block;"" />
        {(string.IsNullOrEmpty(imageCaption) ? "" : $"<p style=\"margin-top: 8px; font-size: 14px; color: #6B7280; font-style: italic;\">{imageCaption}</p>")}
    </div>";
                    break;
                case "score-table":
                    {
                        var tableTitle = ReplaceVariables(content.GetValueOrDefault("title", "Subject Scores")?.ToString() ?? "Subject Scores", variables);
                        var tableBgColor = style.GetValueOrDefault("backgroundColor", "#FFF7ED")?.ToString() ?? "#FFF7ED";

                        // Headers
                        List<string> headers;
                        try
                        {
                            if (content.TryGetValue("headers", out var headersObj) && headersObj != null)
                            {
                                headers = JsonSerializer.Deserialize<List<string>>(JsonSerializer.Serialize(headersObj)) ?? new List<string>();
                            }
                            else
                            {
                                headers = new List<string>();
                            }
                        }
                        catch
                        {
                            headers = new List<string>();
                        }

                        if (headers.Count == 0)
                        {
                            headers = new List<string> { "Subject", "Score", "Grade" };
                        }

                        headers = headers.Select(h => ReplaceVariables(h ?? string.Empty, variables)).ToList();

                        // Rows
                        List<JsonElement> rows;
                        try
                        {
                            if (content.TryGetValue("rows", out var rowsObj) && rowsObj != null)
                            {
                                rows = JsonSerializer.Deserialize<List<JsonElement>>(JsonSerializer.Serialize(rowsObj)) ?? new List<JsonElement>();
                            }
                            else
                            {
                                rows = new List<JsonElement>();
                            }
                        }
                        catch
                        {
                            rows = new List<JsonElement>();
                        }

                        html += $@"
                            <div style=""{positionStyle} background-color: {tableBgColor}; padding: 24px; border-radius: 12px;"">
                                <h3 style=""font-size: 18px; font-weight: 600; margin-bottom: 16px;"">{tableTitle}</h3>
                            <div style=""overflow-x: auto;"">
                                <table style=""width: 100%; border-collapse: collapse; border: 1px solid #D1D5DB; background-color: #ffffff; border-radius: 8px; overflow: hidden;"">
                                <thead>
                                    <tr style=""background-color: #F9FAFB;"">";

                                    foreach (var header in headers)
                                    {
                                        html += $@"<th style=""border: 1px solid #D1D5DB; padding: 8px 16px; text-align: left; font-weight: 500;"">{header}</th>";
                                    }

                                    html += @"</tr>
                                </thead>
                                <tbody>";

                                    if (rows.Count > 0)
                                    {
                                        foreach (var rowEl in rows)
                                        {
                                            html += "<tr>";

                                            if (rowEl.ValueKind == JsonValueKind.Object)
                                            {
                                                // Track which property names we've output (case-insensitive)
                                                var usedProps = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                                                // 1) Emit cells in header order
                                                foreach (var header in headers)
                                                {
                                                    JsonElement cellVal = default;
                                                    bool found = false;
                                                    string matchedPropName = null;

                                                    // Try exact property name
                                                    if (rowEl.TryGetProperty(header, out cellVal))
                                                    {
                                                        found = true;
                                                        matchedPropName = header;
                                                    }
                                                    else
                                                    {
                                                        // Try case-insensitive match
                                                        foreach (var prop in rowEl.EnumerateObject())
                                                        {
                                                            if (string.Equals(prop.Name, header, StringComparison.OrdinalIgnoreCase))
                                                            {
                                                                cellVal = prop.Value;
                                                                found = true;
                                                                matchedPropName = prop.Name;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    if (!found)
                                                    {
                                                        // Try normalized match: remove non-alphanumeric and compare lowercase
                                                        var normHeader = new string(header.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
                                                        foreach (var prop in rowEl.EnumerateObject())
                                                        {
                                                            var normProp = new string(prop.Name.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
                                                            if (!string.IsNullOrEmpty(normHeader) && normProp == normHeader)
                                                            {
                                                                cellVal = prop.Value;
                                                                found = true;
                                                                matchedPropName = prop.Name;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    // Prepare cell text
                                                    string cellText = "";
                                                    if (found)
                                                    {
                                                        usedProps.Add(matchedPropName ?? header);

                                                        if (cellVal.ValueKind == JsonValueKind.String)
                                                            cellText = ReplaceVariables(cellVal.GetString() ?? string.Empty, variables);
                                                        else
                                                            cellText = cellVal.ToString();
                                                    }
                                                    else
                                                    {
                                                        // No matching property for this header -> empty cell
                                                        cellText = "";
                                                    }

                                                    html += $@"<td style=""border: 1px solid #D1D5DB; padding: 8px 16px;"">{cellText}</td>";
                                                }

                                                // 2) Append any remaining properties not matched to headers (to avoid losing data)
                                                foreach (var prop in rowEl.EnumerateObject())
                                                {
                                                    if (!usedProps.Contains(prop.Name))
                                                    {
                                                        string cellText = prop.Value.ValueKind == JsonValueKind.String
                                                            ? ReplaceVariables(prop.Value.GetString() ?? string.Empty, variables)
                                                            : prop.Value.ToString();

                                                        html += $@"<td style=""border: 1px solid #D1D5DB; padding: 8px 16px;"">{cellText}</td>";
                                                    }
                                                }
                                            }
                                            else if (rowEl.ValueKind == JsonValueKind.Array)
                                            {
                                                // If row is an array, emit array values in order
                                                foreach (var cell in rowEl.EnumerateArray())
                                                {
                                                    string cellText = cell.ValueKind == JsonValueKind.String
                                                        ? ReplaceVariables(cell.GetString() ?? string.Empty, variables)
                                                        : cell.ToString();

                                                    html += $@"<td style=""border: 1px solid #D1D5DB; padding: 8px 16px;"">{cellText}</td>";
                                                }
                                            }
                                            else
                                            {
                                                // Fallback: single-cell row
                                                string cellText = ReplaceVariables(rowEl.ToString() ?? string.Empty, variables);
                                                html += $@"<td style=""border: 1px solid #D1D5DB; padding: 8px 16px;"">{cellText}</td>";
                                            }

                                            html += "</tr>";
                                        }
                                    }
                                    else
                                    {
                                        var colSpan = Math.Max(headers.Count, 1);
                                        html += $@"<tr>
                                            <td colspan=""{colSpan}"" style=""border: 1px solid #D1D5DB; padding: 8px 16px; text-align: center; color: #6B7280;"">
                                                No data available
                                            </td>
                                        </tr>";
                                    }

                                    html += @"  </tbody>
                                </table>
                            </div>
                        </div>";
                        break;
                    }
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