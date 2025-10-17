import * as Sentry from '@sentry/node';
import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  GetPortfolioInput, 
  SuccessResponse, 
  ErrorResponse, 
  Portfolio,
  PortfolioPosition 
} from '../lib/schema.js';
import { isStubMode } from '../env.js';

export async function getPortfolio(input: GetPortfolioInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  // Add breadcrumb for tool execution
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message: 'Executing get_portfolio tool',
      category: 'tool',
      data: {
        tool_name: 'get_portfolio',
        tool_call_id: toolCallId,
        user_id: input.user_id
      },
      level: 'info'
    });
  }

  try {
    let portfolio: Portfolio;

    if (isStubMode()) {
      // Generate deterministic stub data
      portfolio = generateStubPortfolio(input.user_id);
    } else {
      // TODO: Implement real portfolio fetching from database/API
      portfolio = await fetchRealPortfolio(input.user_id);
    }

    const response: SuccessResponse = {
      tool_call_id: toolCallId,
      data: {
        portfolio: portfolio.positions,
        cash: portfolio.cash,
        total_value: portfolio.total_value,
        source_refs: [toolCallId]
      }
    };

    const duration = Date.now() - startTime;
    auditLogger.logToolCall(toolCallId, 'get_portfolio', input, response, duration);

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Capture exception in Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          tool_name: 'get_portfolio',
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
        code: 'PORTFOLIO_FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error fetching portfolio'
      }
    };

    auditLogger.logToolCall(toolCallId, 'get_portfolio', input, errorResponse, duration, {
      code: 'PORTFOLIO_FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return errorResponse;
  }
}

function generateStubPortfolio(userId?: string): Portfolio {
  // Deterministic stub data based on user ID or default
  const seed = userId ? userId.charCodeAt(0) : 42;
  const positions: PortfolioPosition[] = [
    {
      symbol: 'AAPL',
      quantity: 100 + (seed % 50),
      avg_price: 150.00 + (seed % 20),
      current_price: 175.43,
      market_value: (100 + (seed % 50)) * 175.43,
      weight: 0.25 + (seed % 10) / 100
    },
    {
      symbol: 'TSLA',
      quantity: 50 + (seed % 25),
      avg_price: 200.00 + (seed % 30),
      current_price: 248.50,
      market_value: (50 + (seed % 25)) * 248.50,
      weight: 0.20 + (seed % 8) / 100
    },
    {
      symbol: 'SPY',
      quantity: 200 + (seed % 100),
      avg_price: 400.00 + (seed % 40),
      current_price: 445.20,
      market_value: (200 + (seed % 100)) * 445.20,
      weight: 0.35 + (seed % 10) / 100
    },
    {
      symbol: 'MSFT',
      quantity: 75 + (seed % 40),
      avg_price: 300.00 + (seed % 25),
      current_price: 385.75,
      market_value: (75 + (seed % 40)) * 385.75,
      weight: 0.20 + (seed % 7) / 100
    }
  ];

  const totalValue = positions.reduce((sum, pos) => sum + pos.market_value, 0);
  const cash = 10000 + (seed % 5000);

  // Normalize weights
  positions.forEach(pos => {
    pos.weight = pos.market_value / (totalValue + cash);
  });

  return {
    positions,
    cash,
    total_value: totalValue + cash
  };
}

async function fetchRealPortfolio(userId?: string): Promise<Portfolio> {
  // TODO: Implement real portfolio fetching
  // This would connect to your database or portfolio API
  throw new Error('Real portfolio fetching not implemented yet');
}
