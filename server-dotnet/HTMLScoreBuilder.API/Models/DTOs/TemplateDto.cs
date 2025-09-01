using System.ComponentModel.DataAnnotations;

namespace HTMLScoreBuilder.API.Models.DTOs;

public class CreateTemplateDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public object[]? Components { get; set; }
    
    public Dictionary<string, object>? Variables { get; set; }
    
    public Dictionary<string, object>? Styles { get; set; }
}

public class UpdateTemplateDto
{
    public string? Name { get; set; }
    
    public string? Description { get; set; }
    
    public object[]? Components { get; set; }
    
    public Dictionary<string, object>? Variables { get; set; }
    
    public Dictionary<string, object>? Styles { get; set; }
}

public class CreateVersionDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public object[]? Components { get; set; }
    
    public Dictionary<string, object>? Variables { get; set; }
    
    public Dictionary<string, object>? Styles { get; set; }
    
    public string? ChangeDescription { get; set; }
}

public class GenerateHtmlRequest
{
    public Dictionary<string, object>? Data { get; set; }
}

public class GeneratePdfRequest
{
    public Dictionary<string, object>? Data { get; set; }
}

public class GenerateImageRequest
{
    public Dictionary<string, object>? Data { get; set; }
}

public class ExportHtmlRequest
{
    public int TemplateId { get; set; }
    public Dictionary<string, object>? Data { get; set; }
}

public class TemplateFamilyDto
{
    public int FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TotalVersions { get; set; }
    public Template? LatestVersion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
}