using Microsoft.AspNetCore.Mvc;
using HTMLScoreBuilder.API.Services;
using HTMLScoreBuilder.API.Models.DTOs;

namespace HTMLScoreBuilder.API.Controllers;

[ApiController]
[Route("api")]
public class LegacyController : ControllerBase
{
    private readonly ITemplateService _templateService;
    private readonly IPdfGenerationService _pdfGenerationService;
    private readonly ILogger<LegacyController> _logger;

    public LegacyController(
        ITemplateService templateService,
        IPdfGenerationService pdfGenerationService,
        ILogger<LegacyController> logger)
    {
        _templateService = templateService;
        _pdfGenerationService = pdfGenerationService;
        _logger = logger;
    }

    // Legacy export HTML endpoint
    [HttpPost("export-html")]
    public async Task<ActionResult> ExportHtml([FromBody] ExportHtmlRequest request)
    {
        try
        {
            var html = await _templateService.GenerateHtmlAsync(request.TemplateId, request.Data);

            var fileName = $"template_{request.TemplateId}.html";
            var bytes = System.Text.Encoding.UTF8.GetBytes(html);

            return File(bytes, "text/html", fileName);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting HTML for template {TemplateId}", request.TemplateId);
            return StatusCode(500, new { message = "Failed to export HTML" });
        }
    }

    // Legacy PDF generation endpoint
    [HttpPost("generate-pdf")]
    public async Task<ActionResult> GeneratePdf([FromBody] ExportHtmlRequest request)
    {
        try
        {
            var html = await _templateService.GenerateHtmlAsync(request.TemplateId, request.Data);
            var pdfBytes = await _pdfGenerationService.GeneratePdfAsync(html);

            return File(pdfBytes, "application/pdf", $"template_{request.TemplateId}.pdf");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF for template {TemplateId}", request.TemplateId);
            return StatusCode(500, new { message = "Failed to generate PDF" });
        }
    }

    // Legacy image generation endpoint
    [HttpPost("generate-image")]
    public async Task<ActionResult> GenerateImage([FromBody] ExportHtmlRequest request)
    {
        try
        {
            var html = await _templateService.GenerateHtmlAsync(request.TemplateId, request.Data);
            var imageBytes = await _pdfGenerationService.GenerateImageAsync(html);

            return File(imageBytes, "image/png", $"template_{request.TemplateId}.png");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating image for template {TemplateId}", request.TemplateId);
            return StatusCode(500, new { message = "Failed to generate image" });
        }
    }
}