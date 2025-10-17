# Demo Events Script

## Overview

This script generates realistic demo events for showcasing FinSage's capabilities during presentations and testing. It simulates market data, news events, and portfolio changes to demonstrate the agent's response to various scenarios.

## Event Types

### 1. Market Data Events
```javascript
// market-data-events.js
const marketDataEvents = [
    {
        type: 'quote_update',
        symbol: 'AAPL',
        data: {
            price: 175.43,
            change: -2.15,
            changePercent: -1.21,
            volume: 45678900,
            timestamp: new Date().toISOString()
        }
    },
    {
        type: 'quote_update',
        symbol: 'TSLA',
        data: {
            price: 248.50,
            change: 12.30,
            changePercent: 5.20,
            volume: 78912300,
            timestamp: new Date().toISOString()
        }
    }
];
```

### 2. News Events
```javascript
// news-events.js
const newsEvents = [
    {
        type: 'news_alert',
        symbol: 'AAPL',
        headline: 'Apple Reports Strong Q4 Earnings, Beats Expectations',
        summary: 'Apple Inc. reported quarterly earnings that exceeded analyst expectations...',
        sentiment: 'positive',
        impact_score: 0.8,
        published_at: new Date().toISOString()
    },
    {
        type: 'news_alert',
        symbol: 'TSLA',
        headline: 'Tesla Faces Regulatory Investigation Over Autopilot Safety',
        summary: 'Federal regulators are investigating Tesla\'s Autopilot system...',
        sentiment: 'negative',
        impact_score: 0.6,
        published_at: new Date().toISOString()
    }
];
```

### 3. Fundamental Data Events
```javascript
// fundamental-events.js
const fundamentalEvents = [
    {
        type: 'fundamental_update',
        symbol: 'AAPL',
        data: {
            pe_ratio: 28.5,
            peg_ratio: 1.2,
            ev_ebitda: 22.1,
            roic: 0.15,
            gross_margin: 0.42,
            current_ratio: 1.8,
            debt_to_equity: 0.3
        }
    }
];
```

## Demo Scenarios

### Scenario 1: Bull Market Signal
```javascript
// bull-market-scenario.js
const bullMarketScenario = {
    name: 'Bull Market Signal Detection',
    description: 'Demonstrates detection of positive market signals',
    events: [
        {
            type: 'quote_update',
            symbol: 'SPY',
            data: {
                price: 445.20,
                change: 8.50,
                changePercent: 1.95,
                volume: 120000000
            }
        },
        {
            type: 'news_alert',
            symbol: 'SPY',
            headline: 'Federal Reserve Signals Dovish Stance on Interest Rates',
            sentiment: 'positive',
            impact_score: 0.9
        },
        {
            type: 'technical_signal',
            symbol: 'SPY',
            signal_type: 'golden_cross',
            description: '50-day MA crossed above 200-day MA',
            confidence: 0.85
        }
    ],
    expectedResponse: {
        action: 'increase_exposure',
        confidence: 0.8,
        reasoning: 'Multiple bullish signals detected across market and technical indicators'
    }
};
```

### Scenario 2: Risk Alert
```javascript
// risk-alert-scenario.js
const riskAlertScenario = {
    name: 'Portfolio Risk Alert',
    description: 'Demonstrates risk management and alert generation',
    events: [
        {
            type: 'portfolio_update',
            data: {
                total_value: 95000,
                cash: 5000,
                positions: [
                    { symbol: 'AAPL', weight: 0.25, value: 23750 },
                    { symbol: 'TSLA', weight: 0.30, value: 28500 },
                    { symbol: 'NVDA', weight: 0.35, value: 33250 }
                ]
            }
        },
        {
            type: 'risk_metric',
            metric: 'var_95_1d',
            value: 0.08,
            threshold: 0.05,
            status: 'exceeded'
        },
        {
            type: 'correlation_alert',
            description: 'High correlation detected between tech stocks',
            correlation: 0.85,
            symbols: ['AAPL', 'TSLA', 'NVDA']
        }
    ],
    expectedResponse: {
        action: 'reduce_risk',
        alert_level: 'high',
        suggestions: [
            'Reduce position sizes',
            'Diversify across sectors',
            'Consider hedging strategies'
        ]
    }
};
```

