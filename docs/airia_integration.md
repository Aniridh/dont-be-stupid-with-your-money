# Airia Integration Guide

## Overview

Airia provides the orchestration layer for FinSage, managing agent workflows, policy enforcement, and real-time event processing. This guide covers setting up and integrating with the Airia platform.

## Platform Setup

### 1. Create Airia Account
1. Visit [Airia Platform](https://airia.com/ai-platform/)
2. Sign up for a developer account
3. Generate API key from dashboard
4. Add to `.env` file: `AIRIA_API_KEY=your_key_here`

### 2. Create FinSage Agent
```bash
curl -X POST https://api.airia.ai/v1/agents \
  -H "Authorization: Bearer $AIRIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "finsage-agent",
    "description": "Autonomous trading and portfolio monitoring agent",
    "type": "financial_advisor",
    "capabilities": ["market_analysis", "portfolio_management", "risk_assessment"]
  }'
```

### 3. Configure Agent Workflow
```json
{
  "workflow": {
    "triggers": [
      {
        "type": "webhook",
        "endpoint": "/webhook/market-data",
        "conditions": ["market_open", "new_data_available"]
      },
      {
        "type": "schedule",
        "cron": "0 */15 * * * 1-5",
        "timezone": "America/New_York"
      }
    ],
    "steps": [
      {
        "name": "data_ingestion",
        "type": "apify_connector",
        "config": {
          "actor_id": "yahoo-finance-scraper",
          "input": {
            "symbols": ["AAPL", "TSLA", "SPY"],
            "fields": ["price", "volume", "change"]
          }
        }
      },
      {
        "name": "signal_processing",
        "type": "llm_processor",
        "config": {
          "model": "gemini-pro",
          "prompt_template": "system_finsage.md",
          "tools": ["get_portfolio", "get_quotes", "get_fundamentals"]
        }
      },
      {
        "name": "risk_check",
        "type": "policy_engine",
        "config": {
          "rules": [
            "max_position_size: 0.1",
            "max_sector_weight: 0.3",
            "stop_loss: 0.05"
          ]
        }
      },
      {
        "name": "action_execution",
        "type": "conditional",
        "conditions": ["mode == SUGGEST"],
        "actions": ["log_suggestion", "send_alert"]
      }
    ]
  }
}
```

## Policy Configuration

### Risk Management Policies
```json
{
  "policies": {
    "risk_limits": {
      "max_single_position_pct": 0.1,
      "max_sector_pct": 0.3,
      "max_portfolio_var": 0.05,
      "max_drawdown": 0.15
    },
    "execution_policy": {
      "can_auto_trade": false,
      "requires_approval": true,
      "max_trade_size": 10000,
      "allowed_actions": ["buy", "sell"]
    },
    "data_quality": {
      "min_confidence_threshold": 0.7,
      "max_data_age_minutes": 15,
      "require_source_verification": true
    }
  }
}
```

### Constraint Engine
```json
{
  "constraints": {
    "trading_hours": {
      "enabled": true,
      "timezone": "America/New_York",
      "start": "09:30",
      "end": "16:00"
    },
    "excluded_symbols": ["PENNY_STOCKS", "CRYPTO"],
    "esg_filters": {
      "exclude_controversial": true,
      "min_esg_score": 60
    },
    "tax_considerations": {
      "avoid_wash_sales": true,
      "prefer_long_term_gains": true
    }
  }
}
```

## Webhook Integration

### 1. Set Up Webhook Endpoint
```javascript
app.post('/webhook/market-data', async (req, res) => {
  const { event_type, data, timestamp } = req.body;
  
  try {
    // Process incoming market data
    const signals = await processMarketData(data);
    
    // Apply risk constraints
    const filteredSignals = await applyRiskConstraints(signals);
    
    // Generate suggestions
    const suggestions = await generateSuggestions(filteredSignals);
    
    // Log event
    await logEvent('market_data_processed', {
      event_type,
      signals_count: signals.length,
      suggestions_count: suggestions.length
    });
    
    res.json({ status: 'success', processed: true });
  } catch (error) {
    await logEvent('webhook_error', { error: error.message }, 'high');
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

### 2. Configure Airia Webhook
```bash
curl -X POST https://api.airia.ai/v1/webhooks \
  -H "Authorization: Bearer $AIRIA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "finsage-market-data",
    "url": "https://your-domain.com/webhook/market-data",
    "events": ["market_data_update", "signal_detected", "trade_executed"],
    "secret": "your_webhook_secret"
  }'
```

## Event Processing

### Real-time Event Flow
1. **Market Data Event**: Apify sends new data to Airia webhook
2. **Agent Processing**: Airia routes to FinSage agent workflow
3. **Signal Detection**: Agent analyzes data using signal library
4. **Policy Check**: Risk constraints and execution policies applied
5. **Action Generation**: Suggestions or trades generated based on mode
6. **Output Routing**: Results sent to configured endpoints

### Event Types
```typescript
interface MarketDataEvent {
  type: 'quote_update' | 'news_alert' | 'earnings_announcement';
  symbol: string;
  data: any;
  timestamp: string;
  source: string;
}

interface SignalEvent {
  type: 'signal_detected' | 'signal_expired';
  symbol: string;
  signal_type: string;
  confidence: number;
  metadata: Record<string, any>;
}

interface ActionEvent {
  type: 'suggestion' | 'trade_executed' | 'alert';
  action: string;
  symbol: string;
  details: any;
  risk_assessment: any;
}
```

## Monitoring and Observability

### Agent Health Checks
```bash
curl -X GET https://api.airia.ai/v1/agents/finsage-agent/health \
  -H "Authorization: Bearer $AIRIA_API_KEY"
```

### Performance Metrics
- **Processing Latency**: Time from data receipt to action generation
- **Signal Accuracy**: Percentage of correct signal predictions
- **Risk Compliance**: Adherence to risk limits and constraints
- **Error Rate**: Failed processing attempts per hour

### Alerting Configuration
```json
{
  "alerts": [
    {
      "condition": "error_rate > 0.05",
      "severity": "high",
      "channels": ["slack", "email"]
    },
    {
      "condition": "processing_latency > 30s",
      "severity": "medium",
      "channels": ["slack"]
    },
    {
      "condition": "risk_limit_breach",
      "severity": "critical",
      "channels": ["slack", "email", "sms"]
    }
  ]
}
```

## API Reference

### Agent Management
- **Create Agent**: `POST /v1/agents`
- **Update Agent**: `PUT /v1/agents/{id}`
- **Get Agent Status**: `GET /v1/agents/{id}/status`
- **Delete Agent**: `DELETE /v1/agents/{id}`

### Workflow Management
- **Create Workflow**: `POST /v1/workflows`
- **Execute Workflow**: `POST /v1/workflows/{id}/execute`
- **Get Execution History**: `GET /v1/workflows/{id}/executions`

### Policy Management
- **Create Policy**: `POST /v1/policies`
- **Update Policy**: `PUT /v1/policies/{id}`
- **Validate Policy**: `POST /v1/policies/validate`

For complete API documentation, visit [Airia API Docs](https://api.airia.ai/docs/).
