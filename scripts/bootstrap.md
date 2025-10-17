# FinSage Bootstrap Guide

## Prerequisites

- Node.js 18+ or Python 3.11+
- Git
- Docker (optional, for containerized deployment)
- Accounts for sponsor tools (Airia, Apify, TrueFoundry, Sentry)

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/finsage-agent.git
cd finsage-agent
```

### 2. Install Dependencies

#### Node.js Setup
```bash
npm install
# or
yarn install
```

#### Python Setup
```bash
pip install -r requirements.txt
# or
pipenv install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
# or
code .env
```

Required environment variables:
```bash
# Airia Configuration
AIRIA_API_KEY=your_airia_api_key
AIRIA_WEBHOOK_URL=https://your-domain.com/webhook/airia

# TrueFoundry Configuration
TRUEFOUNDRY_API_KEY=your_truefoundry_api_key
TRUEFOUNDRY_GATEWAY_URL=https://your-gateway.truefoundry.com

# Apify Configuration
APIFY_TOKEN=your_apify_token
APIFY_ACTOR_ID=your_actor_id

# Sentry Configuration
SENTRY_DSN=your_sentry_dsn

# Optional: News API
NEWS_API_KEY=your_news_api_key

# Optional: Redpanda
REDPANDA_BROKERS=localhost:19092
```

### 4. Database Setup
```bash
# Create database
createdb finsage_db

# Run migrations
npm run migrate
# or
python manage.py migrate
```

### 5. Start Services

#### Development Mode
```bash
# Start all services
npm run dev
# or
python main.py

# Or start individual services
npm run start:api
npm run start:worker
npm run start:scheduler
```

#### Docker Mode
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Sponsor Tool Setup

### 1. Airia Setup
1. Visit [Airia Platform](https://airia.com/ai-platform/)
2. Create account and generate API key
3. Create FinSage agent workflow
4. Configure webhook endpoints
5. Set up policy constraints

### 2. Apify Setup
1. Visit [Apify Console](https://console.apify.com/)
2. Create account and get API token
3. Deploy Yahoo Finance scraper actor
4. Deploy Google Finance scraper actor
5. Deploy news aggregator actor
6. Configure scheduling and webhooks

### 3. TrueFoundry Setup
1. Visit [TrueFoundry Platform](https://app.truefoundry.com/)
2. Create workspace and generate API key
3. Deploy MCP server
4. Configure AI Gateway
5. Set up monitoring and governance

### 4. Sentry Setup
1. Visit [Sentry Platform](https://sentry.io/)
2. Create project for FinSage
3. Get DSN from project settings
4. Configure error tracking and performance monitoring
5. Set up alerting rules

## Development Workflow

### 1. Code Structure
```
finsage-agent/
├── src/
│   ├── api/           # REST API endpoints
│   ├── agents/        # AI agent logic
│   ├── tools/         # MCP tools
│   ├── data/          # Data processing
│   ├── models/        # Data models
│   └── utils/         # Utility functions
├── tests/             # Test files
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── config/            # Configuration files
```

### 2. Running Tests
```bash
# Run all tests
npm test
# or
pytest

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
# or
pytest --cov=src
```

### 3. Code Quality
```bash
# Lint code
npm run lint
# or
flake8 src/

# Format code
npm run format
# or
black src/

# Type checking
npm run type-check
# or
mypy src/
```

### 4. Database Management
```bash
# Create migration
npm run migrate:create "add_portfolio_table"
# or
alembic revision -m "add_portfolio_table"

# Run migrations
npm run migrate:up
# or
alembic upgrade head

# Rollback migration
npm run migrate:down
# or
alembic downgrade -1
```

## Deployment

### 1. Production Environment
```bash
# Build production image
docker build -t finsage-agent:latest .

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale worker=3
```

### 2. Environment Variables
```bash
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
LOG_LEVEL=info

# Development environment
NODE_ENV=development
DATABASE_URL=postgresql://localhost/finsage_dev
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

### 3. Monitoring Setup
```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access monitoring dashboards
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
# Sentry: https://sentry.io/
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
pg_isready -h localhost -p 5432

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### 2. API Key Issues
```bash
# Verify environment variables
echo $AIRIA_API_KEY
echo $TRUEFOUNDRY_API_KEY
echo $APIFY_TOKEN
echo $SENTRY_DSN

# Test API connections
npm run test:connections
# or
python scripts/test_connections.py
```

#### 3. Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Kill processes using ports
kill -9 $(lsof -t -i:3000)
```

#### 4. Memory Issues
```bash
# Check memory usage
docker stats

# Increase memory limits
docker-compose up -d --scale worker=1
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG=finsage:*

# Start with debug mode
npm run dev:debug
# or
python -m debugpy --listen 5678 main.py
```

### Logs
```bash
# View application logs
docker-compose logs -f app

# View specific service logs
docker-compose logs -f worker
docker-compose logs -f scheduler

# View logs with timestamps
docker-compose logs -f -t app
```

## Contributing

### 1. Development Setup
```bash
# Fork repository
git clone https://github.com/your-username/finsage-agent.git
cd finsage-agent

# Create feature branch
git checkout -b feature/your-feature-name

# Install development dependencies
npm install --dev
# or
pip install -r requirements-dev.txt
```

### 2. Code Standards
- Follow existing code style and patterns
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

### 3. Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Run quality checks
4. Submit pull request
5. Address review feedback
6. Merge after approval

## Support

### Documentation
- [Architecture Guide](docs/architecture.md)
- [API Reference](docs/api.md)
- [Tool Signatures](docs/tool_signatures.md)
- [Sponsor Tool Integration](docs/)

### Community
- GitHub Issues: [Report bugs and request features](https://github.com/your-username/finsage-agent/issues)
- Discussions: [Ask questions and share ideas](https://github.com/your-username/finsage-agent/discussions)
- Discord: [Real-time chat and support](https://discord.gg/finsage)

### Professional Support
- Email: support@finsage.ai
- Documentation: https://docs.finsage.ai
- Status Page: https://status.finsage.ai
