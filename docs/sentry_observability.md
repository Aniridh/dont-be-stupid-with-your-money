# Sentry Observability Integration

## Overview

Sentry provides comprehensive error tracking, performance monitoring, and observability for FinSage, ensuring reliable operation and quick issue resolution in production environments.

## Platform Setup

### 1. Sentry Account Setup
1. Visit [Sentry Platform](https://sentry.io/)
2. Create project for FinSage
3. Get DSN from project settings
4. Add to `.env` file: `SENTRY_DSN=your_dsn_here`

### 2. Install Sentry SDK
```bash
# Node.js
npm install @sentry/node @sentry/profiling-node

# Python
pip install sentry-sdk

# Browser (if needed)
npm install @sentry/browser
```

## Error Tracking Setup

### 1. Node.js Integration
```javascript
// sentry.js
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
        nodeProfilingIntegration(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new Sentry.Integrations.Mongo({ useMongoose: true })
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    beforeSend(event) {
        // Filter out sensitive data
        if (event.request?.data) {
            delete event.request.data.apiKey;
            delete event.request.data.password;
        }
        return event;
    }
});

export default Sentry;
```

### 2. Python Integration
```python
# sentry_config.py
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "development"),
    integrations=[
        FlaskIntegration(),
        SqlalchemyIntegration(),
        RedisIntegration(),
    ],
    traces_sample_rate=1.0,
    profiles_sample_rate=1.0,
    before_send=filter_sensitive_data,
)

def filter_sensitive_data(event, hint):
    """Remove sensitive data from events"""
    if 'request' in event and 'data' in event['request']:
        sensitive_keys = ['api_key', 'password', 'token', 'secret']
        for key in sensitive_keys:
            event['request']['data'].pop(key, None)
    return event
```

## Custom Error Tracking

### 1. Trading Errors
```javascript
// trading-errors.js
import Sentry from './sentry.js';

export class TradingError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'TradingError';
        this.code = code;
        this.details = details;
    }
}

export function trackTradingError(error, context = {}) {
    Sentry.withScope(scope => {
        scope.setTag('error_type', 'trading');
        scope.setTag('error_code', error.code);
        scope.setContext('trading_context', {
            symbol: context.symbol,
            action: context.action,
            quantity: context.quantity,
            price: context.price,
            ...context
        });
        scope.setLevel('error');
        
        Sentry.captureException(error);
    });
}

// Usage examples
try {
    await executeTrade(symbol, action, quantity);
} catch (error) {
    trackTradingError(
        new TradingError('Trade execution failed', 'EXECUTION_FAILED', {
            symbol,
            action,
            quantity,
            originalError: error.message
        }),
        { symbol, action, quantity }
    );
    throw error;
}
```

### 2. Data Quality Errors
```javascript
// data-quality-errors.js
export function trackDataQualityError(error, data) {
    Sentry.withScope(scope => {
        scope.setTag('error_type', 'data_quality');
        scope.setContext('data_context', {
            symbol: data.symbol,
            source: data.source,
            timestamp: data.timestamp,
            dataType: data.type
        });
        scope.setLevel('warning');
        
        Sentry.captureException(error);
    });
}

// Usage
if (!isValidPrice(quote.price)) {
    trackDataQualityError(
        new Error('Invalid price data received'),
        { symbol: quote.symbol, source: 'yahoo_finance', type: 'quote' }
    );
}
```

### 3. API Integration Errors
```javascript
// api-errors.js
export function trackApiError(service, error, request) {
    Sentry.withScope(scope => {
        scope.setTag('service', service);
        scope.setTag('error_type', 'api_integration');
        scope.setContext('api_context', {
            url: request.url,
            method: request.method,
            statusCode: error.status,
            responseTime: request.duration
        });
        scope.setLevel('error');
        
        Sentry.captureException(error);
    });
}

// Usage
try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }
} catch (error) {
    trackApiError('yahoo_finance', error, {
        url: 'https://api.example.com/data',
        method: 'GET',
        duration: Date.now() - startTime
    });
}
```

## Performance Monitoring

### 1. Transaction Tracking
```javascript
// performance-tracking.js
import Sentry from './sentry.js';

export function trackTransaction(name, operation) {
    return Sentry.startTransaction({
        name,
        op: operation
    });
}

// Usage
const transaction = trackTransaction('portfolio_analysis', 'analysis');
try {
    const portfolio = await getPortfolio();
    const quotes = await getQuotes(portfolio.symbols);
    const signals = await analyzeSignals(portfolio, quotes);
    
    transaction.setData('portfolio_size', portfolio.positions.length);
    transaction.setData('signals_generated', signals.length);
    transaction.setStatus('ok');
} catch (error) {
    transaction.setStatus('internal_error');
    throw error;
} finally {
    transaction.finish();
}
```

### 2. Custom Metrics
```javascript
// custom-metrics.js
export function trackCustomMetric(name, value, tags = {}) {
    Sentry.addBreadcrumb({
        message: `Metric: ${name}`,
        data: { value, ...tags },
        level: 'info'
    });
    
    // Also send as custom event
    Sentry.captureMessage(`Metric: ${name} = ${value}`, {
        level: 'info',
        tags: { metric_name: name, ...tags },
        extra: { value }
    });
}

// Usage examples
trackCustomMetric('signal_accuracy', 0.85, { 
    time_period: '1h',
    signal_type: 'technical' 
});

trackCustomMetric('api_response_time', 150, { 
    service: 'yahoo_finance',
    endpoint: 'quotes' 
});

trackCustomMetric('portfolio_value', 125000, { 
    currency: 'USD',
    user_id: 'user_123' 
});
```

### 3. Database Query Monitoring
```javascript
// db-monitoring.js
import Sentry from './sentry.js';

export function monitorDbQuery(queryName, queryFn) {
    return async (...args) => {
        const span = Sentry.startSpan({
            name: `db.${queryName}`,
            op: 'db.query'
        });
        
        try {
            const result = await queryFn(...args);
            span.setData('rows_affected', result.length || 0);
            span.setStatus('ok');
            return result;
        } catch (error) {
            span.setStatus('internal_error');
            throw error;
        } finally {
            span.finish();
        }
    };
}

// Usage
const getPortfolio = monitorDbQuery('get_portfolio', async (userId) => {
    return await db.query('SELECT * FROM portfolio WHERE user_id = ?', [userId]);
});
```

## User Context and Breadcrumbs

### 1. User Context
```javascript
// user-context.js
export function setUserContext(user) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        // Don't include sensitive data
    });
}

export function setTradingContext(context) {
    Sentry.setContext('trading', {
        mode: context.mode, // MONITOR, SUGGEST, EXECUTE
        risk_tolerance: context.riskTolerance,
        portfolio_size: context.portfolioSize,
        active_symbols: context.activeSymbols
    });
}
```

### 2. Breadcrumbs
```javascript
// breadcrumbs.js
export function addTradingBreadcrumb(message, data = {}) {
    Sentry.addBreadcrumb({
        message,
        category: 'trading',
        data,
        level: 'info'
    });
}

export function addDataBreadcrumb(message, data = {}) {
    Sentry.addBreadcrumb({
        message,
        category: 'data',
        data,
        level: 'info'
    });
}

// Usage
addTradingBreadcrumb('Signal detected', {
    symbol: 'AAPL',
    signal_type: 'high_pe',
    confidence: 0.85
});

addDataBreadcrumb('Data received', {
    source: 'yahoo_finance',
    symbols: ['AAPL', 'TSLA'],
    data_points: 2
});
```

## Alerting and Notifications

### 1. Custom Alerts
```javascript
// alerts.js
export function createTradingAlert(level, message, context) {
    Sentry.withScope(scope => {
        scope.setLevel(level);
        scope.setTag('alert_type', 'trading');
        scope.setContext('alert_context', context);
        
        Sentry.captureMessage(message);
    });
}

// Usage
if (portfolioValue < stopLossThreshold) {
    createTradingAlert('error', 'Portfolio stop loss triggered', {
        current_value: portfolioValue,
        stop_loss: stopLossThreshold,
        drawdown: (portfolioValue - initialValue) / initialValue
    });
}
```

### 2. Performance Alerts
```javascript
// performance-alerts.js
export function checkPerformanceThresholds(metrics) {
    if (metrics.responseTime > 5000) {
        Sentry.captureMessage('High response time detected', {
            level: 'warning',
            tags: { performance: 'slow_response' },
            extra: { response_time: metrics.responseTime }
        });
    }
    
    if (metrics.errorRate > 0.05) {
        Sentry.captureMessage('High error rate detected', {
            level: 'error',
            tags: { performance: 'high_error_rate' },
            extra: { error_rate: metrics.errorRate }
        });
    }
}
```

## Release Tracking

### 1. Release Configuration
```javascript
// release-tracking.js
import Sentry from './sentry.js';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    // ... other config
});

// Track deployment
Sentry.captureMessage('FinSage deployed', {
    level: 'info',
    tags: { event: 'deployment' },
    extra: {
        version: process.env.APP_VERSION,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    }
});
```

### 2. Feature Flags
```javascript
// feature-flags.js
export function trackFeatureUsage(feature, enabled, context = {}) {
    Sentry.addBreadcrumb({
        message: `Feature ${feature} ${enabled ? 'enabled' : 'disabled'}`,
        category: 'feature_flag',
        data: { feature, enabled, ...context },
        level: 'info'
    });
}

// Usage
trackFeatureUsage('auto_trading', user.settings.autoTrading, {
    user_id: user.id,
    risk_tolerance: user.riskTolerance
});
```

## Dashboard and Monitoring

### 1. Custom Dashboard Queries
```javascript
// dashboard-queries.js
export const DASHBOARD_QUERIES = {
    errorRate: `
        error.type:Error
        AND timestamp:>now-1h
        | rate() as error_rate
    `,
    
    tradingErrors: `
        tags[error_type]:trading
        AND timestamp:>now-24h
        | count() as trading_errors
    `,
    
    performanceIssues: `
        transaction.duration:>5000
        AND timestamp:>now-1h
        | count() as slow_requests
    `,
    
    dataQualityIssues: `
        tags[error_type]:data_quality
        AND timestamp:>now-24h
        | count() as data_issues
    `
};
```

### 2. Health Checks
```javascript
// health-checks.js
export async function performHealthCheck() {
    const health = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        checks: {}
    };
    
    try {
        // Check database connection
        await db.query('SELECT 1');
        health.checks.database = 'healthy';
    } catch (error) {
        health.checks.database = 'unhealthy';
        health.status = 'unhealthy';
        Sentry.captureException(error);
    }
    
    try {
        // Check external APIs
        await Promise.all([
            checkYahooFinance(),
            checkGoogleFinance(),
            checkNewsAPI()
        ]);
        health.checks.external_apis = 'healthy';
    } catch (error) {
        health.checks.external_apis = 'unhealthy';
        health.status = 'degraded';
        Sentry.captureException(error);
    }
    
    return health;
}
```

For complete documentation, visit [Sentry JavaScript SDK Docs](https://docs.sentry.io/platforms/javascript/).
