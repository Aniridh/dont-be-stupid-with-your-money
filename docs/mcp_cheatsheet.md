# MCP (Model Context Protocol) Cheatsheet

## What is MCP?

The Model Context Protocol (MCP) is a standard for connecting AI assistants to data sources and tools. It provides a consistent way for language models to access external capabilities through a well-defined interface.

## Why Use MCP?

- **Consistency**: Standardized way to expose tools to LLMs
- **Security**: Controlled access to external resources
- **Flexibility**: Easy to add new tools and capabilities
- **Interoperability**: Works with any MCP-compatible client
- **Auditability**: Clear logging of tool usage and results

## Core Concepts

### 1. MCP Server
A service that exposes tools and resources to MCP clients (LLMs).

### 2. MCP Client
The LLM or application that consumes MCP servers.

### 3. Tools
Functions that the LLM can call to perform actions.

### 4. Resources
Data sources that the LLM can read from.

## Basic MCP Server Implementation

### 1. Python Implementation
```python
# mcp_server.py
import asyncio
from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent
from typing import Any, Sequence

app = Server("finsage-mcp-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="get_portfolio",
            description="Get current portfolio positions and values",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "User ID to get portfolio for"
                    }
                },
                "required": ["user_id"]
            }
        ),
        Tool(
            name="get_quotes",
            description="Get real-time stock quotes",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbols": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of stock symbols"
                    },
                    "fields": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Data fields to retrieve"
                    }
                },
                "required": ["symbols"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> Sequence[TextContent]:
    """Handle tool calls"""
    if name == "get_portfolio":
        user_id = arguments["user_id"]
        portfolio = await get_portfolio_data(user_id)
        return [TextContent(type="text", text=portfolio)]
    
    elif name == "get_quotes":
        symbols = arguments["symbols"]
        fields = arguments.get("fields", ["price", "volume"])
        quotes = await get_quote_data(symbols, fields)
        return [TextContent(type="text", text=quotes)]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

async def get_portfolio_data(user_id: str) -> str:
    """Fetch portfolio data"""
    # Implementation here
    return '{"portfolio": {...}}'

async def get_quote_data(symbols: list[str], fields: list[str]) -> str:
    """Fetch quote data"""
    # Implementation here
    return '{"quotes": [...]}'

if __name__ == "__main__":
    asyncio.run(app.run())
```

### 2. TypeScript Implementation
```typescript
// mcp_server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

class FinSageMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'finsage-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
            required: ['user_id'],
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
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_portfolio':
          const portfolio = await this.getPortfolioData(args.user_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(portfolio),
              },
            ],
          };

        case 'get_quotes':
          const quotes = await this.getQuoteData(args.symbols, args.fields);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(quotes),
              },
            ],
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async getPortfolioData(userId: string): Promise<any> {
    // Implementation here
    return { portfolio: {} };
  }

  private async getQuoteData(symbols: string[], fields: string[]): Promise<any> {
    // Implementation here
    return { quotes: [] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new FinSageMCPServer();
server.run().catch(console.error);
```

## MCP Client Usage

### 1. Python Client
```python
# mcp_client.py
from mcp.client import Client

async def main():
    client = Client("localhost", 8000)
    
    # List available tools
    tools = await client.list_tools()
    print(f"Available tools: {[tool.name for tool in tools]}")
    
    # Call a tool
    result = await client.call_tool(
        "get_portfolio",
        {"user_id": "user_123"}
    )
    print(f"Portfolio: {result}")

if __name__ == "__main__":
    asyncio.run(main())
```

### 2. TypeScript Client
```typescript
// mcp_client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const transport = new StdioClientTransport();
  const client = new Client(
    {
      name: 'finsage-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools.tools.map(t => t.name));

  // Call a tool
  const result = await client.callTool({
    name: 'get_portfolio',
    arguments: { user_id: 'user_123' }
  });
  console.log('Portfolio:', result);
}

main().catch(console.error);
```

## FinSage MCP Tools

### 1. Portfolio Management
```python
@app.call_tool()
async def get_portfolio(tool_call_id: str, user_id: str) -> dict:
    """Get portfolio data with source references"""
    portfolio = await fetch_portfolio(user_id)
    return {
        "portfolio": portfolio,
        "source_refs": [tool_call_id]
    }

@app.call_tool()
async def update_portfolio(tool_call_id: str, user_id: str, changes: dict) -> dict:
    """Update portfolio positions"""
    result = await apply_portfolio_changes(user_id, changes)
    return {
        "updated": result,
        "source_refs": [tool_call_id]
    }
```