### Scenario 3: Earnings Surprise
```javascript
// earnings-surprise-scenario.js
const earningsSurpriseScenario = {
    name: 'Earnings Surprise Detection',
    description: 'Demonstrates response to unexpected earnings results',
    events: [
        {
            type: 'earnings_announcement',
            symbol: 'MSFT',
            data: {
                actual_eps: 2.85,
                consensus_eps: 2.65,
                surprise_percent: 7.5,
                revenue_actual: 56500,
                revenue_consensus: 54000
            }
        },
        {
            type: 'analyst_upgrade',
            symbol: 'MSFT',
            action: 'upgrade',
            from: 'Hold',
            to: 'Buy',
            target_price: 420,
            current_price: 385
        },
        {
            type: 'volume_spike',
            symbol: 'MSFT',
            current_volume: 95000000,
            average_volume: 45000000,
            volume_ratio: 2.1
        }
    ],
    expectedResponse: {
        action: 'consider_position_increase',
        confidence: 0.75,
        reasoning: 'Positive earnings surprise with analyst upgrades and volume confirmation'
    }
};
```

## Event Generation Script

### 1. Real-time Event Generator
```javascript
// event-generator.js
class DemoEventGenerator {
    constructor(interval = 5000) {
        this.interval = interval;
        this.isRunning = false;
        this.eventHandlers = [];
    }

    addEventHandler(handler) {
        this.eventHandlers.push(handler);
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.scheduleNextEvent();
    }

    stop() {
        this.isRunning = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    scheduleNextEvent() {
        if (!this.isRunning) return;

        const event = this.generateRandomEvent();
        this.emitEvent(event);

        this.timeoutId = setTimeout(() => {
            this.scheduleNextEvent();
        }, this.interval);
    }

    generateRandomEvent() {
        const eventTypes = [
            'quote_update',
            'news_alert',
            'technical_signal',
            'fundamental_update',
            'risk_metric'
        ];

        const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'MSFT', 'NVDA'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];

        return this.createEvent(eventType, symbol);
    }

    createEvent(type, symbol) {
        const baseEvent = {
            type,
            symbol,
            timestamp: new Date().toISOString(),
            id: this.generateEventId()
        };

        switch (type) {
            case 'quote_update':
                return {
                    ...baseEvent,
                    data: this.generateQuoteData(symbol)
                };
            case 'news_alert':
                return {
                    ...baseEvent,
                    data: this.generateNewsData(symbol)
                };
            case 'technical_signal':
                return {
                    ...baseEvent,
                    data: this.generateTechnicalSignal(symbol)
                };
            default:
                return baseEvent;
        }
    }

    generateQuoteData(symbol) {
        const basePrice = this.getBasePrice(symbol);
        const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
        const change = basePrice * (changePercent / 100);
        const price = basePrice + change;

        return {
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: Math.floor(Math.random() * 100000000) + 10000000
        };
    }

    generateNewsData(symbol) {
        const headlines = [
            `${symbol} Reports Strong Quarterly Results`,
            `${symbol} Faces Regulatory Challenges`,
            `${symbol} Announces New Product Launch`,
            `${symbol} CEO Makes Significant Purchase`,
            `${symbol} Partnership Announcement`
        ];

        const sentiments = ['positive', 'negative', 'neutral'];
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

        return {
            headline: headlines[Math.floor(Math.random() * headlines.length)],
            summary: `Breaking news about ${symbol} that could impact stock price...`,
            sentiment,
            impact_score: Math.random(),
            source: 'Demo News Service'
        };
    }

    generateTechnicalSignal(symbol) {
        const signals = [
            'golden_cross',
            'death_cross',
            'rsi_oversold',
            'rsi_overbought',
            'macd_bullish',
            'macd_bearish'
        ];

        const signal = signals[Math.floor(Math.random() * signals.length)];
        const confidence = Math.random() * 0.4 + 0.6; // 0.6 to 1.0

        return {
            signal_type: signal,
            confidence: parseFloat(confidence.toFixed(2)),
            description: `Technical signal detected: ${signal}`,
            parameters: {
                rsi: Math.floor(Math.random() * 100),
                macd: (Math.random() - 0.5) * 2,
                sma_50: Math.random() * 200 + 100,
                sma_200: Math.random() * 200 + 100
            }
        };
    }

    getBasePrice(symbol) {
        const basePrices = {
            'AAPL': 175,
            'TSLA': 250,
            'SPY': 440,
            'QQQ': 380,
            'MSFT': 390,
            'NVDA': 450
        };
        return basePrices[symbol] || 100;
    }

    generateEventId() {
        return 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    emitEvent(event) {
        this.eventHandlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error('Event handler error:', error);
            }
        });
    }
}

module.exports = DemoEventGenerator;
```

