import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createWriteStream } from 'fs';
import { join } from 'path';
import * as Sentry from '@sentry/node';
import { server as mcpServer, mcpManifest } from './mcp.js';
import { env, isStubMode } from './env.js';
import { auditLogger } from './lib/audit.js';
import airiaRoute from './routes/airia.js';

// Initialize Sentry if DSN is provided
if (process.env['SENTRY_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: 'hackathon',
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.data) {
        delete event.request.data.apiKey;
        delete event.request.data.password;
        delete event.request.data.token;
      }
      return event;
    },
  });
  
  // Set global tags
  Sentry.setTag('service', 'backend');
  Sentry.setTag('env', 'hackathon');
  
  console.log('🔍 Sentry initialized for error tracking');
} else {
  console.log('⚠️  SENTRY_DSN not set, error tracking disabled');
}

const app = express();

// Sentry middleware (must be first)
if (process.env['SENTRY_DSN']) {
  // Note: Sentry middleware will be added after app setup
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- CORS Middleware (for local dev) ---
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// --- Startup Banner ---
console.log(`🔎 Health URL: http://localhost:${env.PORT}/health`);
console.log(`🌐 Allowed Origin: http://localhost:3000`);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    return originalSend.call(this, data);
  };
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    stub: isStubMode(),
    timestamp: new Date().toISOString(),
    version: env.MCP_SERVER_VERSION
  });
});

// Test endpoint for Sentry error capture
app.get('/boom', (req, res) => {
  if (process.env['SENTRY_DSN']) {
    // Intentionally throw an error to test Sentry
    const error = new Error('Test error for Sentry verification');
    Sentry.captureException(error, {
      tags: {
        test_endpoint: 'boom',
        purpose: 'sentry_verification'
      },
      extra: {
        timestamp: new Date().toISOString(),
        user_agent: req.get('User-Agent')
      }
    });
    
    res.status(500).json({
      ok: false,
      msg: 'test error',
      sentry_captured: true
    });
  } else {
    res.status(400).json({
      ok: false,
      msg: 'SENTRY_DSN not configured',
      sentry_captured: false
    });
  }
});

// MCP manifest endpoint
app.get('/mcp/manifest', (req, res) => {
  res.json(mcpManifest);
});

// MCP tools endpoint
app.post('/mcp/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const args = req.body;
  
  // Add breadcrumb for tool call
  if (process.env['SENTRY_DSN']) {
    Sentry.addBreadcrumb({
      message: `Tool call: ${toolName}`,
      category: 'tool',
      data: {
        tool_name: toolName,
        tool_call_id: args.tool_call_id || 'unknown'
      },
      level: 'info'
    });
  }

  try {
    // Validate tool name
    const validTools = ['get_portfolio', 'get_quotes', 'get_fundamentals', 'get_news', 'get_history', 'trade_simulate', 'trade_execute', 'log_event'];
    if (!validTools.includes(toolName)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOOL',
          message: `Unknown tool: ${toolName}`
        }
      });
    }

    // Call the appropriate tool
    let result;
    switch (toolName) {
      case 'get_portfolio':
        const { getPortfolio } = await import('./tools/get_portfolio.js');
        result = await getPortfolio(args);
        break;
      case 'get_quotes':
        const { getQuotes } = await import('./tools/get_quotes.js');
        result = await getQuotes(args);
        break;
      case 'get_fundamentals':
        const { getFundamentals } = await import('./tools/get_fundamentals.js');
        result = await getFundamentals(args);
        break;
      case 'get_news':
        const { getNews } = await import('./tools/get_news.js');
        result = await getNews(args);
        break;
      case 'get_history':
        const { getHistory } = await import('./tools/get_history.js');
        result = await getHistory(args);
        break;
      case 'trade_simulate':
        const { tradeSimulate } = await import('./tools/trade_simulate.js');
        result = await tradeSimulate(args);
        break;
      case 'trade_execute':
        const { tradeExecute } = await import('./tools/trade_execute.js');
        result = await tradeExecute(args);
        break;
      case 'log_event':
        const { logEvent } = await import('./tools/log_event.js');
        result = await logEvent(args);
        break;
    }

    return res.json(result);
  } catch (error) {
    console.error('Tool execution error:', error);
    
    // Capture exception in Sentry
    if (process.env['SENTRY_DSN']) {
      Sentry.captureException(error, {
        tags: {
          tool_name: toolName,
          tool_call_id: args.tool_call_id || 'unknown'
        },
        extra: {
          args: args
        }
      });
    }
    
    return res.status(500).json({
      error: {
        code: 'TOOL_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// List available tools
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_portfolio',
        description: 'Get current portfolio positions and values',
        endpoint: '/mcp/tools/get_portfolio'
      },
      {
        name: 'get_quotes',
        description: 'Get real-time stock quotes',
        endpoint: '/mcp/tools/get_quotes'
      },
      {
        name: 'get_fundamentals',
        description: 'Get fundamental analysis data',
        endpoint: '/mcp/tools/get_fundamentals'
      },
      {
        name: 'get_news',
        description: 'Get relevant news and sentiment analysis',
        endpoint: '/mcp/tools/get_news'
      },
      {
        name: 'get_history',
        description: 'Get historical price data',
        endpoint: '/mcp/tools/get_history'
      },
      {
        name: 'trade_simulate',
        description: 'Simulate trades without execution',
        endpoint: '/mcp/tools/trade_simulate'
      },
      {
        name: 'trade_execute',
        description: 'Execute trades (simulation only in STUB_MODE)',
        endpoint: '/mcp/tools/trade_execute'
      },
      {
        name: 'log_event',
        description: 'Log events for monitoring and audit',
        endpoint: '/mcp/tools/log_event'
      }
    ]
  });
});

// Airia webhook routes
app.use("/", airiaRoute);

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Capture exception in Sentry
  if (process.env['SENTRY_DSN']) {
    Sentry.captureException(error, {
      tags: {
        route: req.path,
        method: req.method
      },
      extra: {
        url: req.url,
        headers: req.headers
      }
    });
  }
  
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Start server
const PORT = parseInt(env.PORT);
const server = app.listen(PORT, () => {
  console.log(`🚀 FinSage MCP Server running on port ${PORT}`);
  console.log(`📊 Mode: ${isStubMode() ? 'STUB (test data)' : 'LIVE (real APIs)'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 MCP Manifest: http://localhost:${PORT}/mcp/manifest`);
  console.log(`🛠️  Available tools: http://localhost:${PORT}/mcp/tools`);
  console.log(`📩 Airia Webhook listening at POST /airia/finsage`);
  if (process.env['AIRIA_WEBHOOK_URL']) {
    console.log(`🌐 Airia webhook URL configured: ${process.env['AIRIA_WEBHOOK_URL']}`);
  }
  if (process.env['AIRIA_WEBHOOK_SECRET']) {
    console.log(`🔒 Airia webhook secret loaded`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Export for testing
export { app };
