import { z } from 'zod';

// Base response schema
export const BaseResponseSchema = z.object({
  tool_call_id: z.string().uuid(),
});

export const ErrorResponseSchema = BaseResponseSchema.extend({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const SuccessResponseSchema = BaseResponseSchema.extend({
  data: z.any(),
});

// Tool input schemas
export const GetPortfolioSchema = z.object({
  user_id: z.string().optional(),
});

export const GetQuotesSchema = z.object({
  symbols: z.array(z.string()),
  fields: z.array(z.string()).optional(),
});

export const GetFundamentalsSchema = z.object({
  symbols: z.array(z.string()),
  metrics: z.array(z.string()).optional(),
});

export const GetNewsSchema = z.object({
  symbols: z.array(z.string()),
  hours_back: z.number().optional().default(24),
});

export const GetHistorySchema = z.object({
  symbol: z.string(),
  period: z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']),
  interval: z.enum(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']).optional(),
});

export const TradeSimulateSchema = z.object({
  trades: z.array(z.object({
    symbol: z.string(),
    action: z.enum(['buy', 'sell']),
    quantity: z.number().positive(),
    price: z.number().positive().optional(),
  })),
});

export const TradeExecuteSchema = z.object({
  trades: z.array(z.object({
    symbol: z.string(),
    action: z.enum(['buy', 'sell']),
    quantity: z.number().positive(),
    order_type: z.enum(['market', 'limit', 'stop']),
    price: z.number().positive().optional(),
    stop_price: z.number().positive().optional(),
  })),
});

export const LogEventSchema = z.object({
  event_type: z.enum(['signal', 'suggestion', 'trade', 'error', 'alert']),
  data: z.record(z.any()),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// Data schemas
export const QuoteDataSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change: z.number(),
  change_percent: z.number(),
  volume: z.number(),
  timestamp: z.string(),
  // Enhanced properties for LIVE mode
  source: z.string().optional(),
  error: z.string().optional(),
  day_change_pct: z.number().optional(),
  range_52w: z.object({
    high: z.number(),
    low: z.number(),
  }).optional(),
  avg_volume_30d: z.number().optional(),
  sma20: z.number().nullable().optional(),
  sma50: z.number().nullable().optional(),
  sma200: z.number().nullable().optional(),
  atr14: z.number().nullable().optional(),
  rsi14: z.number().nullable().optional(),
});

export const InsiderTransactionSchema = z.object({
  date: z.string(),
  transaction_type: z.string(),
  shares: z.number(),
  price: z.number().optional(),
  value: z.number().optional(),
  insider_name: z.string().optional(),
});

export const FundamentalDataSchema = z.object({
  symbol: z.string(),
  pe_ratio: z.number().nullable().optional(),
  peg_ratio: z.number().nullable().optional(),
  ev_ebitda: z.number().nullable().optional(),
  roic: z.number().nullable().optional(),
  gross_margin: z.number().nullable().optional(),
  current_ratio: z.number().nullable().optional(),
  debt_to_equity: z.number().nullable().optional(),
  net_debt_to_ebitda: z.number().nullable().optional(),
  eps_consensus: z.number().nullable().optional(),
  eps_actual: z.number().nullable().optional(),
  earnings_date: z.string().nullable().optional(),
  timestamp: z.string(),
  // Enhanced properties for LIVE mode
  pe_ttm: z.number().nullable().optional(),
  peg: z.number().nullable().optional(),
  gross_margin_pct: z.number().nullable().optional(),
  insider_txns: z.array(InsiderTransactionSchema).optional(),
  provider: z.string().optional(),
});

export const NewsDataSchema = z.object({
  symbol: z.string(),
  headline: z.string(),
  summary: z.string(),
  sentiment: z.number().min(-1).max(1),
  impact_score: z.number().min(0).max(1),
  published_at: z.string(),
  source: z.string(),
  tags: z.array(z.enum(['earnings', 'guidance', 'regulatory', 'product'])),
});

export const TechnicalDataSchema = z.object({
  symbol: z.string(),
  rsi_14: z.number().min(0).max(100),
  atr_14: z.number().positive(),
  sma_20: z.number().positive(),
  sma_50: z.number().positive(),
  sma_200: z.number().positive(),
  high_52w: z.number().positive(),
  low_52w: z.number().positive(),
  volume: z.number().positive(),
  avg_volume_30d: z.number().positive(),
  timestamp: z.string(),
});

export const InsiderTransactionSchema = z.object({
  symbol: z.string(),
  insider_name: z.string(),
  transaction_type: z.enum(['buy', 'sell']),
  shares: z.number().positive(),
  price: z.number().positive(),
  value: z.number().positive(),
  date: z.string(),
});

export const PortfolioPositionSchema = z.object({
  symbol: z.string(),
  quantity: z.number(),
  avg_price: z.number().positive(),
  current_price: z.number().positive(),
  market_value: z.number(),
  weight: z.number().min(0).max(1),
});

export const PortfolioSchema = z.object({
  positions: z.array(PortfolioPositionSchema),
  cash: z.number(),
  total_value: z.number(),
});

// Type exports
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type GetPortfolioInput = z.infer<typeof GetPortfolioSchema>;
export type GetQuotesInput = z.infer<typeof GetQuotesSchema>;
export type GetFundamentalsInput = z.infer<typeof GetFundamentalsSchema>;
export type GetNewsInput = z.infer<typeof GetNewsSchema>;
export type GetHistoryInput = z.infer<typeof GetHistorySchema>;
export type TradeSimulateInput = z.infer<typeof TradeSimulateSchema>;
export type TradeExecuteInput = z.infer<typeof TradeExecuteSchema>;
export type LogEventInput = z.infer<typeof LogEventSchema>;
export type QuoteData = z.infer<typeof QuoteDataSchema>;
export type FundamentalData = z.infer<typeof FundamentalDataSchema>;
export type NewsData = z.infer<typeof NewsDataSchema>;
export type TechnicalData = z.infer<typeof TechnicalDataSchema>;
export type InsiderTransaction = z.infer<typeof InsiderTransactionSchema>;
export type PortfolioPosition = z.infer<typeof PortfolioPositionSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
