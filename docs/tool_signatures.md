# Tool Signatures

## Core Trading Tools

### get_portfolio
```typescript
function get_portfolio(
  tool_call_id: string,
  user_id?: string
): Promise<{
  portfolio: {
    positions: Array<{
      symbol: string;
      quantity: number;
      avg_price: number;
      current_price: number;
      market_value: number;
      weight: number;
    }>;
    cash: number;
    total_value: number;
  };
  source_refs: string[];
}>
```

### get_quotes
```typescript
function get_quotes(
  tool_call_id: string,
  symbols: string[],
  fields?: string[]
): Promise<{
  quotes: Array<{
    symbol: string;
    price: number;
    change: number;
    change_percent: number;
    volume: number;
    timestamp: string;
  }>;
  source_refs: string[];
}>
```

### get_fundamentals
```typescript
function get_fundamentals(
  tool_call_id: string,
  symbols: string[],
  metrics?: string[]
): Promise<{
  fundamentals: Array<{
    symbol: string;
    pe_ratio: number;
    peg_ratio: number;
    ev_ebitda: number;
    roic: number;
    gross_margin: number;
    current_ratio: number;
    debt_to_equity: number;
    timestamp: string;
  }>;
  source_refs: string[];
}>
```

### get_news
```typescript
function get_news(
  tool_call_id: string,
  symbols: string[],
  hours_back?: number
): Promise<{
  news: Array<{
    symbol: string;
    headline: string;
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    impact_score: number;
    published_at: string;
    source: string;
  }>;
  source_refs: string[];
}>
```

### get_history
```typescript
function get_history(
  tool_call_id: string,
  symbol: string,
  period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max',
  interval?: '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo'
): Promise<{
  history: Array<{
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjusted_close: number;
  }>;
  source_refs: string[];
}>
```

### trade_simulate
```typescript
function trade_simulate(
  tool_call_id: string,
  trades: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    price?: number; // market order if not specified
  }>
): Promise<{
  simulation: {
    trades: Array<{
      symbol: string;
      action: string;
      quantity: number;
      price: number;
      fees: number;
      total_cost: number;
    }>;
    portfolio_after: {
      total_value: number;
      cash: number;
      positions: Array<{
        symbol: string;
        quantity: number;
        market_value: number;
        weight: number;
      }>;
    };
    risk_metrics: {
      var_95_1d: number;
      max_drawdown: number;
      sharpe_ratio: number;
    };
  };
  source_refs: string[];
}>
```

### trade_execute
```typescript
function trade_execute(
  tool_call_id: string,
  trades: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    order_type: 'market' | 'limit' | 'stop';
    price?: number;
    stop_price?: number;
  }>
): Promise<{
  execution: {
    trades: Array<{
      symbol: string;
      action: string;
      quantity: number;
      price: number;
      fees: number;
      total_cost: number;
      order_id: string;
      status: 'filled' | 'partial' | 'rejected';
    }>;
    portfolio_after: {
      total_value: number;
      cash: number;
    };
  };
  source_refs: string[];
}>
```

### log_event
```typescript
function log_event(
  tool_call_id: string,
  event_type: 'signal' | 'suggestion' | 'trade' | 'error' | 'alert',
  data: Record<string, any>,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): Promise<{
  logged: boolean;
  event_id: string;
  source_refs: string[];
}>
```

## Source References Convention

Every tool call must include a unique `tool_call_id` that gets returned in the `source_refs` array. This enables:

1. **Auditability**: Every fact can be traced back to its source
2. **Debugging**: Easy identification of which tool call produced which data
3. **Caching**: Avoid duplicate API calls with same parameters
4. **Performance**: Track which tools are slow or failing

Example:
```json
{
  "suggestions": [
    {
      "symbol": "AAPL",
      "signals": ["high_pe", "bearish_macd"],
      "source_refs": ["quote_001", "fundamental_002", "news_003"]
    }
  ]
}
```

## Error Handling

All tools return consistent error format:
```typescript
{
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  source_refs: string[];
}
```

Common error codes:
- `RATE_LIMITED`: API rate limit exceeded
- `INVALID_SYMBOL`: Symbol not found or invalid
- `INSUFFICIENT_FUNDS`: Not enough cash for trade
- `RISK_LIMIT_EXCEEDED`: Trade would violate risk constraints
- `MARKET_CLOSED`: Trading not available outside market hours
- `NETWORK_ERROR`: Connection or timeout issues
