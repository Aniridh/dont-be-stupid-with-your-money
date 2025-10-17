import * as Sentry from '@sentry/node';
import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  GetHistoryInput, 
  SuccessResponse, 
  ErrorResponse 
} from '../lib/schema.js';
import { isStubMode } from '../env.js';
import { getHistory as fetchHistoryData } from '../lib/prices.js';
import { calculateAllIndicators } from '../lib/ta.js';

export async function getHistory(input: GetHistoryInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  // Add breadcrumb for tool execution
  if (process.env['SENTRY_DSN']) {
    Sentry.addBreadcrumb({
      message: 'Executing get_history tool',
      category: 'tool',
      data: {
        tool_name: 'get_history',
        tool_call_id: toolCallId,
        symbol: input.symbol,
        period: input.period
      },
      level: 'info'
    });
  }

  try {
    let history: any[];

    if (isStubMode()) {
      // Generate deterministic stub data
      history = generateStubHistory(input.symbol, input.period, input.interval);
    } else {
      // LIVE mode: Use real price provider with technical analysis
      history = await fetchRealHistory(input.symbol, input.period, input.interval);
    }

    const response: SuccessResponse = {
      tool_call_id: toolCallId,
      data: {
        history,
        source_refs: [toolCallId]
      }
    };

    const duration = Date.now() - startTime;
    auditLogger.logToolCall(toolCallId, 'get_history', input, response, duration);

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Capture exception in Sentry
    if (process.env['SENTRY_DSN']) {
      Sentry.captureException(error, {
        tags: {
          tool_name: 'get_history',
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
        code: 'HISTORY_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error fetching historical data'
      }
    };

    auditLogger.logToolCall(toolCallId, 'get_history', input, errorResponse, duration, {
      code: 'HISTORY_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      ...(error instanceof Error && error.stack && { stack: error.stack })
    });

    return errorResponse;
  }
}

function generateStubHistory(symbol: string, period: string, interval?: string): any[] {
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

  const basePrice = basePrices[symbol] || 100.00;
  const seed = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
  
  // Calculate number of data points based on period and interval
  const intervalsPerDay = getIntervalsPerDay(interval || '1d');
  const days = getDaysForPeriod(period);
  const totalPoints = days * intervalsPerDay;
  
  const history = [];
  const now = new Date();
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(now.getTime() - (totalPoints - i) * getIntervalMs(interval || '1d'));
    
    // Generate deterministic price movement
    const trend = Math.sin(i / 10) * 0.02; // Long-term trend
    const noise = (Math.sin(i * 0.1 + seed) + Math.sin(i * 0.3 + seed * 2)) * 0.01; // Short-term noise
    const volatility = 0.02 + (seed % 10) / 1000; // Base volatility
    
    const priceChange = (trend + noise) * volatility;
    const price = basePrice * (1 + priceChange);
    
    // Generate OHLC data
    const open = price * (1 + (Math.sin(i + seed) * 0.005));
    const high = Math.max(open, price) * (1 + Math.abs(Math.sin(i * 2 + seed)) * 0.01);
    const low = Math.min(open, price) * (1 - Math.abs(Math.sin(i * 3 + seed)) * 0.01);
    const close = price;
    const volume = 1000000 + (Math.sin(i * 0.5 + seed) * 500000) + (seed % 1000000);
    
    history.push({
      timestamp: timestamp.toISOString(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume),
      adjusted_close: Math.round(close * 100) / 100
    });
  }

  return history;
}

function getIntervalsPerDay(interval: string): number {
  const intervals: Record<string, number> = {
    '1m': 1440,    // 24 * 60
    '2m': 720,     // 24 * 30
    '5m': 288,     // 24 * 12
    '15m': 96,     // 24 * 4
    '30m': 48,     // 24 * 2
    '60m': 24,     // 24 * 1
    '90m': 16,     // 24 * 2/3
    '1h': 24,      // 24 * 1
    '1d': 1,       // 1 per day
    '5d': 0.2,     // 1 per 5 days
    '1wk': 0.14,   // 1 per week
    '1mo': 0.033,  // 1 per month
    '3mo': 0.011   // 1 per 3 months
  };
  return intervals[interval] || 1;
}

function getDaysForPeriod(period: string): number {
  const periods: Record<string, number> = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
    '10y': 3650,
    'ytd': 365,
    'max': 3650
  };
  return periods[period] || 30;
}

function getIntervalMs(interval: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '2m': 2 * 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '60m': 60 * 60 * 1000,
    '90m': 90 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '5d': 5 * 24 * 60 * 60 * 1000,
    '1wk': 7 * 24 * 60 * 60 * 1000,
    '1mo': 30 * 24 * 60 * 60 * 1000,
    '3mo': 90 * 24 * 60 * 60 * 1000
  };
  return intervals[interval] || 24 * 60 * 60 * 1000;
}

async function fetchRealHistory(symbol: string, period: string, interval?: string): Promise<any[]> {
  // Retry logic with exponential backoff
  const maxRetries = 2;
  const baseDelay = 250;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Fetch historical OHLCV data
      const ohlcvData = await fetchHistoryData(symbol, period);
      
      if (ohlcvData.length === 0) {
        throw new Error(`No historical data found for ${symbol}`);
      }
      
      // Calculate technical indicators for multiple periods
      const sma20Indicators = calculateAllIndicators(ohlcvData, 20, 14, 14);
      const sma50Indicators = calculateAllIndicators(ohlcvData, 50, 14, 14);
      const sma200Indicators = calculateAllIndicators(ohlcvData, 200, 14, 14);
      
      // Combine OHLCV data with technical indicators
      const history = ohlcvData.map((candle, index) => {
        // Calculate 30-day average volume for each point
        const startIdx = Math.max(0, index - 29);
        const recentVolume = ohlcvData.slice(startIdx, index + 1).map(h => h.v);
        const avgVolume30d = recentVolume.length > 0 
          ? recentVolume.reduce((sum, vol) => sum + vol, 0) / recentVolume.length 
          : candle.v;
        
        // Calculate 52-week range up to this point
        const historicalData = ohlcvData.slice(0, index + 1);
        const prices = historicalData.map(h => h.h);
        const lowPrices = historicalData.map(h => h.l);
        const range52w = {
          high: prices.length > 0 ? Math.max(...prices) : candle.h,
          low: lowPrices.length > 0 ? Math.min(...lowPrices) : candle.l
        };
        
        return {
          timestamp: candle.t,
          open: candle.o,
          high: candle.h,
          low: candle.l,
          close: candle.c,
          volume: candle.v,
          date: new Date(candle.t).toISOString().split('T')[0],
          // Enhanced technical indicators
          sma_20: sma20Indicators.sma[index] || null,
          sma_50: sma50Indicators.sma[index] || null,
          sma_200: sma200Indicators.sma[index] || null,
          rsi_14: sma20Indicators.rsi[index] || null,
          atr_14: sma20Indicators.atr[index] || null,
          // Additional metrics
          avg_volume_30d: Math.round(avgVolume30d),
          range_52w: range52w,
          day_change_pct: index > 0 
            ? ((candle.c - ohlcvData[index - 1]!.c) / ohlcvData[index - 1]!.c) * 100 
            : 0
        };
      });
      
      return history;
      
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`Error fetching history for ${symbol}:`, error);
        throw new Error(`Failed to fetch historical data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Wait before retry with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed to fetch history for ${symbol} after ${maxRetries + 1} attempts`);
}