### 2. Demo Controller
```javascript
// demo-controller.js
const DemoEventGenerator = require('./event-generator');

class DemoController {
    constructor() {
        this.generator = new DemoEventGenerator(3000); // 3 second intervals
        this.scenarios = new Map();
        this.currentScenario = null;
        this.isRunning = false;
    }

    addScenario(name, scenario) {
        this.scenarios.set(name, scenario);
    }

    startScenario(name) {
        const scenario = this.scenarios.get(name);
        if (!scenario) {
            throw new Error(`Scenario '${name}' not found`);
        }

        this.currentScenario = scenario;
        this.isRunning = true;
        
        console.log(`Starting scenario: ${scenario.name}`);
        console.log(`Description: ${scenario.description}`);
        
        this.playScenario(scenario);
    }

    playScenario(scenario) {
        let eventIndex = 0;
        
        const playNextEvent = () => {
            if (!this.isRunning || eventIndex >= scenario.events.length) {
                this.stopScenario();
                return;
            }

            const event = scenario.events[eventIndex];
            console.log(`\n--- Event ${eventIndex + 1} ---`);
            console.log(JSON.stringify(event, null, 2));
            
            // Simulate processing time
            setTimeout(() => {
                this.processEvent(event);
                eventIndex++;
                playNextEvent();
            }, 2000);
        };

        playNextEvent();
    }

    processEvent(event) {
        // Simulate FinSage processing
        console.log(`\n🤖 FinSage processing ${event.type} for ${event.symbol}...`);
        
        // Simulate AI analysis
        setTimeout(() => {
            const response = this.generateResponse(event);
            console.log('\n📊 FinSage Response:');
            console.log(JSON.stringify(response, null, 2));
        }, 1000);
    }

    generateResponse(event) {
        // Simulate AI response based on event type
        switch (event.type) {
            case 'quote_update':
                return this.generateQuoteResponse(event);
            case 'news_alert':
                return this.generateNewsResponse(event);
            case 'technical_signal':
                return this.generateTechnicalResponse(event);
            default:
                return { status: 'processed', message: 'Event processed successfully' };
        }
    }

    generateQuoteResponse(event) {
        const { changePercent } = event.data;
        const isPositive = changePercent > 0;
        
        return {
            status: 'suggestion',
            symbol: event.symbol,
            action: isPositive ? 'consider_buy' : 'consider_sell',
            confidence: Math.abs(changePercent) / 10, // Higher change = higher confidence
            reasoning: `${event.symbol} moved ${changePercent}% - ${isPositive ? 'bullish' : 'bearish'} signal`,
            source_refs: [event.id]
        };
    }

    generateNewsResponse(event) {
        const { sentiment, impact_score } = event.data;
        
        return {
            status: 'alert',
            symbol: event.symbol,
            alert_type: 'news_impact',
            sentiment,
            impact_score,
            action: sentiment === 'positive' ? 'monitor_for_opportunity' : 'monitor_for_risk',
            reasoning: `News sentiment: ${sentiment} with impact score ${impact_score}`,
            source_refs: [event.id]
        };
    }

    generateTechnicalResponse(event) {
        const { signal_type, confidence } = event.data;
        
        return {
            status: 'signal',
            symbol: event.symbol,
            signal_type,
            confidence,
            action: this.getSignalAction(signal_type),
            reasoning: `Technical signal detected: ${signal_type}`,
            source_refs: [event.id]
        };
    }

    getSignalAction(signalType) {
        const actions = {
            'golden_cross': 'consider_buy',
            'death_cross': 'consider_sell',
            'rsi_oversold': 'consider_buy',
            'rsi_overbought': 'consider_sell',
            'macd_bullish': 'consider_buy',
            'macd_bearish': 'consider_sell'
        };
        return actions[signalType] || 'monitor';
    }

    stopScenario() {
        this.isRunning = false;
        this.currentScenario = null;
        console.log('\n✅ Scenario completed');
    }

    startRandomEvents() {
        this.generator.addEventHandler((event) => {
            console.log('\n--- Random Event ---');
            console.log(JSON.stringify(event, null, 2));
            this.processEvent(event);
        });
        
        this.generator.start();
        console.log('🎲 Random event generation started');
    }

    stopRandomEvents() {
        this.generator.stop();
        console.log('⏹️ Random event generation stopped');
    }
}

module.exports = DemoController;
```

