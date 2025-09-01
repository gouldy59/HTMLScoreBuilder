# HTMLScoreBuilder .NET 8 API

This is the .NET 8 Web API version of the HTMLScoreBuilder server, converted from the original Node.js/TypeScript implementation.

## Features

- ✅ Full ASP.NET Core 8 Web API
- ✅ Entity Framework Core with PostgreSQL support
- ✅ In-memory database fallback for development
- ✅ All original API endpoints converted
- ✅ Template CRUD operations
- ✅ Template versioning and publishing
- ✅ HTML generation from templates
- ✅ PDF and image generation (via PuppeteerSharp)
- ✅ CORS configuration for frontend compatibility
- ✅ Swagger/OpenAPI documentation
- ✅ Dependency injection setup

## Quick Start

### Prerequisites

- .NET 8.0 SDK
- Optional: PostgreSQL database (for production)

### Running the API

1. **Navigate to the .NET API directory:**
   ```bash
   cd server-dotnet/HTMLScoreBuilder.API
   ```

2. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

3. **Run the application:**
   ```bash
   dotnet run
   ```

The API will start on `http://localhost:5000` and includes:
- API endpoints at `/api/*`
- Swagger UI at `/swagger` (in development mode)
- Health check at `/health`

## API Endpoints

All original endpoints have been converted and are compatible with the React frontend:

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/{id}` - Get template by ID
- `POST /api/templates` - Create new template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template

### Template Families
- `GET /api/templates/families` - Get template families overview

### Versioning
- `POST /api/templates/{id}/versions` - Create new version
- `GET /api/templates/{id}/versions` - Get all versions
- `GET /api/templates/{id}/history` - Get template history
- `POST /api/templates/{id}/revert/{versionId}` - Revert to version
- `GET /api/templates/{id}/latest` - Get latest version

### Publishing
- `POST /api/templates/{id}/publish` - Publish template
- `POST /api/templates/{id}/unpublish` - Unpublish template

### Generation
- `POST /api/templates/{id}/generate` - Generate HTML
- `POST /api/templates/{id}/generate-pdf` - Generate PDF
- `POST /api/templates/{id}/generate-image` - Generate image
- `POST /api/templates/{id}/export-html` - Export HTML file

### Legacy Endpoints (for compatibility)
- `POST /api/export-html` - Legacy HTML export
- `POST /api/generate-pdf` - Legacy PDF generation
- `POST /api/generate-image` - Legacy image generation

### Audit
- `GET /api/templates/{id}/audit` - Get audit history

## Configuration

### Database Connection

The API supports both PostgreSQL and in-memory databases:

**PostgreSQL (Production):**
Set the connection string via environment variable:
```bash
export DATABASE_URL="Host=localhost;Database=htmlscorebuilder;Username=user;Password=pass"
```

Or in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=htmlscorebuilder;Username=user;Password=pass"
  }
}
```

**In-Memory (Development):**
If no connection string is provided, the API automatically uses an in-memory database with sample data.

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)

## Development

### Building
```bash
dotnet build
```

### Running Tests
```bash
dotnet test
```

### Database Migrations

For PostgreSQL databases, Entity Framework Core will automatically apply migrations on startup.

## PDF Generation

PDF generation uses PuppeteerSharp, which requires Chrome/Chromium. In some environments, you may need to:

1. Install Chrome/Chromium manually
2. Set the executable path in the PdfGenerationService
3. Or use alternative PDF libraries like IronPDF or DinkToPdf

## Sample Data

When using the in-memory database, the API automatically seeds with sample templates:
- "Student Score Report" - A complex template with multiple components
- "Simple Report Template" - A basic template for testing

## Frontend Compatibility

This .NET 8 API is designed to be a drop-in replacement for the Node.js server. The React frontend should work without modifications by:

1. Stopping the Node.js server
2. Starting this .NET API on port 5000
3. The frontend will automatically connect to the .NET endpoints

## Architecture

### Project Structure
```
server-dotnet/HTMLScoreBuilder.API/
├── Controllers/           # API controllers
├── Models/               # Entity models and DTOs
├── Services/             # Business logic services
├── Data/                 # Entity Framework DbContext
├── Program.cs            # Application startup
└── appsettings.json      # Configuration
```

### Key Components

- **ApplicationDbContext** - Entity Framework database context
- **TemplateService** - Core business logic for templates
- **PdfGenerationService** - PDF/image generation using PuppeteerSharp
- **TemplatesController** - Main API controller
- **LegacyController** - Compatibility endpoints

## Migration from Node.js

This .NET 8 version maintains full API compatibility with the original Node.js implementation:

- ✅ Same endpoint URLs and HTTP methods
- ✅ Same request/response JSON formats
- ✅ Same database schema (PostgreSQL)
- ✅ Same functionality for templates, versioning, and generation
- ✅ Same CORS configuration

The migration provides:
- Better performance with compiled C#
- Strong typing throughout the application
- Robust dependency injection
- Built-in health checks and monitoring
- Native async/await support
- Better tooling and debugging