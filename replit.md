# Overview

This is a full-stack web application for creating score report templates using a drag-and-drop HTML page builder. The system allows users to design professional academic score reports with dynamic template variables and component-based architecture.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **State Management**: React hooks with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Drag & Drop**: Custom implementation for component positioning

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **API**: RESTful endpoints for template CRUD operations
- **Development**: Hot module replacement with Vite middleware

## Data Storage
- **Primary Database**: PostgreSQL via Neon serverless (live and persistent)
- **ORM**: Drizzle ORM with code-first schema definition
- **Schema**: Templates, users, and audit log tables with JSON fields for flexible component storage
- **Migrations**: Drizzle Kit for schema management and database operations
- **Storage Implementation**: DatabaseStorage class with full CRUD operations and versioning support

# Key Components

## Template System
- **Component Types**: Predefined components (header, student-info, grade-summary, chart, etc.)
- **Dynamic Variables**: Template variable system with `{{variableName}}` syntax
- **Component Storage**: JSON-based component data with position, content, and styling
- **Template Variables**: Flexible variable system for dynamic content replacement

## Drag & Drop Interface
- **Component Library**: Categorized components (report, layout)
- **Canvas Area**: Main editing surface for template design
- **Properties Panel**: Component-specific editing interface
- **Toolbar**: Template management and export functionality

## Database Schema
```sql
templates {
  id: serial primary key
  name: text
  description: text
  components: jsonb (component definitions)
  variables: jsonb (template variables)
  styles: jsonb (global styles)
  created_at: timestamp
  updated_at: timestamp
}

users {
  id: serial primary key
  username: text unique
  password: text
}
```

# Data Flow

1. **Template Creation**: Users create templates by dragging components onto canvas
2. **Component Configuration**: Each component can be customized via properties panel
3. **Template Storage**: Component data stored as JSON in PostgreSQL
4. **Template Rendering**: Components rendered with variable substitution
5. **HTML Export**: Templates exported as standalone HTML files

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL connection
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI primitive components
- **tailwindcss**: Utility-first CSS framework

## Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **@replit/vite-plugin-***: Replit-specific development tools

# Deployment Strategy

## Development Environment
- **Runtime**: Node.js 20 with npm package management
- **Database**: PostgreSQL 16 via Replit modules
- **Dev Server**: Vite development server with HMR
- **Port Configuration**: Local port 5000, external port 80

## Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Assets**: Served from built frontend directory
- **Database**: Neon serverless PostgreSQL for production

## Environment Configuration

### Multi-Environment Support
- **Development**: Local development with debug features enabled
- **QC**: Quality assurance testing environment
- **Staging**: Pre-production environment for final testing
- **Production**: Live application with full security and monitoring

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string (required for each environment)
- **NODE_ENV**: Environment detection (development/test/staging/production)
- **SESSION_SECRET**: Secure session encryption key (environment-specific)
- **CORS_ORIGIN**: Allowed frontend origins for CORS policy
- **Feature Flags**: ENABLE_ANALYTICS, ENABLE_PDF_EXPORT, ENABLE_IMAGE_EXPORT
- **Debug Settings**: DEBUG, LOG_LEVEL, ENABLE_DEBUG_TOOLBAR

