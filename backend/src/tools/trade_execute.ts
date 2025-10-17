import * as Sentry from '@sentry/node';
import { generateToolCallId } from '../lib/uuid.js';
import { auditLogger } from '../lib/audit.js';
import { 
  TradeExecuteInput, 
  SuccessResponse, 
  ErrorResponse 
} from '../lib/schema.js';
import { isStubMode } from '../env.js';

export async function tradeExecute(input: TradeExecuteInput): Promise<SuccessResponse | ErrorResponse> {
  const toolCallId = generateToolCallId();
  const startTime = Date.now();

  // Add breadcrumb for tool execution
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message: 'Executing trade_execute tool',
      category: 'tool',
      data: {
        tool_name: 'trade_execute',
        tool_call_id: toolCallId,
        trades_count: input.trades.length,
        stub_mode: isStubMode()
      },
      level: 'info'
    });
  }

  try {
    let execution: any;

    if (isStubMode()) {
      // In stub mode, only simulate trades - never execute real ones
      execution = generateStubExecution(input.trades);
    } else {
      // TODO: Implement real trade execution
      execution = await performRealExecution(input.trades);
    }

    const response: SuccessResponse = {
      tool_call_id: toolCallId,
      data: {
        execution,
        source_refs: [toolCallId]
      }
    };

    const duration = Date.now() - startTime;
    auditLogger.logToolCall(toolCallId, 'trade_execute', input, response, duration);

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Capture exception in Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        tags: {
          tool_name: 'trade_execute',
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
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error executing trades'
      }
    };

    auditLogger.logToolCall(toolCallId, 'trade_execute', input, errorResponse, duration, {
      code: 'EXECUTION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return errorResponse;
  }
}

function generateStubExecution(trades: Array<{symbol: string, action: 'buy' | 'sell', quantity: number, order_type: 'market' | 'limit' | 'stop', price?: number, stop_price?: number}>): any {
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

  const executedTrades = trades.map((trade, index) => {
    const basePrice = basePrices[trade.symbol] || 100.00;
    let executionPrice = basePrice;
    
    // Simulate different execution scenarios based on order type
    switch (trade.order_type) {
      case 'market':
        executionPrice = basePrice * (1 + (Math.random() - 0.5) * 0.002); // ±0.1% slippage
        break;
      case 'limit':
        executionPrice = trade.price || basePrice;
        // Simulate partial fills for limit orders
        if (Math.random() < 0.3) {
          return {
            symbol: trade.symbol,
            action: trade.action,
            quantity: Math.floor(trade.quantity * 0.7), // 70% fill
            price: executionPrice,
            fees: executionPrice * Math.floor(trade.quantity * 0.7) * 0.001,
            total_cost: executionPrice * Math.floor(trade.quantity * 0.7) * 1.001,
            order_id: `STUB_${Date.now()}_${index}`,
            status: 'partial'
          };
        }
        break;
      case 'stop':
        executionPrice = trade.stop_price || basePrice;
        break;
    }

    const fees = executionPrice * trade.quantity * 0.001; // 0.1% fee
    const totalCost = executionPrice * trade.quantity + fees;

    return {
      symbol: trade.symbol,
      action: trade.action,
      quantity: trade.quantity,
      price: Math.round(executionPrice * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      order_id: `STUB_${Date.now()}_${index}`,
      status: 'filled' as const
    };
  });

  // Calculate portfolio after execution
  const totalCost = executedTrades.reduce((sum, trade) => {
    return sum + (trade.action === 'buy' ? trade.total_cost : -trade.total_cost);
  }, 0);

  const portfolioAfter = {
    total_value: 100000 + totalCost, // Starting with $100k
    cash: 10000 - totalCost
  };

  return {
    trades: executedTrades,
    portfolio_after: portfolioAfter
  };
}

async function performRealExecution(trades: Array<{symbol: string, action: 'buy' | 'sell', quantity: number, order_type: 'market' | 'limit' | 'stop', price?: number, stop_price?: number}>): Promise<any> {
  // TODO: Implement real trade execution
  // This would connect to actual broker APIs (Interactive Brokers, Alpaca, etc.)
  // For now, throw an error to prevent accidental real trading
  throw new Error('Real trade execution is not implemented. This is a safety measure to prevent accidental trading.');
}
