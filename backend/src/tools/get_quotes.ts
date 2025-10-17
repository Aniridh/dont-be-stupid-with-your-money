import * as Sentry from '@sentry/node';
import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  GetQuotesInput, 
  SuccessResponse, 
  ErrorResponse, 
  QuoteData 
} from '../lib/schema.js';
import { isStubMode, isLiveQuotes } from '../env.js';
import { getSnapshot, getHistory } from '../lib/prices.js';
import { calculateAllIndicators, getLatestValue } from '../lib/ta.js';

export async function getQuotes(input: GetQuotesInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  // Add breadcrumb for tool execution
  if (process.env['SENTRY_DSN']) {
    Sentry.addBreadcrumb({
      message: 'Executing get_quotes tool',
      category: 'tool',
      data: {
        tool_name: 'get_quotes',
        tool_call_id: toolCallId,
        symbols: input.symbols
      },
      level: 'info'
    });
  }

  try {
    let quotes: QuoteData[];

    if (isLiveQuotes()) {
      try {
        // LIVE mode: Use real price provider
        quotes = await fetchRealQuotes(input.symbols, input.fields);
      } catch (error) {
        console.warn(`⚠️ Live quotes fetch failed, falling back to stub: ${error instanceof Error ? error.message : 'Unknown error'}`);
        quotes = generateStubQuotes(input.symbols);
      }
    } else {
      // STUB mode: Generate deterministic stub data
      quotes = generateStubQuotes(input.symbols);
    }

    const response: SuccessResponse = {
      tool_call_id: toolCallId,
      data: {
        quotes,
        source_refs: [toolCallId]
      }
    };

    const duration = Date.now() - startTime;
    auditLogger.logToolCall(toolCallId, 'get_quotes', input, response, duration);

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Capture exception in Sentry
    if (process.env['SENTRY_DSN']) {
      Sentry.captureException(error, {
        tags: {
          tool_name: 'get_quotes',
          tool_call_id: toolCallId
        },
        extra: {
          input: input,
          duration_ms: duration
        }
      });
    }
    
    const errorResponse: ErrorResponse = {
      tool_call_id: toolCallId,
      error: {
        code: 'QUOTES_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error fetching quotes'
      }
    };

    auditLogger.logToolCall(toolCallId, 'get_quotes', input, errorResponse, duration, {
      code: 'QUOTES_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      ...(error instanceof Error && error.stack && { stack: error.stack })
    });

    return errorResponse;
  }
}

function generateStubQuotes(symbols: string[]): QuoteData[] {
  const basePrices: Record<string, number> = {
    'AAPL': 175.43,
    'TSLA': 248.50,
    'SPY': 445.20,
    'MSFT': 385.75,
    'NVDA': 450.25,
    'GOOGL': 142.80,
    'AMZN': 155.30,
    'META': 350.15,
    'QQQ': 380.90,
    'IWM': 200.45
  };

  return symbols.map(symbol => {
    const basePrice = basePrices[symbol] || 100.00;
    const seed = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
    
    // Generate deterministic but varied data
    const changePercent = ((seed % 200) - 100) / 1000; // -0.1 to +0.1
    const change = basePrice * changePercent;
    const price = basePrice + change;
    const volume = 1000000 + (seed % 5000000);

    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      change_percent: Math.round(changePercent * 10000) / 100,
      volume,
      timestamp: new Date().toISOString()
    };
  });
}

async function fetchRealQuotes(symbols: string[], fields?: string[]): Promise<QuoteData[]> {
  const results: QuoteData[] = [];
  
  for (const symbol of symbols) {
    try {
      const quote = await fetchEnhancedQuote(symbol);
      results.push(quote);
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      // Return error data for failed symbols
      results.push({
        symbol,
        price: 0,
        change: 0,
        change_percent: 0,
        volume: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return results;
}

async function fetchEnhancedQuote(symbol: string): Promise<QuoteData> {
  // Retry logic with exponential backoff
  const maxRetries = 2;
  const baseDelay = 250;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Get snapshot data
      const snapshot = await getSnapshot(symbol);
      
      // Get historical data for technical indicators
      const history = await getHistory(symbol, '1y');
      
      if (history.length === 0) {
        throw new Error(`No historical data available for ${symbol}`);
      }
      
      // Calculate technical indicators
      const indicators = calculateAllIndicators(history, 20, 14, 14); // SMA20, RSI14, ATR14
      const sma50Indicators = calculateAllIndicators(history, 50, 14, 14);
      const sma200Indicators = calculateAllIndicators(history, 200, 14, 14);
      
      // Get latest values
      const sma20 = getLatestValue(indicators.sma);
      const sma50 = getLatestValue(sma50Indicators.sma);
      const sma200 = getLatestValue(sma200Indicators.sma);
      const rsi14 = getLatestValue(indicators.rsi);
      const atr14 = getLatestValue(indicators.atr);
      
      // Calculate 30-day average volume
      const recentVolume = history.slice(-30).map(h => h.v);
      const avgVolume30d = recentVolume.length > 0 
        ? recentVolume.reduce((sum, vol) => sum + vol, 0) / recentVolume.length 
        : snapshot.volume;
      
      // Calculate 52-week range
      const prices = history.map(h => h.h); // Use high prices for 52-week high
      const lowPrices = history.map(h => h.l); // Use low prices for 52-week low
      const range52w = {
        high: Math.max(...prices),
        low: Math.min(...lowPrices)
      };
      
      return {
        symbol: snapshot.symbol,
        price: snapshot.price,
        change: snapshot.change,
        change_percent: snapshot.changePercent,
        volume: snapshot.volume,
        timestamp: new Date().toISOString(),
        source: snapshot.source,
        // Enhanced data
        day_change_pct: snapshot.changePercent,
        range_52w: range52w,
        avg_volume_30d: Math.round(avgVolume30d),
        sma20: sma20 || null,
        sma50: sma50 || null,
        sma200: sma200 || null,
        atr14: atr14 || null,
        rsi14: rsi14 || null
      };
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Final attempt failed
      }
      
      // Wait before retry with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed to fetch quote for ${symbol} after ${maxRetries + 1} attempts`);
}
