# HTML Page Builder & Template Management Platform

A comprehensive drag-and-drop HTML page builder application for creating dynamic score report templates. Features persistent storage, API endpoints, dynamic JSON data population, multi-page layouts, PDF/image export capabilities, and AI-powered image generation.

## 🚀 Features

- **Drag & Drop Interface**: Visual component library with canvas-based template design
- **Template Management**: Save, load, version, and publish templates with audit logging
- **Dynamic Content**: Template variables for data injection with JSON data import
- **Chart Components**: Stacked bar charts and column charts with Google Charts integration
- **Export Capabilities**: HTML, PDF, and PNG export with full-page A4 layouts
- **AI Integration**: DALL-E 3 powered image generation for dynamic content
- **Multi-page Support**: Automatic page breaks and manual page control
- **Rich Text Editing**: Inline text editor with formatting options
- **Background Customization**: Custom colors and images for report backgrounds
- **API Endpoints**: RESTful API for programmatic template generation

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast development with HMR)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Charts**: Google Charts for data visualization

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **Storage**: File-based JSON fallback for local persistence
- **Export**: Puppeteer for PDF/PNG generation
- **AI**: OpenAI DALL-E 3 for image generation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: For cloning the repository

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd html-page-builder
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React, TypeScript, and Vite for frontend
- Express.js and related backend packages
- PostgreSQL client and Drizzle ORM
- UI components (Radix UI, Tailwind CSS)
- Export tools (Puppeteer, html-pdf-node)

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:

```env
# Database Configuration (PostgreSQL)
DATABASE_URL=your_postgresql_connection_string
PGHOST=your_db_host
PGDATABASE=your_db_name
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGPORT=5432

# OpenAI API (for AI image generation)
OPENAI_API_KEY=your_openai_api_key

# Application Settings
NODE_ENV=development
PORT=5000
```

### 4. Database Setup

The application uses PostgreSQL with automatic fallback to file storage.

**Option A: Use Neon Database (Recommended)**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in your `.env`

**Option B: Local PostgreSQL**
1. Install PostgreSQL locally
2. Create a database
3. Update the connection details in `.env`

**Option C: File Storage Fallback**
- If no database is configured, the app automatically uses JSON file storage
- Templates are saved in the `data/` directory

### 5. Initialize Database Schema

Push the database schema to your PostgreSQL instance:

```bash
npm run db:push
```

This creates all necessary tables for templates, users, and audit logs.

## 🚀 Running the Application

### Development Mode

Start both frontend and backend in development mode:

```bash
npm run dev
```

This command:
- Starts the Express.js backend server on port 5000
- Launches the Vite development server with HMR
- Serves the complete application at `http://localhost:5000`
- Provides fast refresh for React components
- Includes source maps for debugging

### Production Build

Build the application for production:

```bash
npm run build
```

This creates optimized bundles in the `dist/` directory.

Start the production server:

```bash
npm start
```

## 🗂️ Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── drag-drop/  # Canvas, properties, component library
│   │   │   ├── template-components/ # Chart, text, layout components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── lib/           # Utilities (charts, HTML generation, validation)
│   │   ├── pages/         # Application pages (builder, templates)
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main application component
├── server/                # Express.js backend
│   ├── routes.ts         # API endpoint definitions
│   ├── storage.ts        # Data persistence layer
│   ├── db.ts            # Database configuration
│   └── index.ts         # Server entry point
├── shared/               # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
├── data/                # File storage (auto-created)
├── public/              # Static assets
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── drizzle.config.ts    # Database migration configuration
```

## 📱 Usage

### 1. Template Creation
- Navigate to the **Page Builder** tab
- Drag components from the library to the canvas
- Configure properties in the right panel
- Save templates for reuse

### 2. Data Import
- Use the **Import JSON Data** button to load dynamic content
- Supports chart data, images, and template variables
- Auto-detects `stackedBarData` and `columnChartData`

### 3. Chart Components
- **Stacked Bar Chart**: Horizontal bars with colored segments
- **Column Chart**: Vertical bars/columns for data comparison
- Charts automatically use imported JSON data

### 4. Export Options
- **HTML Export**: Clean HTML with embedded styles
- **PDF Export**: A4-sized PDF documents
- **PNG Export**: High-resolution image files
- **Preview**: Live preview with real data

### 5. Template Management
- **Save**: Store templates with versioning
- **Load**: Access saved templates
- **Publish**: Make templates available via API
- **Delete**: Remove unwanted templates

## 🔌 API Endpoints

The application provides RESTful API endpoints for programmatic access:

### Template Management
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create new template
- `GET /api/templates/:id` - Get specific template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Template Generation
- `POST /api/templates/:id/generate` - Generate HTML from template
- `POST /api/templates/:id/export/pdf` - Export template as PDF
- `POST /api/templates/:id/export/png` - Export template as PNG

### Example API Usage

```bash
# Get all templates
curl http://localhost:5000/api/templates

# Generate PDF from template with data
curl -X POST http://localhost:5000/api/templates/123/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"studentName": "John Doe", "score": 85}'
```

## 🎨 Customization

### Adding New Components
1. Create component file in `client/src/components/template-components/`
2. Add component type to `client/src/types/template.ts`
3. Register in `client/src/components/drag-drop/ComponentLibrary.tsx`
4. Add rendering logic to `client/src/components/drag-drop/CanvasArea.tsx`

### Styling
- Modify `client/src/index.css` for global styles
- Use Tailwind classes for component styling
- Customize theme in `tailwind.config.ts`

### Database Schema Changes
1. Update `shared/schema.ts`
2. Run `npm run db:push` to apply changes

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
- Verify `DATABASE_URL` in `.env`
- Check database server status
- Application will fallback to file storage automatically

**2. Charts Not Rendering**
- Ensure Google Charts library loads properly
- Check browser console for JavaScript errors
- Verify chart data format matches expected structure

**3. Export Functions Not Working**
- Puppeteer requires additional system dependencies
- On Linux: `sudo apt-get install -y chromium-browser`
- Check server logs for detailed error messages

**4. Build Errors**
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version compatibility
- Verify all environment variables are set

### Development Tips

- Use browser developer tools to inspect component props
- Check network tab for API request/response details
- Monitor server logs for backend issues
- Use React DevTools for component debugging

## 🚢 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t html-page-builder .

# Run container
docker run -p 5000:5000 --env-file .env html-page-builder
```

### Manual Deployment

1. Build the application: `npm run build`
2. Copy `dist/`, `server/`, `package.json` to production server
3. Install production dependencies: `npm install --production`
4. Set environment variables
5. Start server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-component`
3. Commit changes: `git commit -am 'Add new component'`
4. Push branch: `git push origin feature/new-component`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the troubleshooting section above
- Review server logs for error details
- Open an issue in the project repository
- Check that all required environment variables are configured

---

**Built with React, Node.js, PostgreSQL, and modern web technologies for creating professional document templates with ease.**