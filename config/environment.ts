// Environment Configuration Management
import { config } from 'dotenv';
import { join } from 'path';

// Load environment-specific configuration
const NODE_ENV = process.env.NODE_ENV || 'development';

// Load environment file based on NODE_ENV
const envFile = join(process.cwd(), 'environments', `${NODE_ENV}.env`);
config({ path: envFile });

// Fallback to .env if environment file doesn't exist
config();

export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  corsOrigin: string;
  debug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: {
    analytics: boolean;
    pdfExport: boolean;
    imageExport: boolean;
    debugToolbar: boolean;
  };
}

export const appConfig: AppConfig = {
  nodeEnv: NODE_ENV,
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  sessionSecret: process.env.SESSION_SECRET || 'fallback-session-secret',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5000',
  debug: process.env.DEBUG === 'true',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    pdfExport: process.env.ENABLE_PDF_EXPORT !== 'false',
    imageExport: process.env.ENABLE_IMAGE_EXPORT !== 'false',
    debugToolbar: process.env.ENABLE_DEBUG_TOOLBAR === 'true',
  },
};

// Validate required configuration
export function validateConfig(): void {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log(`✅ Configuration loaded for ${NODE_ENV} environment`);
}

// Environment-specific database configuration
export function getDatabaseConfig() {
  return {
    development: {
      ssl: false,
      logging: true,
    },
    test: {
      ssl: false,
      logging: false,
    },
    staging: {
      ssl: true,
      logging: false,
    },
    production: {
      ssl: true,
      logging: false,
    },
  }[NODE_ENV] || { ssl: false, logging: true };
}