## Usage Examples

### 1. Basic Demo
```javascript
// basic-demo.js
const DemoController = require('./demo-controller');

const controller = new DemoController();

// Add scenarios
controller.addScenario('bull_market', bullMarketScenario);
controller.addScenario('risk_alert', riskAlertScenario);
controller.addScenario('earnings_surprise', earningsSurpriseScenario);

// Start a scenario
controller.startScenario('bull_market');

// Or start random events
controller.startRandomEvents();
```

### 2. Interactive Demo
```javascript
// interactive-demo.js
const readline = require('readline');
const DemoController = require('./demo-controller');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const controller = new DemoController();

// Add scenarios
controller.addScenario('bull_market', bullMarketScenario);
controller.addScenario('risk_alert', riskAlertScenario);

function showMenu() {
    console.log('\n🎯 FinSage Demo Controller');
    console.log('1. Bull Market Scenario');
    console.log('2. Risk Alert Scenario');
    console.log('3. Random Events');
    console.log('4. Stop Current Demo');
    console.log('5. Exit');
    
    rl.question('\nSelect option: ', (answer) => {
        switch (answer) {
            case '1':
                controller.startScenario('bull_market');
                break;
            case '2':
                controller.startScenario('risk_alert');
                break;
            case '3':
                controller.startRandomEvents();
                break;
            case '4':
                controller.stopScenario();
                controller.stopRandomEvents();
                break;
            case '5':
                rl.close();
                return;
            default:
                console.log('Invalid option');
        }
        
        setTimeout(showMenu, 1000);
    });
}

showMenu();
```

## Integration with FinSage

### 1. Webhook Integration
```javascript
// webhook-demo.js
const express = require('express');
const DemoController = require('./demo-controller');

const app = express();
app.use(express.json());

const controller = new DemoController();

// Demo webhook endpoint
app.post('/webhook/demo', (req, res) => {
    const { scenario } = req.body;
    
    if (scenario) {
        controller.startScenario(scenario);
    } else {
        controller.startRandomEvents();
    }
    
    res.json({ status: 'demo_started' });
});

app.listen(3001, () => {
    console.log('Demo server running on port 3001');
});
```

### 2. Real-time Dashboard
```javascript
// dashboard-demo.js
const WebSocket = require('ws');
const DemoController = require('./demo-controller');

const wss = new WebSocket.Server({ port: 8080 });
const controller = new DemoController();

wss.on('connection', (ws) => {
    console.log('Client connected to demo dashboard');
    
    // Send events to connected clients
    controller.generator.addEventHandler((event) => {
        ws.send(JSON.stringify({
            type: 'event',
            data: event
        }));
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
```

This demo events script provides a comprehensive framework for showcasing FinSage's capabilities in various market scenarios, making it perfect for presentations, testing, and demonstrations.
