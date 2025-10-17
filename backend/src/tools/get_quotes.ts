import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  GetQuotesInput, 
  SuccessResponse, 
  ErrorResponse, 
  QuoteData 
} from '../lib/schema.js';
import { isStubMode } from '../env.js';

export async function getQuotes(input: GetQuotesInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  try {
    let quotes: QuoteData[];

    if (isStubMode()) {
      // Generate deterministic stub data
      quotes = generateStubQuotes(input.symbols);
    } else {
      // TODO: Implement real quote fetching from APIs
      quotes = await fetchRealQuotes(input.symbols, input.fields);
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
      stack: error instanceof Error ? error.stack : undefined
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
  // TODO: Implement real quote fetching from Yahoo Finance, Google Finance, etc.
  // This would make API calls to external data providers
  throw new Error('Real quote fetching not implemented yet');
}
