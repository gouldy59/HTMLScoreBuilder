using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace HTMLScoreBuilder.API.Models;

[Table("templates")]
public class Template
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("components", TypeName = "jsonb")]
    public string Components { get; set; } = "[]";

    [Required]
    [Column("variables", TypeName = "jsonb")]
    public string Variables { get; set; } = "{}";

    [Required]
    [Column("styles", TypeName = "jsonb")]
    public string Styles { get; set; } = "{}";

    [Required]
    [Column("version")]
    public int Version { get; set; } = 1;

    [Required]
    [Column("is_latest")]
    public bool IsLatest { get; set; } = true;

    [Column("parent_id")]
    public int? ParentId { get; set; }

    [Column("change_description")]
    public string? ChangeDescription { get; set; }

    [Required]
    [Column("is_published")]
    public bool IsPublished { get; set; } = false;

    [Column("published_at")]
    public DateTime? PublishedAt { get; set; }

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties for related templates
    [ForeignKey("ParentId")]
    public Template? Parent { get; set; }

    public ICollection<Template> Versions { get; set; } = new List<Template>();

    // Helper methods for JSON serialization
    public T? GetComponents<T>() where T : class
    {
        try
        {
            return JsonSerializer.Deserialize<T>(Components);
        }
        catch
        {
            return null;
        }
    }

    public void SetComponents<T>(T components) where T : class
    {
        Components = JsonSerializer.Serialize(components);
    }

    public T? GetVariables<T>() where T : class
    {
        try
        {
            return JsonSerializer.Deserialize<T>(Variables);
        }
        catch
        {
            return null;
        }
    }

    public void SetVariables<T>(T variables) where T : class
    {
        Variables = JsonSerializer.Serialize(variables);
    }

    public T? GetStyles<T>() where T : class
    {
        try
        {
            return JsonSerializer.Deserialize<T>(Styles);
        }
        catch
        {
            return null;
        }
    }

    public void SetStyles<T>(T styles) where T : class
    {
        Styles = JsonSerializer.Serialize(styles);
    }
}