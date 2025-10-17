# Apify Pipeline Integration

## Overview

Apify provides the data ingestion layer for FinSage, scraping real-time market data, news, and fundamental information from various financial sources. This guide covers setting up and managing the Apify pipeline.

## Platform Setup

### 1. Apify Account Setup
1. Visit [Apify Platform](https://apify.com/)
2. Create account and get API token
3. Add to `.env` file: `APIFY_TOKEN=your_token_here`

### 2. Install Apify SDK
```bash
npm install apify
# or
pip install apify
```

## Data Sources Configuration

### 1. Yahoo Finance Actor
```javascript
// yahoo-finance-scraper.js
import { Actor } from 'apify';

Actor.main(async () => {
    const input = await Actor.getInput();
    const { symbols, fields = ['price', 'volume', 'change'] } = input;
    
    const results = [];
    
    for (const symbol of symbols) {
        try {
            const data = await scrapeYahooFinance(symbol, fields);
            results.push({
                symbol,
                data,
                timestamp: new Date().toISOString(),
                source: 'yahoo_finance'
            });
        } catch (error) {
            console.error(`Failed to scrape ${symbol}:`, error);
        }
    }
    
    await Actor.pushData(results);
});

async function scrapeYahooFinance(symbol, fields) {
    const url = `https://finance.yahoo.com/quote/${symbol}`;
    const page = await Actor.newPage();
    
    await page.goto(url);
    await page.waitForSelector('[data-testid="quote-header"]');
    
    const data = {};
    
    for (const field of fields) {
        switch (field) {
            case 'price':
                data.price = await page.$eval('[data-field="regularMarketPrice"]', el => el.textContent);
                break;
            case 'volume':
                data.volume = await page.$eval('[data-field="regularMarketVolume"]', el => el.textContent);
                break;
            case 'change':
                data.change = await page.$eval('[data-field="regularMarketChange"]', el => el.textContent);
                data.changePercent = await page.$eval('[data-field="regularMarketChangePercent"]', el => el.textContent);
                break;
        }
    }
    
    return data;
}
```

### 2. Google Finance Actor
```javascript
// google-finance-scraper.js
import { Actor } from 'apify';

Actor.main(async () => {
    const input = await Actor.getInput();
    const { symbols } = input;
    
    const results = [];
    
    for (const symbol of symbols) {
        try {
            const data = await scrapeGoogleFinance(symbol);
            results.push({
                symbol,
                data,
                timestamp: new Date().toISOString(),
                source: 'google_finance'
            });
        } catch (error) {
            console.error(`Failed to scrape ${symbol}:`, error);
        }
    }
    
    await Actor.pushData(results);
});

async function scrapeGoogleFinance(symbol) {
    const url = `https://www.google.com/finance/quote/${symbol}`;
    const page = await Actor.newPage();
    
    await page.goto(url);
    await page.waitForSelector('[data-last-price]');
    
    return {
        price: await page.$eval('[data-last-price]', el => el.textContent),
        change: await page.$eval('[data-last-change]', el => el.textContent),
        changePercent: await page.$eval('[data-last-change-percent]', el => el.textContent),
        volume: await page.$eval('[data-volume]', el => el.textContent)
    };
}
```

### 3. News Aggregator Actor
```javascript
// news-aggregator.js
import { Actor } from 'apify';

Actor.main(async () => {
    const input = await Actor.getInput();
    const { symbols, hours_back = 24 } = input;
    
    const results = [];
    
    for (const symbol of symbols) {
        try {
            const news = await scrapeNews(symbol, hours_back);
            results.push({
                symbol,
                news,
                timestamp: new Date().toISOString(),
                source: 'news_aggregator'
            });
        } catch (error) {
            console.error(`Failed to scrape news for ${symbol}:`, error);
        }
    }
    
    await Actor.pushData(results);
});

