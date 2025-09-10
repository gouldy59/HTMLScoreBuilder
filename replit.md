# Overview
This project is a full-stack web application designed for creating dynamic score report templates. It features a drag-and-drop HTML page builder, allowing users to design professional academic reports with dynamic template variables and a component-based architecture. The system includes persistent storage for templates that survive server restarts, ensuring work is never lost.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, shadcn/ui components, Radix UI primitives
- **State Management**: React hooks with TanStack Query
- **Routing**: Wouter
- **Drag & Drop**: Custom implementation
- **UI/UX**: Professional template management interface, rich text editing, interactive API tester. Emphasis on clean design and responsive layouts.

## Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (via Neon serverless)
- **API**: RESTful endpoints for template CRUD, generation, and external integrations.

## Data Storage
- **Primary Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Fallback Storage**: File-based JSON storage in `data/` directory for local persistence
- **Storage Strategy**: Automatic fallback from database → file storage → memory storage
- **Schema**: Templates, users, and audit logs with JSON fields for components, variables, and styles
- **Persistence**: Templates survive server restarts via file storage when database unavailable

## Key Features
- **Template System**: Predefined and custom components, dynamic `{{variableName}}` support, JSON-based component storage.
- **Drag & Drop Interface**: Component library, canvas, properties panel, toolbar for management and export.
- **Dynamic Content**: Template variables for data injection, automated chart generation from score data.
- **Export Capabilities**: HTML, PDF, and PNG export of designed templates.
- **Rich Text Editing**: Inline text editor with formatting options.
- **Image & QR Code Components**: Support for image URLs, AI-generated images (DALL-E), and dynamic QR codes with template variable integration.
- **Template Management**: Home screen with tabbed interface (Page Builder / Template Manager), searchable table, pagination, filtering.
- **Versioning & Publishing**: Automatic versioning on save, publish/unpublish functionality with audit logging.
- **API Endpoints**: Programmatic template generation (HTML, image, PDF) via REST API.
- **Data Validation**: Client-side and server-side JSON data validation for template and chart data.
- **Expanded Chart Library**: Includes Stacked Bar, Column, Lollipop, Nightingale, Icon, Word Cloud, Table, Bubble, Stacked Column, Donut, and Venn Diagram charts.

# External Dependencies

- **@neondatabase/serverless**: Neon PostgreSQL connection with WebSocket support.
- **drizzle-orm**: Database ORM and query builder with fallback strategies.
- **@tanstack/react-query**: Server state management and caching.
- **@radix-ui/***: UI primitive components for consistent design.
- **tailwindcss**: Utility-first CSS framework for responsive styling.
- **html-pdf-node**: Server-side PDF generation via Puppeteer.
- **puppeteer**: Browser automation for image and PDF generation.
- **OpenAI DALL-E 3**: AI image generation for dynamic Image components.
- **File System Storage**: JSON-based persistence layer for local template storage.