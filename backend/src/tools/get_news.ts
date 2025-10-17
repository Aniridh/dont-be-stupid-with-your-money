import * as Sentry from '@sentry/node';
import fetch from 'node-fetch';
import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  GetNewsInput, 
  SuccessResponse, 
  ErrorResponse, 
  NewsData 
} from '../lib/schema.js';
import { isStubMode, isLiveNews } from '../env.js';

export async function getNews(input: GetNewsInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  // Add breadcrumb for tool execution
  if (process.env['SENTRY_DSN']) {
    Sentry.addBreadcrumb({
      message: 'Executing get_news tool',
      category: 'tool',
      data: {
        tool_name: 'get_news',
        tool_call_id: toolCallId,
        symbols: input.symbols
      },
      level: 'info'
    });
  }

  try {
    let news: NewsData[];

    if (isLiveNews()) {
      try {
        // LIVE mode: Use Apify actor for real news fetching
        news = await fetchRealNews(input.symbols, input.hours_back);
      } catch (error) {
        console.warn(`⚠️ Live news fetch failed, falling back to stub: ${error instanceof Error ? error.message : 'Unknown error'}`);
        news = generateStubNews(input.symbols, input.hours_back);
      }
    } else {
      // STUB mode: Generate deterministic stub data
      news = generateStubNews(input.symbols, input.hours_back);
    }

    const response: SuccessResponse = {
      tool_call_id: toolCallId,
      data: {
        items: news,
        meta: {
          tickers: input.symbols,
          lookback_days: Math.ceil(input.hours_back / 24),
          source: isLiveNews() ? 'apify' : 'stub',
          provider: isLiveNews() ? 'apify' : 'stub'
        },
        source_refs: [toolCallId]
      }
    };

    const duration = Date.now() - startTime;
    auditLogger.logToolCall(toolCallId, 'get_news', input, response, duration);

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Capture exception in Sentry
    if (process.env['SENTRY_DSN']) {
      Sentry.captureException(error, {
        tags: {
          tool_name: 'get_news',
          tool_call_id: toolCallId
        },
        extra: {
          input: input,
          duration_ms: duration
        }
      });
    }
    
    // Determine error code based on error type
    const errorCode = error instanceof Error && error.message.includes('Apify') 
      ? 'APIFY_ERROR' 
      : 'NEWS_FETCH_ERROR';
    
    const errorResponse: ErrorResponse = {
      tool_call_id: toolCallId,
      error: {
        code: errorCode,
        message: error instanceof Error ? error.message : 'Unknown error fetching news'
      }
    };

    auditLogger.logToolCall(toolCallId, 'get_news', input, errorResponse, duration, {
      code: errorCode,
      message: error instanceof Error ? error.message : 'Unknown error',
      ...(error instanceof Error && error.stack && { stack: error.stack })
    });

    return errorResponse;
  }
}

