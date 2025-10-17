# FinSage Architecture

## End-to-End Data Flow

```
Market Sources → Apify Scrapers → (Optional Redpanda) → Airia Agent → TrueFoundry Gateway → Actions → Sentry Monitoring
     ↓              ↓                    ↓                ↓              ↓                ↓           ↓
Yahoo Finance   Real-time data      Event streaming   Orchestration   Model hosting   Slack/Logs   Observability
Google Finance  News aggregation    Message queue    Policy engine   API gateway    Tickets      Error tracking
News APIs       Fundamentals       Event sourcing    Constraints     Load balancing  Alerts       Performance
```

## Core Components

### 1. Data Ingestion Layer (Apify)
- **Yahoo Finance Actor**: Scrapes quotes, fundamentals, news
- **Google Finance Actor**: Backup quote data, additional metrics
- **News Aggregator**: Multiple news sources, sentiment analysis
- **Scheduler**: Configurable polling intervals (1min-1hour)

### 2. Event Streaming (Optional Redpanda)
- **Topic**: `market-data` - Raw market data
- **Topic**: `signals` - Processed signals and alerts
- **Topic**: `actions` - Executed trades and recommendations
- **Schema Registry**: Avro schemas for data consistency

### 3. Agent Orchestration (Airia)
- **FinSage Agent**: Core decision-making logic
- **Policy Engine**: Risk limits, execution constraints
- **Workflow Management**: MONITOR/SUGGEST/EXECUTE/BACKTEST modes
- **Webhook Integration**: Real-time event processing

### 4. Model Hosting (TrueFoundry)
- **AI Gateway**: LLM inference with governance
- **MCP Server**: Tool exposure to language models
- **Load Balancing**: High availability and scaling
- **API Management**: Rate limiting, authentication

### 5. Observability (Sentry)
- **Error Tracking**: Runtime exceptions and failures
- **Performance Monitoring**: Response times, throughput
- **Custom Metrics**: Signal accuracy, trade performance
- **Alerting**: Critical failures and anomalies

## Autonomy Loop

1. **Data Collection**: Apify scrapers gather market data
2. **Signal Processing**: Airia agent analyzes data using signal library
3. **Decision Making**: Apply risk constraints and generate suggestions
4. **Action Execution**: Execute trades (if EXECUTE mode) or log suggestions
5. **Monitoring**: Sentry tracks performance and errors
6. **Learning**: Update signal weights based on outcomes
7. **Feedback**: User feedback improves future decisions

## Safety Guards

- **EXECUTE Policy**: Only trades when explicitly enabled
- **Risk Limits**: Position sizing, sector caps, stop losses
- **Audit Trail**: Every decision logged with source references
- **Circuit Breakers**: Automatic shutdown on excessive losses
- **Manual Override**: Human intervention at any time

## Scalability Considerations

- **Horizontal Scaling**: Multiple agent instances via Airia
- **Data Partitioning**: Symbol-based data sharding
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Respect API limits and costs
- **Fault Tolerance**: Graceful degradation on service failures
