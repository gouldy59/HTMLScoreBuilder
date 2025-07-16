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
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with code-first schema definition
- **Schema**: Templates and users tables with JSON fields for flexible component storage
- **Migrations**: Drizzle Kit for schema management

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
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment detection (development/production)
- **REPL_ID**: Replit environment detection

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
```

# User Preferences

```
Preferred communication style: Simple, everyday language.
```