async function scrapeNews(symbol, hours_back) {
    const sources = [
        `https://finance.yahoo.com/quote/${symbol}/news`,
        `https://www.marketwatch.com/investing/stock/${symbol}`,
        `https://seekingalpha.com/symbol/${symbol}/news`
    ];
    
    const allNews = [];
    
    for (const source of sources) {
        try {
            const page = await Actor.newPage();
            await page.goto(source);
            
            const news = await page.$$eval('article, .news-item', items => 
                items.map(item => ({
                    headline: item.querySelector('h1, h2, h3, .headline')?.textContent?.trim(),
                    summary: item.querySelector('p, .summary')?.textContent?.trim(),
                    publishedAt: item.querySelector('time, .date')?.textContent?.trim(),
                    source: source
                })).filter(item => item.headline)
            );
            
            allNews.push(...news);
        } catch (error) {
            console.error(`Failed to scrape news from ${source}:`, error);
        }
    }
    
    return allNews;
}
```

## Actor Deployment

### 1. Deploy to Apify Platform
```bash
# Using Apify CLI
apify login
apify push

# Or using web interface
# 1. Go to https://console.apify.com/actors
# 2. Click "Create new"
# 3. Upload your actor code
# 4. Configure input schema
```

### 2. Configure Input Schema
```json
{
  "title": "FinSage Data Scraper",
  "type": "object",
  "properties": {
    "symbols": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of stock symbols to scrape"
    },
    "fields": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["price", "volume", "change", "fundamentals", "news"]
      },
      "description": "Data fields to collect"
    },
    "hours_back": {
      "type": "integer",
      "default": 24,
      "description": "Hours of historical data to collect"
    }
  },
  "required": ["symbols"]
}
```

## Scheduling and Automation

### 1. Create Scheduled Run
```javascript
// schedule-actor.js
import { ApifyApi } from 'apify-client';

const client = new ApifyApi({
    token: process.env.APIFY_TOKEN
});

async function scheduleActor() {
    const actorId = 'your-actor-id';
    
    // Schedule every 15 minutes during market hours
    const run = await client.actor(actorId).start({
        input: {
            symbols: ['AAPL', 'TSLA', 'SPY', 'QQQ'],
            fields: ['price', 'volume', 'change', 'fundamentals', 'news'],
            hours_back: 1
        },
        waitSecs: 0, // Don't wait for completion
        webhooks: [
            {
                eventTypes: ['ACTOR.RUN.SUCCEEDED'],
                requestUrl: 'https://your-domain.com/webhook/apify-data',
                payloadTemplate: '{"runId": "{{runId}}", "actorId": "{{actorId}}"}'
            }
        ]
    });
    
    console.log(`Scheduled run ${run.id}`);
}

scheduleActor();
```

### 2. Cron-based Scheduling
```yaml
# apify-scheduler.yaml
name: finsage-data-scheduler
schedule: "*/15 9-16 * * 1-5"  # Every 15 minutes, 9AM-4PM, Mon-Fri
timezone: "America/New_York"
actors:
  - id: yahoo-finance-scraper
    input:
      symbols: ["AAPL", "TSLA", "SPY", "QQQ", "MSFT"]
      fields: ["price", "volume", "change"]
  - id: news-aggregator
    input:
      symbols: ["AAPL", "TSLA", "SPY"]
      hours_back: 2
```

## Data Processing Pipeline

### 1. Webhook Handler
```javascript
// webhook-handler.js
import express from 'express';
import { ApifyApi } from 'apify-client';

const app = express();
app.use(express.json());

const client = new ApifyApi({
    token: process.env.APIFY_TOKEN
});

