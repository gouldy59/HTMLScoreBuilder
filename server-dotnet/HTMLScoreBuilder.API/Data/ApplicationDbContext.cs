using Microsoft.EntityFrameworkCore;
using HTMLScoreBuilder.API.Models;

namespace HTMLScoreBuilder.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Template> Templates { get; set; }
    public DbSet<TemplateAuditLog> TemplateAuditLogs { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Template entity
        modelBuilder.Entity<Template>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.Components).IsRequired().HasDefaultValue("[]");
            entity.Property(e => e.Variables).IsRequired().HasDefaultValue("{}");
            entity.Property(e => e.Styles).IsRequired().HasDefaultValue("{}");
            entity.Property(e => e.Version).IsRequired().HasDefaultValue(1);
            entity.Property(e => e.IsLatest).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.IsPublished).IsRequired().HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Configure self-referencing relationship for template versions
            entity.HasOne(e => e.Parent)
                  .WithMany(e => e.Versions)
                  .HasForeignKey(e => e.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Add indexes for better performance
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.IsLatest);
            entity.HasIndex(e => e.IsPublished);
            entity.HasIndex(e => e.ParentId);
        });

        // Configure TemplateAuditLog entity
        modelBuilder.Entity<TemplateAuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TemplateId).IsRequired();
            entity.Property(e => e.Action).IsRequired();
            entity.Property(e => e.Timestamp).IsRequired().HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Configure foreign key to Template
            entity.HasOne(e => e.Template)
                  .WithMany()
                  .HasForeignKey(e => e.TemplateId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Add indexes
            entity.HasIndex(e => e.TemplateId);
            entity.HasIndex(e => e.Timestamp);
        });

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired();
            entity.Property(e => e.Password).IsRequired();

            // Add unique constraint on username
            entity.HasIndex(e => e.Username).IsUnique();
        });
    }
}