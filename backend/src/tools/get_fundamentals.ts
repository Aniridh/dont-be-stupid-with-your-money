import * as Sentry from '@sentry/node';
import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  GetFundamentalsInput, 
  SuccessResponse, 
  ErrorResponse, 
  FundamentalData 
} from '../lib/schema.js';
import { isStubMode, isLiveFunds } from '../env.js';
import { getFundamentals as fetchFundamentalsData } from '../lib/fundamentals.js';

export async function getFundamentals(input: GetFundamentalsInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  // Add breadcrumb for tool execution
  if (process.env['SENTRY_DSN']) {
    Sentry.addBreadcrumb({
      message: 'Executing get_fundamentals tool',
      category: 'tool',
      data: {
        tool_name: 'get_fundamentals',
        tool_call_id: toolCallId,
        symbols: input.symbols
      },
      level: 'info'
    });
  }

  try {
    let fundamentals: FundamentalData[];

    if (isLiveFunds()) {
      try {
        // LIVE mode: Use Yahoo Finance with LRU caching
        fundamentals = await fetchRealFundamentals(input.symbols, input.metrics);
      } catch (error) {
        console.warn(`⚠️ Live fundamentals fetch failed, falling back to stub: ${error instanceof Error ? error.message : 'Unknown error'}`);
        fundamentals = generateStubFundamentals(input.symbols);
      }
    } else {
      // STUB mode: Generate deterministic stub data
      fundamentals = generateStubFundamentals(input.symbols);
    }

    const response: SuccessResponse = {
      tool_call_id: toolCallId,
      data: {
        fundamentals,
        source_refs: [toolCallId]
      }
    };

    const duration = Date.now() - startTime;
    auditLogger.logToolCall(toolCallId, 'get_fundamentals', input, response, duration);

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Capture exception in Sentry
    if (process.env['SENTRY_DSN']) {
      Sentry.captureException(error, {
        tags: {
          tool_name: 'get_fundamentals',
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
        code: 'FUNDAMENTALS_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error fetching fundamentals'
      }
    };

    auditLogger.logToolCall(toolCallId, 'get_fundamentals', input, errorResponse, duration, {
      code: 'FUNDAMENTALS_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      ...(error instanceof Error && error.stack && { stack: error.stack })
    });

    return errorResponse;
  }
}

function generateStubFundamentals(symbols: string[]): FundamentalData[] {
  const baseFundamentals: Record<string, Partial<FundamentalData>> = {
    'AAPL': {
      pe_ratio: 28.5,
      peg_ratio: 1.2,
      ev_ebitda: 22.1,
      roic: 0.15,
      gross_margin: 0.42,
      current_ratio: 1.8,
      debt_to_equity: 0.3,
      net_debt_to_ebitda: 0.8,
      eps_consensus: 6.15,
      eps_actual: 6.43,
      earnings_date: '2024-01-25'
    },
    'TSLA': {
      pe_ratio: 45.2,
      peg_ratio: 2.1,
      ev_ebitda: 35.8,
      roic: 0.08,
      gross_margin: 0.18,
      current_ratio: 1.2,
      debt_to_equity: 0.15,
      net_debt_to_ebitda: 0.2,
      eps_consensus: 3.25,
      eps_actual: 3.62,
      earnings_date: '2024-01-24'
    },
    'SPY': {
      pe_ratio: 22.1,
      peg_ratio: 1.8,
      ev_ebitda: 18.5,
      roic: 0.12,
      gross_margin: 0.35,
      current_ratio: 1.5,
      debt_to_equity: 0.4,
      net_debt_to_ebitda: 1.2,
      eps_consensus: 18.50,
      eps_actual: 18.75,
      earnings_date: '2024-01-30'
    },
    'MSFT': {
      pe_ratio: 32.8,
      peg_ratio: 1.5,
      ev_ebitda: 25.2,
      roic: 0.18,
      gross_margin: 0.68,
      current_ratio: 2.1,
      debt_to_equity: 0.25,
      net_debt_to_ebitda: 0.6,
      eps_consensus: 11.20,
      eps_actual: 11.45,
      earnings_date: '2024-01-23'
    }
  };

  return symbols.map(symbol => {
    const base = baseFundamentals[symbol] || {
      pe_ratio: 25.0,
      peg_ratio: 1.5,
      ev_ebitda: 20.0,
      roic: 0.12,
      gross_margin: 0.40,
      current_ratio: 1.5,
      debt_to_equity: 0.35,
      net_debt_to_ebitda: 0.8,
      eps_consensus: 5.00,
      eps_actual: 5.25,
      earnings_date: '2024-01-31'
    };

    const seed = symbol.charCodeAt(0) + symbol.charCodeAt(symbol.length - 1);
    const variation = (seed % 20 - 10) / 100; // -0.1 to +0.1

    return {
      symbol,
      pe_ratio: Math.round((base.pe_ratio! * (1 + variation)) * 100) / 100,
      peg_ratio: Math.round((base.peg_ratio! * (1 + variation)) * 100) / 100,
      ev_ebitda: Math.round((base.ev_ebitda! * (1 + variation)) * 100) / 100,
      roic: Math.round((base.roic! * (1 + variation)) * 1000) / 1000,
      gross_margin: Math.round((base.gross_margin! * (1 + variation)) * 1000) / 1000,
      current_ratio: Math.round((base.current_ratio! * (1 + variation)) * 100) / 100,
      debt_to_equity: Math.round((base.debt_to_equity! * (1 + variation)) * 100) / 100,
      net_debt_to_ebitda: Math.round((base.net_debt_to_ebitda! * (1 + variation)) * 100) / 100,
      eps_consensus: Math.round((base.eps_consensus! * (1 + variation)) * 100) / 100,
      eps_actual: base.eps_actual ? Math.round((base.eps_actual * (1 + variation)) * 100) / 100 : undefined,
      earnings_date: base.earnings_date,
      timestamp: new Date().toISOString()
    };
  });
}

async function fetchRealFundamentals(symbols: string[], metrics?: string[]): Promise<FundamentalData[]> {
  try {
    const fundamentalsData = await fetchFundamentalsData(symbols);
    
    return fundamentalsData.map((data: any) => ({
      symbol: data.symbol,
      pe_ratio: data.pe_ttm,
      peg_ratio: data.peg,
      ev_ebitda: data.ev_ebitda,
      roic: data.roic,
      gross_margin: data.gross_margin_pct ? data.gross_margin_pct / 100 : null,
      current_ratio: data.current_ratio,
      debt_to_equity: null, // Not available in Yahoo Finance
      net_debt_to_ebitda: data.net_debt_to_ebitda,
      eps_consensus: data.eps_consensus,
      eps_actual: data.eps_actual,
      earnings_date: data.earnings_date,
      timestamp: new Date().toISOString(),
      // Enhanced properties
      pe_ttm: data.pe_ttm,
      peg: data.peg,
      gross_margin_pct: data.gross_margin_pct,
      insider_txns: data.insider_txns,
      provider: data.provider
    }));
  } catch (error) {
    console.error('Error fetching real fundamentals:', error);
    throw new Error(`Failed to fetch fundamentals: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