### 2. Market Data
```python
@app.call_tool()
async def get_quotes(tool_call_id: str, symbols: list[str], fields: list[str] = None) -> dict:
    """Get real-time quotes"""
    quotes = await fetch_quotes(symbols, fields or ["price", "volume"])
    return {
        "quotes": quotes,
        "source_refs": [tool_call_id]
    }

@app.call_tool()
async def get_fundamentals(tool_call_id: str, symbols: list[str], metrics: list[str] = None) -> dict:
    """Get fundamental analysis data"""
    fundamentals = await fetch_fundamentals(symbols, metrics)
    return {
        "fundamentals": fundamentals,
        "source_refs": [tool_call_id]
    }
```

### 3. Trading Operations
```python
@app.call_tool()
async def trade_simulate(tool_call_id: str, trades: list[dict]) -> dict:
    """Simulate trades without execution"""
    simulation = await simulate_trades(trades)
    return {
        "simulation": simulation,
        "source_refs": [tool_call_id]
    }

@app.call_tool()
async def trade_execute(tool_call_id: str, trades: list[dict]) -> dict:
    """Execute trades (if authorized)"""
    execution = await execute_trades(trades)
    return {
        "execution": execution,
        "source_refs": [tool_call_id]
    }
```

## Error Handling

### 1. Tool Error Responses
```python
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> dict:
    try:
        result = await execute_tool(name, arguments)
        return {
            "content": [TextContent(type="text", text=result)],
            "isError": False
        }
    except Exception as e:
        return {
            "content": [TextContent(type="text", text=f"Error: {str(e)}")],
            "isError": True
        }
```

### 2. Validation
```python
def validate_tool_input(tool_name: str, arguments: dict) -> None:
    """Validate tool input parameters"""
    if tool_name == "get_portfolio":
        if "user_id" not in arguments:
            raise ValueError("user_id is required")
        if not isinstance(arguments["user_id"], str):
            raise ValueError("user_id must be a string")
    
    elif tool_name == "get_quotes":
        if "symbols" not in arguments:
            raise ValueError("symbols is required")
        if not isinstance(arguments["symbols"], list):
            raise ValueError("symbols must be a list")
```

## Security Considerations

### 1. Input Sanitization
```python
def sanitize_input(data: dict) -> dict:
    """Remove sensitive data from input"""
    sanitized = data.copy()
    
    # Remove sensitive fields
    sensitive_keys = ['password', 'api_key', 'secret', 'token']
    for key in sensitive_keys:
        sanitized.pop(key, None)
    
    return sanitized
```

### 2. Rate Limiting
```python
from collections import defaultdict
import time

class RateLimiter:
    def __init__(self, max_calls: int, window: int):
        self.max_calls = max_calls
        self.window = window
        self.calls = defaultdict(list)
    
    def is_allowed(self, key: str) -> bool:
        now = time.time()
        # Remove old calls
        self.calls[key] = [call_time for call_time in self.calls[key] 
                          if now - call_time < self.window]
        
        # Check if under limit
        if len(self.calls[key]) < self.max_calls:
            self.calls[key].append(now)
            return True
        return False

rate_limiter = RateLimiter(max_calls=100, window=60)  # 100 calls per minute
```

## Testing MCP Tools

### 1. Unit Tests
```python
# test_mcp_tools.py
import pytest
from mcp_server import call_tool

@pytest.mark.asyncio
async def test_get_portfolio():
    result = await call_tool("get_portfolio", {"user_id": "test_user"})
    assert "portfolio" in result
    assert "source_refs" in result
    assert result["source_refs"] == ["test_call_id"]

@pytest.mark.asyncio
async def test_get_quotes():
    result = await call_tool("get_quotes", {
        "symbols": ["AAPL", "TSLA"],
        "fields": ["price", "volume"]
    })
    assert "quotes" in result
    assert len(result["quotes"]) == 2
```

### 2. Integration Tests
```python
# test_mcp_integration.py
import asyncio
from mcp.client import Client

async def test_mcp_integration():
    client = Client("localhost", 8000)
    
    # Test tool listing
    tools = await client.list_tools()
    assert len(tools) > 0
    
    # Test tool execution
    result = await client.call_tool("get_portfolio", {"user_id": "test"})
    assert result is not None
```

## Deployment

### 1. Docker Configuration
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "mcp_server.py"]
```

### 2. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  mcp-server:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SENTRY_DSN=${SENTRY_DSN}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
```

## Resources

- [MCP Specification](https://modelcontextprotocol.io/docs/develop/build-client)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