app.post('/webhook/apify-data', async (req, res) => {
    const { runId, actorId } = req.body;
    
    try {
        // Get run results
        const run = await client.run(runId).get();
        const results = await client.dataset(run.defaultDatasetId).listItems();
        
        // Process and validate data
        const processedData = await processMarketData(results.items);
        
        // Send to Airia agent
        await sendToAiria(processedData);
        
        // Log success
        console.log(`Processed ${results.items.length} data points from run ${runId}`);
        
        res.json({ status: 'success' });
    } catch (error) {
        console.error('Webhook processing failed:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

async function processMarketData(rawData) {
    return rawData.map(item => ({
        symbol: item.symbol,
        data: item.data,
        timestamp: item.timestamp,
        source: item.source,
        processed_at: new Date().toISOString()
    }));
}

async function sendToAiria(data) {
    // Send to Airia webhook
    const response = await fetch(process.env.AIRIA_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AIRIA_API_KEY}`
        },
        body: JSON.stringify({
            event_type: 'market_data_update',
            data: data,
            timestamp: new Date().toISOString()
        })
    });
    
    if (!response.ok) {
        throw new Error(`Airia webhook failed: ${response.statusText}`);
    }
}

app.listen(3000, () => {
    console.log('Apify webhook handler running on port 3000');
});
```

### 2. Data Validation
```javascript
// data-validator.js
export function validateMarketData(data) {
    const errors = [];
    
    for (const item of data) {
        if (!item.symbol) {
            errors.push('Missing symbol');
        }
        
        if (!item.data) {
            errors.push(`Missing data for ${item.symbol}`);
        }
        
        if (item.data.price && isNaN(parseFloat(item.data.price))) {
            errors.push(`Invalid price for ${item.symbol}: ${item.data.price}`);
        }
        
        if (item.data.volume && isNaN(parseInt(item.data.volume))) {
            errors.push(`Invalid volume for ${item.symbol}: ${item.data.volume}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
```

## Error Handling and Monitoring

### 1. Actor Error Handling
```javascript
// error-handler.js
import { Actor } from 'apify';

Actor.main(async () => {
    try {
        const input = await Actor.getInput();
        const results = await processData(input);
        await Actor.pushData(results);
    } catch (error) {
        console.error('Actor execution failed:', error);
        
        // Log error to Apify
        await Actor.log.error('Actor failed', { error: error.message });
        
        // Send error notification
        await sendErrorNotification(error);
        
        // Re-throw to mark run as failed
        throw error;
    }
});

async function sendErrorNotification(error) {
    // Send to monitoring service
    await fetch(process.env.MONITORING_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service: 'apify-actor',
            error: error.message,
            timestamp: new Date().toISOString()
        })
    });
}
```

### 2. Retry Logic
```javascript
// retry-handler.js
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

## Performance Optimization

### 1. Parallel Processing
```javascript
// parallel-scraper.js
import { Actor } from 'apify';
import pLimit from 'p-limit';

const limit = pLimit(5); // Max 5 concurrent requests

Actor.main(async () => {
    const input = await Actor.getInput();
    const { symbols } = input;
    
    // Process symbols in parallel with concurrency limit
    const results = await Promise.all(
        symbols.map(symbol => 
            limit(() => scrapeSymbol(symbol))
        )
    );
    
    await Actor.pushData(results);
});
```

### 2. Caching Strategy
```javascript
// cache-manager.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minute TTL

async function getCachedData(key, fetchFn) {
    let data = cache.get(key);
    
    if (!data) {
        data = await fetchFn();
        cache.set(key, data);
    }
    
    return data;
}
```

## Cost Management

### 1. Usage Monitoring
```javascript
// usage-monitor.js
import { ApifyApi } from 'apify-client';

const client = new ApifyApi({
    token: process.env.APIFY_TOKEN
});

async function monitorUsage() {
    const usage = await client.usage.get();
    
    console.log('Apify Usage:', {
        computeUnits: usage.computeUnits,
        proxyUsage: usage.proxyUsage,
        storageUsage: usage.storageUsage
    });
    
    // Alert if approaching limits
    if (usage.computeUnits > 0.8 * usage.computeUnitsLimit) {
        await sendAlert('High compute usage detected');
    }
}
```

### 2. Cost Optimization
```javascript
// cost-optimizer.js
function optimizeScrapingSchedule() {
    // Reduce frequency during low-activity periods
    const marketHours = isMarketOpen();
    const frequency = marketHours ? 15 : 60; // minutes
    
    return {
        frequency,
        symbols: marketHours ? ALL_SYMBOLS : CORE_SYMBOLS
    };
}
```

For complete documentation, visit [Apify Platform Docs](https://docs.apify.com/).
