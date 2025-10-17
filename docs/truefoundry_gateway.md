# TrueFoundry AI Gateway Integration

## Overview

TrueFoundry AI Gateway provides the model hosting and API management layer for FinSage, enabling secure, scalable, and observable LLM inference with built-in governance features.

## Platform Setup

### 1. TrueFoundry Account Setup
1. Visit [TrueFoundry Platform](https://app.truefoundry.com/)
2. Create account and workspace
3. Generate API key from settings
4. Add to `.env` file: `TRUEFOUNDRY_API_KEY=your_key_here`

### 2. AI Gateway Configuration
```bash
curl -X POST https://api.truefoundry.com/v1/gateways \
  -H "Authorization: Bearer $TRUEFOUNDRY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "finsage-gateway",
    "description": "AI Gateway for FinSage trading agent",
    "model_provider": "google",
    "model_name": "gemini-pro",
    "endpoint_type": "mcp_server"
  }'
```

## MCP Server Deployment

### 1. Create MCP Server
```python
# mcp_server.py
import asyncio
from mcp.server import Server
from mcp.types import Tool, TextContent
from finsage_tools import get_portfolio, get_quotes, get_fundamentals

app = Server("finsage-mcp-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_portfolio",
            description="Get current portfolio positions and values",
            inputSchema={
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User ID"}
                }
            }
        ),
        Tool(
            name="get_quotes",
            description="Get real-time stock quotes",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbols": {"type": "array", "items": {"type": "string"}},
                    "fields": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["symbols"]
            }
        ),
        Tool(
            name="get_fundamentals",
            description="Get fundamental analysis data",
            inputSchema={
                "type": "object",
                "properties": {
                    "symbols": {"type": "array", "items": {"type": "string"}},
                    "metrics": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["symbols"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "get_portfolio":
        result = await get_portfolio(arguments.get("user_id"))
        return [TextContent(type="text", text=result)]
    elif name == "get_quotes":
        result = await get_quotes(arguments["symbols"], arguments.get("fields"))
        return [TextContent(type="text", text=result)]
    elif name == "get_fundamentals":
        result = await get_fundamentals(arguments["symbols"], arguments.get("metrics"))
        return [TextContent(type="text", text=result)]
    else:
        raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    asyncio.run(app.run())
```

### 2. Deploy to TrueFoundry
```yaml
# truefoundry.yaml
name: finsage-mcp-server
version: 1.0.0
resources:
  cpu: 1000m
  memory: 2Gi
  replicas: 2
services:
  - name: mcp-server
    image: finsage-mcp:latest
    port: 8000
    env:
      - name: TRUEFOUNDRY_API_KEY
        valueFrom:
          secretKeyRef:
            name: finsage-secrets
            key: truefoundry-api-key
    healthCheck:
      path: /health
      port: 8000
```

```bash
# Deploy using TrueFoundry CLI
tfy service deploy truefoundry.yaml
```

## Gateway Configuration

### 1. Model Configuration
```json
{
  "model": {
    "provider": "google",
    "name": "gemini-pro",
    "version": "1.0",
    "parameters": {
      "temperature": 0.1,
      "max_tokens": 4096,
      "top_p": 0.9
    }
  },
  "routing": {
    "strategy": "round_robin",
    "timeout": 30,
    "retry_attempts": 3
  },
  "rate_limiting": {
    "requests_per_minute": 100,
    "burst_limit": 20
  }
}
```

### 2. Security Configuration
```json
{
  "authentication": {
    "type": "api_key",
    "header_name": "X-API-Key",
    "required": true
  },
  "authorization": {
    "enabled": true,
    "policies": [
      {
        "resource": "finsage-tools",
        "actions": ["read", "write"],
        "conditions": ["user_role == trader"]
      }
    ]
  },
  "cors": {
    "allowed_origins": ["https://finsage.app"],
    "allowed_methods": ["GET", "POST"],
    "allowed_headers": ["Content-Type", "Authorization"]
  }
}
```

## Observability Features

### 1. Request Logging
```python
import logging
from truefoundry_sdk import TrueFoundryLogger

logger = TrueFoundryLogger(
    project_name="finsage",
    service_name="mcp-server",
    environment="production"
)

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    start_time = time.time()
    
    try:
        result = await execute_tool(name, arguments)
        
        logger.log_metric(
            "tool_execution_duration",
            time.time() - start_time,
            tags={"tool_name": name}
        )
        
        logger.log_event(
            "tool_executed",
            {
                "tool_name": name,
                "arguments": arguments,
                "success": True
            }
        )
        
        return result
        
    except Exception as e:
        logger.log_error(
            "tool_execution_failed",
            {
                "tool_name": name,
                "error": str(e),
                "arguments": arguments
            }
        )
        raise
```

### 2. Performance Monitoring
```python
# Monitor key metrics
metrics = {
    "request_count": "Number of API requests per minute",
    "response_time": "Average response time in milliseconds",
    "error_rate": "Percentage of failed requests",
    "tool_usage": "Usage frequency of each tool",
    "model_tokens": "Token consumption for LLM calls"
}

# Set up alerts
alerts = [
    {
        "metric": "response_time",
        "threshold": 5000,  # 5 seconds
        "severity": "warning"
    },
    {
        "metric": "error_rate",
        "threshold": 0.05,  # 5%
        "severity": "critical"
    }
]
```

### 3. Cost Tracking
```python
# Track model usage and costs
def track_model_usage(prompt_tokens: int, completion_tokens: int, model: str):
    cost = calculate_cost(prompt_tokens, completion_tokens, model)
    
    logger.log_metric(
        "model_cost_usd",
        cost,
        tags={
            "model": model,
            "tokens": prompt_tokens + completion_tokens
        }
    )
```

## Governance Features

### 1. Content Filtering
```python
from truefoundry_sdk import ContentFilter

content_filter = ContentFilter(
    policies=[
        "no_financial_advice",
        "no_personal_information",
        "no_insider_trading"
    ]
)

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    # Filter input content
    filtered_args = content_filter.filter(arguments)
    
    # Execute tool
    result = await execute_tool(name, filtered_args)
    
    # Filter output content
    filtered_result = content_filter.filter(result)
    
    return filtered_result
```

### 2. Audit Logging
```python
# All tool calls are automatically logged
audit_log = {
    "timestamp": "2024-01-15T14:30:00Z",
    "user_id": "user_123",
    "tool_name": "get_portfolio",
    "arguments": {"user_id": "user_123"},
    "result": {"portfolio": {...}},
    "execution_time_ms": 150,
    "model_tokens_used": 1200,
    "cost_usd": 0.002
}
```

### 3. Data Privacy
```python
# PII detection and masking
from truefoundry_sdk import PIIMasker

pii_masker = PIIMasker(
    mask_patterns=[
        "ssn", "credit_card", "bank_account", "email"
    ]
)

def sanitize_data(data: dict) -> dict:
    return pii_masker.mask(data)
```

## API Usage

### 1. Direct API Calls
```bash
curl -X POST https://finsage-gateway.truefoundry.com/v1/chat/completions \
  -H "Authorization: Bearer $TRUEFOUNDRY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-pro",
    "messages": [
      {
        "role": "system",
        "content": "You are FinSage, a trading agent..."
      },
      {
        "role": "user",
        "content": "Analyze AAPL and suggest actions"
      }
    ],
    "tools": ["get_portfolio", "get_quotes", "get_fundamentals"]
  }'
```

### 2. MCP Client Integration
```python
from mcp.client import Client

async def main():
    client = Client("finsage-gateway.truefoundry.com", 8000)
    
    # List available tools
    tools = await client.list_tools()
    print(f"Available tools: {[tool.name for tool in tools]}")
    
    # Call a tool
    result = await client.call_tool(
        "get_portfolio",
        {"user_id": "user_123"}
    )
    print(f"Portfolio: {result}")
```

## Scaling and Performance

### 1. Auto-scaling Configuration
```yaml
scaling:
  min_replicas: 2
  max_replicas: 10
  target_cpu_utilization: 70
  target_memory_utilization: 80
  scale_up_cooldown: 60s
  scale_down_cooldown: 300s
```

### 2. Load Balancing
```yaml
load_balancer:
  type: "round_robin"
  health_check:
    path: "/health"
    interval: 30s
    timeout: 5s
  sticky_sessions: false
```

### 3. Caching Strategy
```python
from truefoundry_sdk import Cache

cache = Cache(
    ttl=300,  # 5 minutes
    max_size=1000
)

@cache.memoize
async def get_quotes(symbols: list[str]) -> dict:
    # Expensive API call
    return await yahoo_finance.get_quotes(symbols)
```

For complete documentation, visit [TrueFoundry AI Gateway Docs](https://docs.truefoundry.com/gateway/intro-to-llm-gateway).