### Configuration Files
- **environments/**: Environment-specific configuration files
- **config/environment.ts**: Centralized configuration management
- **scripts/**: Deployment and setup automation scripts
- **.env.example**: Template for environment variables

# Changelog

```
Changelog:
- June 27, 2025: Initial setup
- July 15, 2025: Fixed grid container functionality - implemented function-based state updates to resolve component stacking issues. Container components now properly accumulate multiple child components instead of replacing them.
- July 15, 2025: Enhanced horizontal bar chart component with comprehensive features:
  * Added dynamic score pointers (single circle dots) for precise value indication
  * Implemented customizable up to 20 categories with add/remove functionality
  * Added toggle to hide/show percentage values inside bars for cleaner appearance
  * Set all default segments to balanced 25% values for consistent visual layout
  * Improved positioning to work properly within container components
  * Added placeholder text for better user guidance
- July 15, 2025: Added PDF and image generation capabilities:
  * Implemented server-side PDF generation using html-pdf-node
  * Added image generation using Puppeteer for high-quality PNG exports
  * Created new API endpoints for /generate-pdf and /generate-image
  * Added Generate PDF and Generate Image buttons to the toolbar
  * Enhanced HTML rendering for proper PDF/image output with full chart support
  * Both exports use the same data as HTML export (imported JSON or sample data)
- July 16, 2025: Fixed template save and load functionality issues:
  * Resolved template saving after loading - now properly updates existing templates instead of creating versions
  * Fixed template loading dialog to display available templates correctly
  * Separated version creation from regular template saves for proper workflow
  * Fixed PDF download corruption by using proper binary data transmission with res.end()
  * All export formats (HTML, PDF, PNG) now work correctly with proper file downloads
- July 16, 2025: Fixed Puppeteer compatibility issues for PDF/PNG exports:
  * Resolved TypeError: page.waitForTimeout is not a function by replacing with setTimeout Promise wrapper
  * PDF and image generation now work completely with full chart rendering
  * Charts export with proper colored segments, score pointers, and legends in both formats
  * Background colors preserve correctly in exported files
  * All visual elements match client-side rendering exactly
- July 16, 2025: Resolved critical PDF/PNG export bug for chart components:
  * Fixed component type mismatch - server-side HTML generation now properly handles "chart" type
  * Added dedicated case for "chart" components matching "horizontal-bar-chart" functionality
  * Resolved variable declaration conflicts in server-side switch statement
  * PDF exports now generate proper file sizes (26KB+) with complete chart visualization
  * PNG exports working correctly with chart content including segments, pointers, and labels
  * All chart features (colors, score pointers, percentages, legends) export perfectly in both formats
  * Enhanced template variable support - charts using {{chartData}} variables now render correctly
  * Both direct chart data and template variable approaches work seamlessly in exports
  * Added intelligent auto-chart generation - when chartData variable is missing, automatically creates charts from available score data (mathScore, scienceScore, englishScore, etc.)
  * Charts now automatically show student performance data with proper score positioning and colored segments
  * Enhanced Chart.js format support - automatically converts Chart.js data structure to horizontal bar charts
  * System now handles multiple chart data formats: direct chartData, template variables, and Chart.js JSON format
  * Chart exports generate proper file sizes: PDF (45KB+), PNG (35KB+) with complete visual content
- July 16, 2025: Added vertical bar chart support for Chart.js format data:
  * Charts with chartType="bar" now render as vertical bar charts instead of horizontal bars
  * Server-side PDF/PNG generation correctly displays vertical bars with proper scaling and positioning
  * Vertical charts show Math (85%, 138px), Science (92%, 150px), English (78%, 127px), History (88%, 143px)
  * Client-side already supports vertical charts through Recharts BarChart component
  * Both horizontal and vertical chart formats export correctly in PDF (46KB) and PNG (43KB)
- July 16, 2025: Completed comprehensive JSON data validation system:
  * Enhanced JSONDataDialog with real-time validation feedback and detailed error messages
  * Added auto-fix functionality for common JSON formatting issues
  * Implemented client-side validation schemas for chart data, student info, score data, and template data
  * Added server-side validation schemas for template creation and data integrity
  * Enhanced user experience with validation status indicators and detailed error reporting
  * Templates now validate JSON data before PDF/PNG generation to ensure data integrity
- July 16, 2025: Fixed client-side chart data source integration:
  * Chart components now properly receive and display imported JSON data in the builder interface
  * Added support for both Chart.js format (labels/datasets) and individual score fields (mathScore, scienceScore, etc.)
  * Charts automatically update in real-time when users import JSON data through the Import Data dialog
  * Client-side preview now matches exported PDF/PNG output with dynamic data
  * Enhanced data flow from builder state → CanvasArea → ChartComponent with proper templateData passing
  * Charts gracefully fall back to sample data when no imported data is available
  * Fixed chart re-rendering issue using useMemo and key props to ensure data updates are reflected immediately
  * Resolved stale data problem where charts weren't updating with new imported JSON data
- July 16, 2025: Investigating vertical bar chart X-axis alignment issue:
  * Reverted complex positioning attempts and returned to simpler flexbox approach
  * Issue identified: bars floating above X-axis instead of sitting directly on the border line
  * Problem likely related to flexbox justify-center alignment causing labels to appear above axis
  * Currently debugging alignment between client-side Recharts rendering and server-side HTML generation
- July 17, 2025: Fixed vertical bar chart X-axis alignment and removed device modes:
  * Fixed bars to sit directly on X-axis line by removing bottom padding from chart container
  * Adjusted chart area height and Y-axis positioning for proper scale alignment
  * Enhanced data consistency between builder and preview modes with complete 5-bar chart data
  * Removed Desktop/Tablet/Mobile device preview toggle buttons from toolbar for simplified interface
  * Charts now display correctly in both builder and preview modes with proper axis alignment
- July 17, 2025: Created comprehensive home screen with dual navigation system:
  * Built new home screen with tabbed interface (Page Builder / Template Manager)
  * Added Template Manager with searchable table, pagination (10 items per page), and filtering
  * Implemented template version history view with mock data structure for future versioning
  * Added navigation flow: Home → Builder (via "Start Building") → Home (via "Home" button)
  * Restructured routing: "/" (Home), "/builder" (Page Builder) with proper navigation controls
  * Enhanced user experience with professional template management interface
- July 17, 2025: Added API endpoints section with programmatic template generation:
  * Created third tab "API Endpoints" on home screen for developer access
  * Implemented 3 POST endpoints: /export-html, /generate-image, /generate-pdf
  * Built interactive API tester with template selection and JSON data input
  * Added comprehensive API documentation with sample requests for each endpoint
  * Endpoints accept templateId and JSON data to generate reports programmatically
  * Restored template loading functionality with URL parameter support (/builder?templateId=X)
  * Fixed "Load Template" button to redirect to Template Manager for template selection
- July 17, 2025: Added editable template name functionality in Page Builder:
  * Added inline template name editing in the toolbar with pencil icon
  * Users can click the edit button or the template name to modify it
  * Supports Enter to save, Escape to cancel, and click-away to save
  * Template name automatically updates when loading saved templates
  * Names are properly saved when creating or updating templates
  * Cleaned up debug logging now that template loading works correctly
- July 17, 2025: Enhanced template versioning system with user-friendly interface:
  * Added "Save as Version" button to Component Library for creating new template versions
  * Fixed template version history display to show all versions instead of just one
  * Version system properly tracks: version numbers, parent templates, change descriptions
  * Users can now distinguish between "Save Template" (updates current) and "Save as Version" (creates new)
  * Version history dialog shows chronological list of all template versions
  * Each version maintains full component data, styles, and metadata for complete restoration
- July 17, 2025: Implemented template name uniqueness validation and fixed version display:
  * Added server-side validation to prevent duplicate template names across the system
  * Template creation and updates now return 409 error with descriptive message for name conflicts
  * Enhanced client-side error handling to display specific validation messages to users
  * Fixed Template Manager display to show only latest version of each template family
  * Versions no longer appear as separate templates in the Template Manager interface
  * Each template family now shows only its latest version, with full version history accessible via "Versions" button
- July 17, 2025: Simplified template saving to automatic versioning system:
  * Removed "Save as Version" button from Component Library interface
  * Modified "Save Template" button to automatically create versions after the initial save
  * First save creates a new template (version 1), subsequent saves create new versions
  * Every save now preserves template history through automatic version creation
  * Streamlined user experience - single "Save Template" button handles all saving operations
  * Version tracking continues to work with full history accessible through "Versions" button
- July 17, 2025: Implemented comprehensive publish/unpublish system with audit logging:
  * Added publish/unpublish functionality with clear status indicators (Published/Draft badges)
  * Implemented conditional save logic: published templates create versions, unpublished templates update existing
  * Added publish status display in both Page Builder toolbar and Template Manager table
  * Created comprehensive audit trail system tracking all template changes (create, update, publish, unpublish, version creation)
  * Added audit history dialog with detailed change tracking and timestamps
  * Enhanced Template Manager with publish status column and audit history access
  * Publish/unpublish buttons with proper API endpoints and real-time status updates
  * All template modifications now logged with action type, timestamps, and change descriptions
  * Fixed publish state synchronization bug where UI showed incorrect publish status after version creation
  * Modified save logic to use local UI state instead of server state for publish status checks
  * New versions now correctly start as unpublished and show proper Draft status in UI
- July 21, 2025: Fixed critical template version loading bug:
  * Resolved React Query cache conflicts causing wrong template data to load between versions
  * Implemented custom query functions with specific query keys to avoid cache collisions
  * Template version loading now works correctly with proper cache invalidation
  * Each template version (ID 1, 2, 3, etc.) now loads its own specific data and components
  * Enhanced debugging with detailed logging to track template loading process
  * Fixed server API responses to ensure correct template data is returned for each version
- July 21, 2025: Implemented wizard interface for Page Builder:
  * Created TemplateNameWizard component with professional design and validation
  * Added routing for /builder/new to show wizard before main builder interface
  * Wizard requires minimum 3-character template name with real-time validation
  * Added "Back to Home" and "Continue to Builder" buttons with proper navigation
  * Home screen "Start Building" button now goes to wizard first, then main builder
  * Direct /builder access and ?templateId= loading still bypasses wizard for existing templates
  * Improved card layout with responsive button positioning and proper container constraints
- July 25, 2025: Migrated from in-memory to persistent PostgreSQL database storage:
  * Replaced MemStorage with DatabaseStorage implementation using Drizzle ORM
  * All templates, versions, audit logs, and user data now persist across server restarts
  * Added comprehensive database operations with proper query optimization
  * Maintained full compatibility with existing template versioning and publish/unpublish functionality
  * Enhanced data integrity with proper foreign key relationships and constraints
  * Successfully pushed database schema with templates, users, and audit log tables
- July 25, 2025: Implemented comprehensive multi-environment deployment architecture:
  * Created environment-specific configuration files for development, QC, staging, and production
  * Added centralized configuration management with feature flags and environment validation
  * Built deployment automation scripts with environment setup and database migration support
  * Created Docker and Kubernetes configurations for scalable container deployment
  * Implemented security-focused configurations with environment-appropriate settings
  * Added comprehensive deployment documentation with best practices and troubleshooting guides
```

# User Preferences

```
Preferred communication style: Simple, everyday language.
```