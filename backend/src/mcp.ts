import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Import all tools
import { getPortfolio } from './tools/get_portfolio.js';
import { getQuotes } from './tools/get_quotes.js';
import { getFundamentals } from './tools/get_fundamentals.js';
import { getNews } from './tools/get_news.js';
import { getHistory } from './tools/get_history.js';
import { tradeSimulate } from './tools/trade_simulate.js';
import { tradeExecute } from './tools/trade_execute.js';
import { logEvent } from './tools/log_event.js';

import { env } from './env.js';

// Create MCP server
const server = new Server(
  {
    name: env.MCP_SERVER_NAME,
    version: env.MCP_SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'get_portfolio',
    description: 'Get current portfolio positions and values',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'User ID to get portfolio for',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_quotes',
    description: 'Get real-time stock quotes',
    inputSchema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of stock symbols',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Data fields to retrieve',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_fundamentals',
    description: 'Get fundamental analysis data',
    inputSchema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of stock symbols',
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fundamental metrics to retrieve',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_news',
    description: 'Get relevant news and sentiment analysis',
    inputSchema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of stock symbols',
        },
        hours_back: {
          type: 'number',
          description: 'Number of hours to look back for news',
          default: 24,
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_history',
    description: 'Get historical price data',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock symbol',
        },
        period: {
          type: 'string',
          enum: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'],
          description: 'Time period for historical data',
        },
        interval: {
          type: 'string',
          enum: ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'],
          description: 'Data interval',
        },
      },
      required: ['symbol', 'period'],
    },
  },
  {
    name: 'trade_simulate',
    description: 'Simulate trades without execution',
    inputSchema: {
      type: 'object',
      properties: {
        trades: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              action: { type: 'string', enum: ['buy', 'sell'] },
              quantity: { type: 'number' },
              price: { type: 'number' },
            },
            required: ['symbol', 'action', 'quantity'],
          },
          description: 'List of trades to simulate',
        },
      },
      required: ['trades'],
    },
  },
  {
    name: 'trade_execute',
    description: 'Execute trades (simulation only in STUB_MODE)',
    inputSchema: {
      type: 'object',
      properties: {
        trades: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              action: { type: 'string', enum: ['buy', 'sell'] },
              quantity: { type: 'number' },
              order_type: { type: 'string', enum: ['market', 'limit', 'stop'] },
              price: { type: 'number' },
              stop_price: { type: 'number' },
            },
            required: ['symbol', 'action', 'quantity', 'order_type'],
          },
          description: 'List of trades to execute',
        },
      },
      required: ['trades'],
    },
  },
  {
    name: 'log_event',
    description: 'Log events for monitoring and audit',
    inputSchema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          enum: ['signal', 'suggestion', 'trade', 'error', 'alert'],
          description: 'Type of event to log',
        },
        data: {
          type: 'object',
          description: 'Event data',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Event severity level',
        },
      },
      required: ['event_type', 'data'],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'get_portfolio':
        result = await getPortfolio(args as any);
        break;
      case 'get_quotes':
        result = await getQuotes(args as any);
        break;
      case 'get_fundamentals':
        result = await getFundamentals(args as any);
        break;
      case 'get_news':
        result = await getNews(args as any);
        break;
      case 'get_history':
        result = await getHistory(args as any);
        break;
      case 'trade_simulate':
        result = await tradeSimulate(args as any);
        break;
      case 'trade_execute':
        result = await tradeExecute(args as any);
        break;
      case 'log_event':
        result = await logEvent(args as any);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            tool_call_id: 'error',
            error: {
              code: 'TOOL_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error',
            },
          }),
        },
      ],
      isError: true,
    };
  }
});

// Export server for use in index.ts
export { server };

// Export MCP manifest for client discovery
export const mcpManifest = {
  name: env.MCP_SERVER_NAME,
  version: env.MCP_SERVER_VERSION,
  description: 'FinSage MCP Server - Autonomous Trading Agent Tools',
  tools: tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  })),
  capabilities: {
    tools: true,
    resources: false,
    prompts: false
  },
  server: {
    type: 'stdio',
    command: 'node',
    args: ['dist/index.js']
  }
};
