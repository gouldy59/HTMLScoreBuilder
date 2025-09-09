using Microsoft.AspNetCore.Mvc;
using HTMLScoreBuilder.API.Services;
using HTMLScoreBuilder.API.Models;
using HTMLScoreBuilder.API.Models.DTOs;
using System.Text.Json;

namespace HTMLScoreBuilder.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly ILogger<TemplatesController> _logger;

    public TemplatesController(
        ITemplateService templateService,
        IPdfGenerationService pdfGenerationService,
        ILogger<TemplatesController> logger)
    {
        _templateService = templateService;
        _pdfGenerationService = pdfGenerationService;
        _logger = logger;
    }

    // Template CRUD endpoints
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Template>>> GetTemplates()
    {
        try
        {
            var templates = await _templateService.GetAllTemplatesAsync();
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching templates");
            return StatusCode(500, new { message = "Failed to fetch templates", error = ex.Message });
        }
    }

    [HttpGet("families")]
    public async Task<ActionResult<IEnumerable<TemplateFamilyDto>>> GetTemplateFamilies()
    {
        try
        {
            var families = await _templateService.GetTemplateFamiliesAsync();
            return Ok(families);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching template families");
            return StatusCode(500, new { message = "Failed to fetch template families" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Template>> GetTemplate(int id)
    {
        try
        {
            var template = await _templateService.GetTemplateAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to fetch template" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Template>> CreateTemplate([FromBody] CreateTemplateDto templateDto)
    {
        try
        {
            var template = await _templateService.CreateTemplateAsync(templateDto);
            return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, template);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template");
            return StatusCode(500, new { message = "Failed to create template", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Template>> UpdateTemplate(int id, [FromBody] UpdateTemplateDto templateDto)
    {
        try
        {
            var template = await _templateService.UpdateTemplateAsync(id, templateDto);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            return Ok(template);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to update template" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTemplate(int id)
    {
        try
        {
            var success = await _templateService.DeleteTemplateAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Template not found" });
            }

            return Ok(new { message = "Template deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to delete template" });
        }
    }

    // Template versioning endpoints
    [HttpPost("{id}/versions")]
    public async Task<ActionResult<Template>> CreateTemplateVersion(int id, [FromBody] CreateVersionDto versionDto)
    {
        try
        {
            var newVersion = await _templateService.CreateTemplateVersionAsync(id, versionDto);
            return CreatedAtAction(nameof(GetTemplate), new { id = newVersion.Id }, newVersion);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating template version for {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to create template version" });
        }
    }

    [HttpGet("{id}/versions")]
    public async Task<ActionResult<IEnumerable<Template>>> GetTemplateVersions(int id)
    {
        try
        {
            var versions = await _templateService.GetTemplateVersionsAsync(id);
            return Ok(versions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching template versions for {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to fetch template versions" });
        }
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<IEnumerable<Template>>> GetTemplateHistory(int id)
    {
        try
        {
            var history = await _templateService.GetTemplateHistoryAsync(id);
            return Ok(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching template history for {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to fetch template history" });
        }
    }

    [HttpPost("{id}/revert/{versionId}")]
    public async Task<ActionResult<Template>> RevertToVersion(int id, int versionId)
    {
        try
        {
            var revertedTemplate = await _templateService.RevertToVersionAsync(id, versionId);
            if (revertedTemplate == null)
            {
                return NotFound(new { message = "Template or version not found" });
            }

            return Ok(revertedTemplate);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reverting template {TemplateId} to version {VersionId}", id, versionId);
            return StatusCode(500, new { message = "Failed to revert template" });
        }
    }

    [HttpGet("{id}/latest")]
    public async Task<ActionResult<Template>> GetLatestVersion(int id)
    {
        try
        {
            var latestVersion = await _templateService.GetLatestVersionAsync(id);
            if (latestVersion == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            return Ok(latestVersion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching latest version for {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to fetch latest version" });
        }
    }

    // Template publish operations
    [HttpPost("{id}/publish")]
    public async Task<ActionResult<Template>> PublishTemplate(int id)
    {
        try
        {
            var template = await _templateService.PublishTemplateAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to publish template" });
        }
    }

    [HttpPost("{id}/unpublish")]
    public async Task<ActionResult<Template>> UnpublishTemplate(int id)
    {
        try
        {
            var template = await _templateService.UnpublishTemplateAsync(id);
            if (template == null)
            {
                return NotFound(new { message = "Template not found" });
            }

            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unpublishing template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to unpublish template" });
        }
    }

    // Template audit history
    [HttpGet("{id}/audit")]
    public async Task<ActionResult<IEnumerable<TemplateAuditLog>>> GetTemplateAuditHistory(int id)
    {
        try
        {
            var auditHistory = await _templateService.GetTemplateAuditHistoryAsync(id);
            return Ok(auditHistory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching audit history for {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to fetch audit history" });
        }
    }

    // HTML generation endpoint
    [HttpPost("{id}/generate")]
    public async Task<ActionResult> GenerateHtml(int id, [FromBody] GenerateHtmlRequest? request = null, string exportType = "html")
    {
        try
        {
            var html = await _templateService.GenerateHtmlAsync(id, request?.Data);
            return Content(html, "text/html");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating HTML for template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to generate HTML" });
        }
    }

    // Template-specific PDF generation endpoint
    [HttpPost("{id}/generate-pdf")]
    public async Task<ActionResult> GeneratePdf(int id, [FromBody] GeneratePdfRequest? request = null)
    {
        try
        {
            var html = await _templateService.GenerateHtmlAsync(id, request?.Data, "pdf");
            var pdfBytes = await _pdfGenerationService.GeneratePdfAsync(html);

            return File(pdfBytes, "application/pdf", $"template_{id}.pdf");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF for template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to generate PDF" });
        }
    }

    // Template-specific image generation endpoint
    [HttpPost("{id}/generate-image")]
    public async Task<ActionResult> GenerateImage(int id, [FromBody] GenerateImageRequest? request = null, string exportType = "html")
    {
        try
        {
            var html = await _templateService.GenerateHtmlAsync(id, request?.Data);
            var imageBytes = await _pdfGenerationService.GenerateImageAsync(html);

            return File(imageBytes, "image/png", $"template_{id}.png");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating image for template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to generate image" });
        }
    }

    // Template-specific HTML export endpoint
    [HttpPost("{id}/export-html")]
    public async Task<ActionResult> ExportHtml(int id, [FromBody] GenerateHtmlRequest? request = null)
    {
        try
        {
            var exportType = request?.ExportType ?? "html"; // default to HTML
            var html = await _templateService.GenerateHtmlAsync(id, request?.Data, exportType);

            var fileName = $"template_{id}.html";
            var bytes = System.Text.Encoding.UTF8.GetBytes(html);

            return File(bytes, "text/html", fileName);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting HTML for template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to export HTML" });
        }
    }

    [HttpGet("{id}/{keycode}/export-result")]
    public async Task<ActionResult> GetProbuilderResult(int id, string keycode, [FromBody] GenerateHtmlRequest? request = null)
    {
        try
        {
            var fileName = $"{keycode}.json";
            var resultJson = System.IO.File.ReadAllText(fileName);
            var bytes = System.Text.Encoding.UTF8.GetBytes(resultJson);

            return File(bytes, "text/html", fileName);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting HTML for template {TemplateId}", id);
            return StatusCode(500, new { message = "Failed to export HTML" });
        }
    }
}