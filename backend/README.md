# FinSage MCP Server

A TypeScript Model Context Protocol (MCP) server that provides trading and portfolio management tools for the FinSage autonomous trading agent.

## Features

- **8 Core Trading Tools**: Portfolio management, quotes, fundamentals, news, history, trade simulation, execution, and logging
- **Deterministic Stub Mode**: Safe testing with realistic but fake data
- **Comprehensive Audit Logging**: All tool calls logged with request/response hashes
- **MCP Protocol Compliance**: Full Model Context Protocol implementation
- **Type Safety**: Complete TypeScript implementation with Zod validation
- **HTTP + MCP Endpoints**: Both REST API and MCP protocol support

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp ../.env.example ../.env

# Start in development mode
npm run dev
```

### Environment Variables

The server reads from the repo root `.env` file. Key variables:

```bash
# Server configuration
PORT=3000
NODE_ENV=development
STUB_MODE=true  # Default to stub mode for safety

# Sponsor tool APIs (optional in stub mode)
AIRIA_API_KEY=your_key
TRUEFOUNDRY_API_KEY=your_key
APIFY_TOKEN=your_token
SENTRY_DSN=your_dsn
```

## Available Tools

### 1. Portfolio Management
- `get_portfolio(user_id?)` - Get current portfolio positions and values

### 2. Market Data
- `get_quotes(symbols, fields?)` - Get real-time stock quotes
- `get_fundamentals(symbols, metrics?)` - Get fundamental analysis data
- `get_news(symbols, hours_back?)` - Get relevant news and sentiment
- `get_history(symbol, period, interval?)` - Get historical price data

### 3. Trading Operations
- `trade_simulate(trades)` - Simulate trades without execution
- `trade_execute(trades)` - Execute trades (simulation only in STUB_MODE)

### 4. Monitoring
- `log_event(event_type, data, severity?)` - Log events for audit

## API Endpoints

### HTTP REST API

```bash
# Health check
GET /health

# MCP manifest
GET /mcp/manifest

# List tools
GET /mcp/tools

# Call a tool
POST /mcp/tools/{toolName}
Content-Type: application/json
{
  "symbols": ["AAPL", "TSLA"],
  "fields": ["price", "volume"]
}
```

### MCP Protocol

The server also supports the Model Context Protocol over stdio:

```bash
# Start MCP server
node dist/index.js
```

## Stub Mode

When `STUB_MODE=true` (default), the server generates deterministic test data:

- **Portfolio**: Realistic positions with calculated weights
- **Quotes**: Base prices with small random variations
- **Fundamentals**: Complete fundamental metrics (P/E, PEG, ROIC, etc.)
- **News**: 6-10 headlines per symbol with sentiment scores
- **History**: OHLC data with realistic price movements
- **Trades**: Simulated execution with fees and slippage

## Data Schemas

All tools return consistent JSON responses:

```typescript
// Success response
{
  "tool_call_id": "uuid-v4",
  "data": { /* tool-specific data */ },
  "source_refs": ["uuid-v4"]
}

// Error response
{
  "tool_call_id": "uuid-v4",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Audit Logging

All tool calls are logged to `runtime_logs/YYYY-MM-DD/*.jsonl` with:

- Request/response data with SHA-256 hashes
- Execution duration
- Error details (if any)
- Timestamps and tool call IDs

## Development

### Scripts

```bash
npm run dev          # Start with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm run typecheck    # Type check without emit
npm run lint         # ESLint
npm run test         # Run tests
npm run test:watch   # Watch mode tests
npm run test:coverage # Coverage report
```

### Project Structure

```
backend/
├── src/
│   ├── index.ts           # HTTP server + MCP endpoints
│   ├── mcp.ts             # MCP server configuration
│   ├── env.ts             # Environment configuration
│   ├── lib/
│   │   ├── uuid.ts        # Tool call ID generation
│   │   ├── audit.ts       # JSONL audit logger
│   │   └── schema.ts      # Zod schemas
│   └── tools/
│       ├── get_portfolio.ts
│       ├── get_quotes.ts
│       ├── get_fundamentals.ts
│       ├── get_news.ts
│       ├── get_history.ts
│       ├── trade_simulate.ts
│       ├── trade_execute.ts
│       └── log_event.ts
├── runtime_logs/          # Audit logs
├── package.json
├── tsconfig.json
└── README.md
```

## Safety Features

- **No Real Trading**: `trade_execute` only simulates in STUB_MODE
- **Input Validation**: All inputs validated with Zod schemas
- **Error Handling**: Comprehensive error catching and logging
- **Audit Trail**: Complete logging of all operations
- **Type Safety**: Full TypeScript coverage

## Integration

### With FinSage Agent

The MCP server is designed to be used by the FinSage AI agent through the Model Context Protocol. The agent can:

1. Discover available tools via the manifest
2. Call tools with structured inputs
3. Receive consistent JSON responses
4. Track all operations via source references

### With External Systems

The HTTP API allows integration with:

- Web dashboards
- Mobile applications
- Other microservices
- Monitoring systems

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific tool
npm test -- get_portfolio

# Test MCP protocol
npm test -- mcp
```

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment

```bash
# Production environment
NODE_ENV=production
STUB_MODE=false
PORT=3000

# Required for live mode
AIRIA_API_KEY=your_key
TRUEFOUNDRY_API_KEY=your_key
APIFY_TOKEN=your_token
SENTRY_DSN=your_dsn
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run linting and tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
