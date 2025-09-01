using Microsoft.EntityFrameworkCore;
using HTMLScoreBuilder.API.Data;
using HTMLScoreBuilder.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? 
                      Environment.GetEnvironmentVariable("DATABASE_URL");

if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // Fallback to in-memory database for development
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseInMemoryDatabase("HTMLScoreBuilderDb"));
}

// Register services
builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IPdfGenerationService, PdfGenerationService>();

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add JSON options
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors("AllowAll");

// Custom middleware for request logging
app.Use(async (context, next) =>
{
    var start = DateTime.UtcNow;
    var path = context.Request.Path;
    
    await next.Invoke();
    
    var duration = DateTime.UtcNow - start;
    if (path.StartsWithSegments("/api"))
    {
        var logLine = $"{context.Request.Method} {path} {context.Response.StatusCode} in {duration.TotalMilliseconds}ms";
        if (logLine.Length > 80)
        {
            logLine = logLine[..79] + "…";
        }
        Console.WriteLine(logLine);
    }
});

app.UseRouting();
app.MapControllers();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    
    if (context.Database.IsInMemory())
    {
        context.Database.EnsureCreated();
        
        // Seed sample data for in-memory database
        if (!context.Templates.Any())
        {
            await SeedSampleData(context);
        }
    }
    else
    {
        try
        {
            // For real database, apply any pending migrations
            await context.Database.MigrateAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database migration failed: {ex.Message}");
            // Continue with the application startup
        }
    }
}

// Health check endpoint
app.MapGet("/health", () => new { status = "healthy", timestamp = DateTime.UtcNow });

// Default port should be 5000 to match the original server
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Urls.Add($"http://0.0.0.0:{port}");

Console.WriteLine($"HTMLScoreBuilder API serving on port {port}");

app.Run();

async Task SeedSampleData(ApplicationDbContext context)
{
    var sampleTemplate1 = new HTMLScoreBuilder.API.Models.Template
    {
        Name = "Student Score Report",
        Description = "Template for academic score reports",
        Components = "[{\"id\":\"component-1\",\"type\":\"header\",\"content\":{\"title\":\"{{studentName}} - Academic Score Report\",\"subtitle\":\"Academic Year {{academicYear}} • Grade {{grade}}\"},\"style\":{\"backgroundColor\":\"#DBEAFE\",\"textColor\":\"#1F2937\",\"fontSize\":\"large\",\"width\":\"400px\",\"height\":\"120px\"},\"position\":{\"x\":401.5,\"y\":34}},{\"id\":\"component-2\",\"type\":\"student-info\",\"content\":{\"fields\":{\"Student Name\":\"{{studentName}}\",\"Student ID\":\"{{studentId}}\",\"Class\":\"{{className}}\",\"Teacher\":\"{{teacherName}}\"}},\"style\":{\"backgroundColor\":\"#F0FDF4\",\"textColor\":\"#1F2937\",\"width\":\"350px\",\"height\":\"200px\"},\"position\":{\"x\":428.5,\"y\":237}},{\"id\":\"component-3\",\"type\":\"text-block\",\"content\":{\"text\":\"This report shows the academic performance for {{studentName}} in the {{academicYear}} academic year.\"},\"style\":{\"backgroundColor\":\"#FFFFFF\",\"textColor\":\"#1F2937\"},\"position\":{\"x\":50,\"y\":500}}]",
        Variables = "{\"studentName\":\"Sample Student\",\"academicYear\":\"2024-2025\",\"grade\":\"10\",\"studentId\":\"12345\",\"className\":\"10A\",\"teacherName\":\"Ms. Smith\"}",
        Styles = "{\"reportBackground\":\"#ffffff\",\"reportBackgroundImage\":\"\"}",
        Version = 1,
        IsLatest = true,
        ParentId = null,
        ChangeDescription = null,
        IsPublished = false,
        PublishedAt = null,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    var sampleTemplate2 = new HTMLScoreBuilder.API.Models.Template
    {
        Name = "Simple Report Template",
        Description = "Basic template for reports",
        Components = "[{\"id\":\"component-1\",\"type\":\"header\",\"content\":{\"title\":\"Report Title\",\"subtitle\":\"Report Subtitle\"},\"style\":{\"backgroundColor\":\"#DBEAFE\",\"textColor\":\"#1F2937\"},\"position\":{\"x\":100,\"y\":50}}]",
        Variables = "{}",
        Styles = "{}",
        Version = 1,
        IsLatest = true,
        ParentId = null,
        ChangeDescription = null,
        IsPublished = false,
        PublishedAt = null,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    context.Templates.AddRange(sampleTemplate1, sampleTemplate2);
    await context.SaveChangesAsync();
    
    Console.WriteLine("Sample templates seeded successfully");
}
