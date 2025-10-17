import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables from repo root
config({ path: '../.env' });

const EnvSchema = z.object({
  // Server configuration
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // MCP configuration
  MCP_SERVER_NAME: z.string().default('finsage-mcp-server'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  
  // Stub mode (default to true for development)
  STUB_MODE: z.string().transform(val => val === 'true').default('true'),
  
  // Airia configuration
  AIRIA_API_KEY: z.string().optional(),
  AIRIA_WEBHOOK_URL: z.string().url().optional(),
  
  // TrueFoundry configuration
  TRUEFOUNDRY_API_KEY: z.string().optional(),
  TRUEFOUNDRY_GATEWAY_URL: z.string().url().optional(),
  
  // Apify configuration
  APIFY_TOKEN: z.string().optional(),
  APIFY_ACTOR_ID: z.string().optional(),
  
  // Sentry configuration
  SENTRY_DSN: z.string().url().optional(),
  
  // Optional services
  NEWS_API_KEY: z.string().optional(),
  REDPANDA_BROKERS: z.string().default('localhost:19092'),
  
  // Database configuration
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // Logging configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  AUDIT_LOG_DIR: z.string().default('runtime_logs'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    console.warn('⚠️  Environment validation failed, using defaults and stub mode');
    console.warn('Missing required environment variables, running in STUB_MODE');
    
    // Return defaults with stub mode enabled
    return {
      PORT: process.env.PORT || '3000',
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      MCP_SERVER_NAME: 'finsage-mcp-server',
      MCP_SERVER_VERSION: '1.0.0',
      STUB_MODE: true,
      AIRIA_API_KEY: process.env.AIRIA_API_KEY,
      AIRIA_WEBHOOK_URL: process.env.AIRIA_WEBHOOK_URL,
      TRUEFOUNDRY_API_KEY: process.env.TRUEFOUNDRY_API_KEY,
      TRUEFOUNDRY_GATEWAY_URL: process.env.TRUEFOUNDRY_GATEWAY_URL,
      APIFY_TOKEN: process.env.APIFY_TOKEN,
      APIFY_ACTOR_ID: process.env.APIFY_ACTOR_ID,
      SENTRY_DSN: process.env.SENTRY_DSN,
      NEWS_API_KEY: process.env.NEWS_API_KEY,
      REDPANDA_BROKERS: process.env.REDPANDA_BROKERS || 'localhost:19092',
      DATABASE_URL: process.env.DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
      AUDIT_LOG_DIR: process.env.AUDIT_LOG_DIR || 'runtime_logs',
    };
  }
};

export const env = parseEnv();

// Helper functions
export const isStubMode = (): boolean => env.STUB_MODE;
export const isProduction = (): boolean => env.NODE_ENV === 'production';
export const isDevelopment = (): boolean => env.NODE_ENV === 'development';

// Log environment status
if (isStubMode()) {
  console.log('🔧 Running in STUB_MODE - using deterministic test data');
} else {
  console.log('🚀 Running in LIVE_MODE - connecting to real APIs');
}

// Check for missing critical environment variables
const missingVars: string[] = [];
if (!isStubMode()) {
  if (!env.AIRIA_API_KEY) missingVars.push('AIRIA_API_KEY');
  if (!env.TRUEFOUNDRY_API_KEY) missingVars.push('TRUEFOUNDRY_API_KEY');
  if (!env.APIFY_TOKEN) missingVars.push('APIFY_TOKEN');
  if (!env.SENTRY_DSN) missingVars.push('SENTRY_DSN');
}

if (missingVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('   Falling back to STUB_MODE');
}