function generateStubNews(symbols: string[], hoursBack: number): NewsData[] {
  const newsTemplates: Record<string, Array<{
    headline: string;
    summary: string;
    sentiment: number;
    impact_score: number;
    publisher: string;
    tags: Array<'earnings' | 'guidance' | 'regulatory' | 'product'>;
  }>> = {
    'AAPL': [
      {
        headline: 'Apple Reports Strong Q4 Earnings, Beats Expectations',
        summary: 'Apple Inc. reported quarterly earnings that exceeded analyst expectations, driven by strong iPhone sales and services growth.',
        sentiment: 0.8,
        impact_score: 0.9,
        publisher: 'Reuters',
        tags: ['earnings']
      },
      {
        headline: 'Apple Announces New AI Features for iPhone 16',
        summary: 'The tech giant unveiled advanced AI capabilities for its upcoming smartphone, focusing on privacy and on-device processing.',
        sentiment: 0.7,
        impact_score: 0.8,
        publisher: 'TechCrunch',
        tags: ['product']
      },
      {
        headline: 'Apple Faces Antitrust Investigation in Europe',
        summary: 'European regulators are investigating Apple\'s App Store practices and potential anti-competitive behavior.',
        sentiment: -0.6,
        impact_score: 0.7,
        publisher: 'Financial Times',
        tags: ['regulatory']
      },
      {
        headline: 'Apple Raises Revenue Guidance for Next Quarter',
        summary: 'The company provided optimistic revenue projections, citing strong demand for its products and services.',
        sentiment: 0.9,
        impact_score: 0.8,
        publisher: 'Bloomberg',
        tags: ['guidance']
      },
      {
        headline: 'Apple CEO Makes Significant Stock Purchase',
        summary: 'Tim Cook purchased $10 million worth of Apple shares, signaling confidence in the company\'s future.',
        sentiment: 0.6,
        impact_score: 0.5,
        publisher: 'MarketWatch',
        tags: ['earnings']
      },
      {
        headline: 'Apple Partners with Major Car Manufacturers',
        summary: 'The company announced strategic partnerships with leading automakers for CarPlay integration.',
        sentiment: 0.5,
        impact_score: 0.6,
        publisher: 'Automotive News',
        tags: ['product']
      }
    ],
    'TSLA': [
      {
        headline: 'Tesla Reports Record Vehicle Deliveries in Q4',
        summary: 'Tesla delivered a record number of vehicles in the fourth quarter, exceeding production targets.',
        sentiment: 0.8,
        impact_score: 0.9,
        publisher: 'Reuters',
        tags: ['earnings']
      },
      {
        headline: 'Tesla Faces Regulatory Investigation Over Autopilot Safety',
        summary: 'Federal regulators are investigating Tesla\'s Autopilot system following recent accidents.',
        sentiment: -0.7,
        impact_score: 0.8,
        publisher: 'The Wall Street Journal',
        tags: ['regulatory']
      },
      {
        headline: 'Tesla Announces New Gigafactory in Texas',
        summary: 'The company revealed plans for a massive new manufacturing facility focused on battery production.',
        sentiment: 0.6,
        impact_score: 0.7,
        publisher: 'CNBC',
        tags: ['product']
      },
      {
        headline: 'Tesla CEO Sells Additional Shares',
        summary: 'Elon Musk sold another $2 billion worth of Tesla shares, continuing his recent divestment.',
        sentiment: -0.4,
        impact_score: 0.6,
        publisher: 'Bloomberg',
        tags: ['earnings']
      },
      {
        headline: 'Tesla Updates Full Self-Driving Software',
        summary: 'The company released a major update to its FSD software with improved safety features.',
        sentiment: 0.5,
        impact_score: 0.6,
        publisher: 'TechCrunch',
        tags: ['product']
      },
      {
        headline: 'Tesla Cuts Prices on Model Y and Model 3',
        summary: 'The automaker reduced prices across its vehicle lineup to boost demand.',
        sentiment: 0.3,
        impact_score: 0.7,
        publisher: 'Automotive News',
        tags: ['guidance']
      }
    ],
    'SPY': [
      {
        headline: 'S&P 500 Reaches New All-Time High',
        summary: 'The broad market index closed at a record high, driven by strong earnings and economic optimism.',
        sentiment: 0.9,
        impact_score: 0.8,
        publisher: 'MarketWatch',
        tags: ['earnings']
      },
      {
        headline: 'Federal Reserve Signals Dovish Stance on Interest Rates',
        summary: 'The central bank indicated it may pause rate hikes, boosting market sentiment.',
        sentiment: 0.7,
        impact_score: 0.9,
        publisher: 'Reuters',
        tags: ['guidance']
      },
      {
        headline: 'Inflation Data Shows Continued Cooling',
        summary: 'Latest inflation figures suggest the Fed\'s efforts to control prices are working.',
        sentiment: 0.6,
        impact_score: 0.8,
        publisher: 'The Wall Street Journal',
        tags: ['guidance']
      },
      {
        headline: 'Corporate Earnings Season Exceeds Expectations',
        summary: 'Most companies reporting Q4 results have beaten analyst estimates.',
        sentiment: 0.8,
        impact_score: 0.7,
        publisher: 'Bloomberg',
        tags: ['earnings']
      },
      {
        headline: 'Geopolitical Tensions Weigh on Market Sentiment',
        summary: 'Ongoing international conflicts continue to create market uncertainty.',
        sentiment: -0.5,
        impact_score: 0.6,
        publisher: 'Financial Times',
        tags: ['regulatory']
      },
      {
        headline: 'Technology Sector Leads Market Gains',
        summary: 'Big tech companies drove the market higher with strong quarterly results.',
        sentiment: 0.7,
        impact_score: 0.6,
        publisher: 'CNBC',
        tags: ['earnings']
      }
    ]
  };

  const allNews: NewsData[] = [];

  symbols.forEach(symbol => {
    const templates = newsTemplates[symbol] || newsTemplates['SPY'];
    if (!templates) return; // Skip if no templates available
    
    const numArticles = 6 + (symbol.charCodeAt(0) % 5); // 6-10 articles per symbol
    
    for (let i = 0; i < numArticles; i++) {
      const template = templates[i % templates.length];
      if (!template) continue; // Skip if template is undefined
      
      const seed = symbol.charCodeAt(0) + i;
      const hoursAgo = (seed % hoursBack) + 1;
      const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      allNews.push({
        symbol,
        headline: template.headline,
        summary: template.summary,
        sentiment: template.sentiment + ((seed % 20 - 10) / 100), // Add small variation
        impact_score: Math.max(0, Math.min(1, template.impact_score + ((seed % 10 - 5) / 100))),
        published_at: publishedAt.toISOString(),
        source: template.publisher,
        tags: template.tags
      });
    }
  });

  // Sort by published_at (most recent first)
  return allNews.sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

async function fetchRealNews(symbols: string[], hoursBack: number): Promise<NewsData[]> {
  const apifyToken = process.env['APIFY_TOKEN'];
  const apifyActorId = process.env['APIFY_ACTOR_ID'];
  
  if (!apifyToken || !apifyActorId) {
    throw new Error('APIFY_TOKEN and APIFY_ACTOR_ID environment variables are required for live news fetching');
  }

  const lookbackDays = Math.ceil(hoursBack / 24);
  const tickers = symbols;

  try {
    // Start actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${apifyActorId}/runs?token=${apifyToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tickers,
        lookback_days: lookbackDays
      })
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Apify API error: ${runResponse.status} ${runResponse.statusText} - ${errorText}`);
    }

    const runData = await runResponse.json() as { data: { id: string } };
    const runId = runData.data.id;

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time
    const pollInterval = 5000; // 5 seconds

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Apify status check error: ${statusResponse.status} ${statusResponse.statusText} - ${errorText}`);
      }

      const statusData = await statusResponse.json() as { data: { status: string } };
      const status = statusData.data.status;

      if (status === 'SUCCEEDED') {
        completed = true;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Actor run failed with status: ${status}`);
      }

      attempts++;
    }

    if (!completed) {
      throw new Error('Actor run timed out after 5 minutes');
    }

    // Fetch results from default dataset
    const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);

    if (!resultsResponse.ok) {
      const errorText = await resultsResponse.text();
      throw new Error(`Apify results fetch error: ${resultsResponse.status} ${resultsResponse.statusText} - ${errorText}`);
    }

    const rawResults = await resultsResponse.json() as any[];
    
    // Normalize to standard output format
    return normalizeApifyNews(rawResults, symbols);

  } catch (error) {
    console.error('Error fetching news from Apify:', error);
    throw error;
  }
}

function normalizeApifyNews(rawResults: any[], symbols: string[]): NewsData[] {
  const normalizedNews: NewsData[] = [];

  rawResults.forEach((item: any) => {
    // Normalize Apify output to exact format: { ticker, headline, timestamp, publisher, sentiment, tags }
    const ticker = item.ticker || item.symbol || 'UNKNOWN';
    const headline = item.headline || item.title || 'No headline available';
    const timestamp = item.timestamp || item.publishedAt || item.published_at || item.date || new Date().toISOString();
    const publisher = item.publisher || item.source || item.domain || 'Unknown';
    
    // Ensure sentiment is in [-1..1] range
    let sentiment = parseFloat(item.sentiment) || 0;
    sentiment = Math.max(-1, Math.min(1, sentiment));
    
    // Normalize tags to specific categories
    const rawTags = item.tags || item.categories || [];
    const normalizedTags: Array<'earnings' | 'guidance' | 'regulatory' | 'product'> = [];
    
    if (Array.isArray(rawTags)) {
      rawTags.forEach((tag: string) => {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('earnings') || lowerTag.includes('profit') || lowerTag.includes('revenue')) {
          normalizedTags.push('earnings');
        } else if (lowerTag.includes('guidance') || lowerTag.includes('forecast') || lowerTag.includes('outlook')) {
          normalizedTags.push('guidance');
        } else if (lowerTag.includes('regulatory') || lowerTag.includes('regulation') || lowerTag.includes('compliance')) {
          normalizedTags.push('regulatory');
        } else if (lowerTag.includes('product') || lowerTag.includes('launch') || lowerTag.includes('feature')) {
          normalizedTags.push('product');
        }
      });
    }
    
    // If no tags found, try to infer from content
    if (normalizedTags.length === 0) {
      const content = (headline + ' ' + (item.summary || '')).toLowerCase();
      if (content.includes('earnings') || content.includes('profit') || content.includes('revenue')) {
        normalizedTags.push('earnings');
      } else if (content.includes('guidance') || content.includes('forecast') || content.includes('outlook')) {
        normalizedTags.push('guidance');
      } else if (content.includes('regulatory') || content.includes('regulation') || content.includes('compliance')) {
        normalizedTags.push('regulatory');
      } else if (content.includes('product') || content.includes('launch') || content.includes('feature')) {
        normalizedTags.push('product');
      }
    }

    const newsItem: NewsData = {
      symbol: ticker,
      headline,
      summary: item.summary || item.description || item.content || '',
      sentiment,
      impact_score: parseFloat(item.impact_score) || 0.5,
      published_at: timestamp,
      source: publisher,
      tags: normalizedTags
    };

    // Only include news for requested symbols
    if (symbols.includes(ticker)) {
      normalizedNews.push(newsItem);
    }
  });

  // Sort by published_at (most recent first)
  return normalizedNews.sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

// TODO: Support Apify webhooks for real-time news updates
// This would eliminate the need for polling and provide instant updates
// when new news articles are available for monitored symbols
