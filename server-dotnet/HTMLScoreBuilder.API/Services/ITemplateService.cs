using HTMLScoreBuilder.API.Models;
using HTMLScoreBuilder.API.Models.DTOs;

namespace HTMLScoreBuilder.API.Services;

public interface ITemplateService
{
    // User operations
    Task<User?> GetUserAsync(int id);
    Task<User?> GetUserByUsernameAsync(string username);
    Task<User> CreateUserAsync(string username, string password);

    // Template CRUD operations
    Task<Template?> GetTemplateAsync(int id);
    Task<IEnumerable<Template>> GetAllTemplatesAsync();
    Task<IEnumerable<TemplateFamilyDto>> GetTemplateFamiliesAsync();
    Task<Template> CreateTemplateAsync(CreateTemplateDto templateDto);
    Task<Template?> UpdateTemplateAsync(int id, UpdateTemplateDto templateDto);
    Task<bool> DeleteTemplateAsync(int id);

    // Template versioning operations
    Task<Template> CreateTemplateVersionAsync(int templateId, CreateVersionDto versionDto);
    Task<IEnumerable<Template>> GetTemplateVersionsAsync(int templateId);
    Task<IEnumerable<Template>> GetTemplateHistoryAsync(int templateId);
    Task<Template?> RevertToVersionAsync(int templateId, int targetVersionId);
    Task<Template?> GetLatestVersionAsync(int templateId);

    // Template publish operations
    Task<Template?> PublishTemplateAsync(int templateId);
    Task<Template?> UnpublishTemplateAsync(int templateId);

    // Audit log operations
    Task<TemplateAuditLog> CreateAuditLogAsync(int templateId, string action, object? oldValues, object? newValues, string? changeDescription);
    Task<IEnumerable<TemplateAuditLog>> GetTemplateAuditHistoryAsync(int templateId);

    // HTML/PDF generation operations
    Task<string> GenerateHtmlAsync(int templateId, Dictionary<string, object>? data = null, string exportType = "html");
}