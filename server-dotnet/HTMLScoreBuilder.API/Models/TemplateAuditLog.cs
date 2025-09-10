using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HTMLScoreBuilder.API.Models;

[Table("template_audit_log")]
public class TemplateAuditLog
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("template_id")]
    public int TemplateId { get; set; }

    [Required]
    [Column("action")]
    public string Action { get; set; } = string.Empty; // 'create', 'update', 'publish', 'unpublish', 'version_created'

    [Column("old_values", TypeName = "jsonb")]
    public string? OldValues { get; set; }

    [Column("new_values", TypeName = "jsonb")]
    public string? NewValues { get; set; }

    [Column("change_description")]
    public string? ChangeDescription { get; set; }

    [Required]
    [Column("timestamp")]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("TemplateId")]
    public Template? Template { get; set; }
}