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
```

# User Preferences

```
Preferred communication style: Simple, everyday language.
```