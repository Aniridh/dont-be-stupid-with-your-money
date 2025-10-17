# FinSage — Autonomous, Cautious Trading & Portfolio Monitoring Agent

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Built with Airia + Apify + TrueFoundry + Sentry](https://img.shields.io/badge/Built%20with-Airia%20%2B%20Apify%20%2B%20TrueFoundry%20%2B%20Sentry-blue.svg)](https://github.com/your-username/finsage-agent)
[![Hackathon Winner-ready](https://img.shields.io/badge/Hackathon-Winner--ready-orange.svg)](https://devpost.com/software/finsage-agent)

## 60-Second Pitch

FinSage is an autonomous, data-driven trading and portfolio monitoring agent that helps retail investors make better financial decisions while protecting their capital. Unlike traditional trading bots that execute trades automatically, FinSage focuses on providing safe, auditable suggestions backed by comprehensive market analysis.

**What it does:** Monitors markets 24/7, detects trading signals using AI, and provides actionable but safe trade suggestions with complete audit trails.

**Who it helps:** Retail investors, portfolio managers, and financial advisors seeking systematic, evidence-based investment decisions.

**Autonomy loop:** Continuous data ingestion → AI signal detection → risk assessment → suggestion generation → user review → learning from outcomes.

## Why It's Different

- **Risk-First Philosophy**: Capital protection is the top priority, with built-in risk limits and stop-loss mechanisms
- **Auditable Decisions**: Every suggestion includes source references and clear rationale linking back to data sources
- **Strict JSON Output**: Deterministic, machine-readable responses that eliminate ambiguity
- **No Auto-Trading**: Never executes trades without explicit user permission, maintaining human oversight
- **Comprehensive Signal Library**: Technical indicators, fundamental analysis, news sentiment, and risk flags

## Sponsor Tool Usage

### [Airia](https://airia.com/ai-platform/) — Agent Orchestration
- **Purpose**: Orchestrates the entire FinSage workflow and enforces trading policies
- **Implementation**: Real-time event processing, webhook handling, and constraint enforcement
- **Value**: Provides the backbone for autonomous operation while maintaining safety controls
- **Documentation**: [Airia Integration Guide](docs/airia_integration.md)

### [Apify](https://docs.apify.com/) — Real-Time Data Scraping
- **Purpose**: Ingests live market data, news, and fundamental information
- **Implementation**: Yahoo Finance, Google Finance, and news source actors with scheduled runs
- **Value**: Ensures fresh, comprehensive market data for accurate signal detection
- **Documentation**: [Apify Pipeline Guide](docs/apify_pipeline.md)

### [TrueFoundry](https://docs.truefoundry.com/gateway/intro-to-llm-gateway) — AI Gateway
- **Purpose**: Hosts the MCP server and provides model inference with governance
- **Implementation**: Deploys FinSage's AI model behind TrueFoundry's AI Gateway
- **Value**: Enables scalable, secure, and observable AI inference with built-in compliance
- **Documentation**: [TrueFoundry Gateway Guide](docs/truefoundry_gateway.md)

### [Sentry](https://docs.sentry.io/platforms/javascript/) — Observability
- **Purpose**: Comprehensive error tracking, performance monitoring, and alerting
- **Implementation**: Custom error tracking, performance metrics, and business-specific monitoring
- **Value**: Ensures reliable operation and quick issue resolution in production
- **Documentation**: [Sentry Observability Guide](docs/sentry_observability.md)

### [Redpanda](https://docs.redpanda.com/current/get-started/quick-start/) — Event Streaming (Optional)
- **Purpose**: High-performance event streaming for real-time data processing
- **Implementation**: Message queues for market data, signals, and actions
- **Value**: Enables scalable, fault-tolerant data processing pipeline
- **Documentation**: [Architecture Overview](docs/architecture.md)

## Architecture & Data Flow

```
Market Sources → Apify Scrapers → (Optional Redpanda) → Airia Agent → TrueFoundry Gateway → Actions → Sentry Monitoring
     ↓              ↓                    ↓                ↓              ↓                ↓           ↓
Yahoo Finance   Real-time data      Event streaming   Orchestration   Model hosting   Slack/Logs   Observability
Google Finance  News aggregation    Message queue    Policy engine   API gateway    Tickets      Error tracking
News APIs       Fundamentals       Event sourcing    Constraints     Load balancing  Alerts       Performance
```

## Quickstart

### Environment Setup

| Mode | Required Keys | Purpose |
|------|---------------|---------|
| **STUB** | `STUB_MODE=true`<br>`NEXT_PUBLIC_BACKEND_URL` | Test with mock data |
| **LIVE** | `STUB_MODE=false`<br>`GEMINI_API_KEY` or `OPENAI_API_KEY`<br>`APIFY_TOKEN` + `APIFY_ACTOR_ID`<br>`SENTRY_DSN` | Full functionality with real APIs |
| **Optional** | `TRUEFOUNDRY_API_KEY`<br>`AIRIA_API_KEY`<br>`NEWS_API_KEY` | Enhanced features |

### Local Development

```bash
# Clone repository
git clone https://github.com/your-username/finsage-agent.git
cd finsage-agent

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Check environment status
npm run env:report

# Start all services
npm run dev:all
# This will start backend + frontend + run preflight check

# Or start individually
npm -w backend run dev    # Backend on :3001
npm -w frontend run dev   # Frontend on :3000
```

### Quick Verification

```bash
# Run environment report
npm run env:report

# Run preflight check (verifies end-to-end loop)
npm run preflight

# Open dashboard
open http://localhost:3000
```

### Cloud Deployment

```bash
# Deploy with Docker
docker-compose up -d

# Or deploy to your preferred cloud provider
# See docs/bootstrap.md for detailed instructions
```

### 3-Minute Demo

```bash
# Run the demo script
npm run demo
# or
python scripts/demo_controller.py

# Follow the 8-beat demo:
# 1. Problem statement (30s)
# 2. Architecture overview (30s) 
# 3. Live data ingestion (45s)
# 4. Signal detection (45s)
# 5. Safe suggestion mode (30s)
# 6. Observability dashboard (30s)
# 7. Feedback loop (30s)
# 8. Closing (30s)
```

## Configuration

### Default Configuration
```json
{
  "mode": "SUGGEST",
  "risk": {
    "max_single_position_pct": 0.1,
    "max_sector_pct": 0.3,
    "max_var_pct": 0.05,
    "max_drawdown": 0.15
  },
  "signals": {
    "valuation": {
      "pe_high": 35,
      "peg_low": 1.0,
      "ev_ebitda_high": 18
    }
  },
  "execution_policy": {
    "can_auto_trade": false,
    "requires_approval": true
  }
}
```

### Override Configuration
```bash
# Environment variables
export FINSAGE_MODE=MONITOR
export FINSAGE_MAX_POSITION=0.05
export FINSAGE_AUTO_TRADE=false

# Or via config file
echo '{"mode": "MONITOR"}' > config/local.json
```

## Tools API

### Core Trading Tools
- `get_portfolio(user_id)` — Get current portfolio positions and values
- `get_quotes(symbols, fields)` — Get real-time stock quotes
- `get_fundamentals(symbols, metrics)` — Get fundamental analysis data
- `get_news(symbols, hours_back)` — Get relevant news and sentiment
- `get_history(symbol, period, interval)` — Get historical price data
- `trade_simulate(trades)` — Simulate trades without execution
- `trade_execute(trades)` — Execute trades (if authorized)
- `log_event(type, data, severity)` — Log events for monitoring

### Source References Convention
Every tool call includes a unique `tool_call_id` that gets returned in the `source_refs` array, enabling complete auditability:

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

## MCP Overview

FinSage uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/develop/build-client) to expose tools consistently to language models. This provides:

- **Standardized Interface**: Consistent way to expose tools to LLMs
- **Security**: Controlled access to external resources
- **Auditability**: Clear logging of tool usage and results
- **Interoperability**: Works with any MCP-compatible client

See [MCP Cheatsheet](docs/mcp_cheatsheet.md) for implementation details.

## Backtesting

FinSage includes comprehensive backtesting capabilities:

```bash
# Run backtest
npm run backtest -- --symbol=AAPL --period=1y --strategy=momentum

# Backtest with custom parameters
npm run backtest -- --config=backtest_config.json
```

**Backtest Modes:**
- **Historical Simulation**: Test strategies against historical data
- **Walk-Forward Analysis**: Validate strategies across different time periods
- **Monte Carlo Simulation**: Assess strategy robustness under various scenarios

## Devpost Submission

### Submission Checklist
- [x] Short description (500 chars max)
- [x] Long description (3500 chars max)
- [x] Screenshots (3-5 images)
- [x] 3-minute demo video
- [x] Repository link
- [x] Sponsor tool usage documentation
- [x] Autonomy demonstration
- [x] Safety features explanation

### Judging Criteria Alignment
- **Idea (20%)**: Novel approach to AI-powered trading assistance
- **Technical (20%)**: Clean architecture, comprehensive error handling
- **Tool Use (20%)**: Effective integration of all sponsor tools
- **Presentation (20%)**: Clear demo, professional documentation
- **Autonomy (20%)**: Genuine autonomous operation with safety controls

See [Submission Checklist](devpost/submission_checklist.md) and [Judging Matrix](devpost/judging_matrix_alignment.md) for details.

## Security & Limits

### Safety Features
- **No Auto-Trading**: Never executes trades unless EXECUTE mode is explicitly enabled
- **Risk Limits**: Strict position sizing, sector caps, and stop-loss controls
- **Audit Trail**: Complete logging of all decisions and data sources
- **Human Oversight**: All suggestions require human review and approval

### Security Measures
- **API Authentication**: Secure access to all external services
- **Data Encryption**: Sensitive data encrypted in transit and at rest
- **Input Validation**: Comprehensive validation of all user inputs
- **Rate Limiting**: Protection against abuse and excessive usage

## Roadmap (Post-Hackathon)

### Phase 1: Core Features
- [ ] Advanced signal library expansion
- [ ] Multi-asset class support (bonds, commodities, crypto)
- [ ] Enhanced risk management tools
- [ ] Mobile application

### Phase 2: Intelligence
- [ ] Machine learning model improvements
- [ ] Sentiment analysis from social media
- [ ] Alternative data sources integration
- [ ] Advanced portfolio optimization

### Phase 3: Platform
- [ ] Multi-user support and collaboration
- [ ] Advanced analytics and reporting
- [ ] Third-party integrations (brokers, advisors)
- [ ] Enterprise features and compliance

## Contributing

We welcome contributions! Please see [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/your-username/finsage-agent.git
cd finsage-agent
npm install
cp .env.example .env
npm run dev
```

### Code Standards
- Follow existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Airia** for agent orchestration and workflow management
- **Apify** for real-time data scraping and aggregation
- **TrueFoundry** for AI Gateway and model hosting
- **Sentry** for comprehensive observability and monitoring
- **Anthropic** for the Model Context Protocol specification

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/finsage-agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/finsage-agent/discussions)
- **Email**: support@finsage.ai

---

**FinSage**: Your AI Trading Co-Pilot. Autonomous, cautious, data-driven. Built for the future of intelligent investing.