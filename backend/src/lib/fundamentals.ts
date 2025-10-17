/**
 * Fundamentals Provider Module
 * Fetches fundamental data from Yahoo Finance with LRU caching
 */

import fetch from 'node-fetch';

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      trailingPE?: number;
      pegRatio?: number;
      enterpriseValue?: number;
      ebitda?: number;
      returnOnEquity?: number;
      grossMargins?: number;
      currentRatio?: number;
      debtToEquity?: number;
      netDebtToEbitda?: number;
      earningsGrowth?: number;
      revenueGrowth?: number;
      earningsDate?: {
        raw: number;
        fmt: string;
      };
      epsTrailingTwelveMonths?: number;
      epsForward?: number;
      enterpriseToEbitda?: number;
      enterpriseToRevenue?: number;
      priceToBook?: number;
      priceToSalesTrailing12Months?: number;
      profitMargins?: number;
      operatingMargins?: number;
      returnOnAssets?: number;
      returnOnEquity?: number;
      totalCash?: number;
      totalDebt?: number;
      totalRevenue?: number;
      freeCashflow?: number;
      operatingCashflow?: number;
    }>;
  };
}

interface YahooInsiderResponse {
  insiderTransactions: {
    result: Array<{
      symbol: string;
      transactions: Array<{
        date: number;
        transactionType: string;
        shares: number;
        price?: number;
        value?: number;
        insiderName?: string;
      }>;
    }>;
  };
}

// LRU Cache implementation
class LRUCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) { // 5 minutes
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: any): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// Global cache instance
const fundamentalsCache = new LRUCache(100, 5 * 60 * 1000); // 5 minutes TTL

/**
 * Get fundamental data for multiple symbols
 */
export async function getFundamentals(symbols: string[]): Promise<Array<{
  symbol: string;
  pe_ttm: number | null;
  peg: number | null;
  ev_ebitda: number | null;
  roic: number | null;
  gross_margin_pct: number | null;
  net_debt_to_ebitda: number | null;
  current_ratio: number | null;
  earnings_date: string | null;
  eps_consensus: number | null;
  eps_actual: number | null;
  insider_txns: Array<{
    date: string;
    transaction_type: string;
    shares: number;
    price?: number;
    value?: number;
    insider_name?: string;
  }>;
  provider: string;
}>> {
  const results = [];
  
  for (const symbol of symbols) {
    try {
      const data = await getSymbolFundamentals(symbol);
      results.push(data);
    } catch (error) {
      console.error(`Error fetching fundamentals for ${symbol}:`, error);
      // Return null data for failed symbols
      results.push({
        symbol,
        pe_ttm: null,
        peg: null,
        ev_ebitda: null,
        roic: null,
        gross_margin_pct: null,
        net_debt_to_ebitda: null,
        current_ratio: null,
        earnings_date: null,
        eps_consensus: null,
        eps_actual: null,
        insider_txns: [],
        provider: 'yahoo'
      });
    }
  }
  
  return results;
}

/**
 * Get fundamental data for a single symbol with caching
 */
async function getSymbolFundamentals(symbol: string): Promise<{
  symbol: string;
  pe_ttm: number | null;
  peg: number | null;
  ev_ebitda: number | null;
  roic: number | null;
  gross_margin_pct: number | null;
  net_debt_to_ebitda: number | null;
  current_ratio: number | null;
  earnings_date: string | null;
  eps_consensus: number | null;
  eps_actual: number | null;
  insider_txns: Array<{
    date: string;
    transaction_type: string;
    shares: number;
    price?: number;
    value?: number;
    insider_name?: string;
  }>;
  provider: string;
}> {
  const cacheKey = `fundamentals_${symbol}`;
  const cached = fundamentalsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Fetch quote data and insider transactions in parallel
    const [quoteData, insiderData] = await Promise.all([
      fetchQuoteData(symbol),
      fetchInsiderData(symbol)
    ]);

    const result = {
      symbol,
      pe_ttm: quoteData.trailingPE || null,
      peg: quoteData.pegRatio || null,
      ev_ebitda: calculateEvEbitda(quoteData.enterpriseValue, quoteData.ebitda),
      roic: quoteData.returnOnEquity || null,
      gross_margin_pct: quoteData.grossMargins ? quoteData.grossMargins * 100 : null,
      net_debt_to_ebitda: quoteData.netDebtToEbitda || null,
      current_ratio: quoteData.currentRatio || null,
      earnings_date: quoteData.earningsDate?.fmt || null,
      eps_consensus: quoteData.epsForward || null,
      eps_actual: quoteData.epsTrailingTwelveMonths || null,
      insider_txns: insiderData,
      provider: 'yahoo'
    };

    // Cache the result
    fundamentalsCache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.error(`Failed to fetch fundamentals for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Fetch quote data from Yahoo Finance
 */
async function fetchQuoteData(symbol: string): Promise<any> {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data: YahooQuoteResponse = await response.json() as YahooQuoteResponse;
  const result = data.quoteResponse?.result?.[0];
  
  if (!result) {
    throw new Error(`No data found for symbol ${symbol}`);
  }

  return result;
}

/**
 * Fetch insider transaction data from Yahoo Finance
 */
async function fetchInsiderData(symbol: string): Promise<Array<{
  date: string;
  transaction_type: string;
  shares: number;
  price?: number;
  value?: number;
  insider_name?: string;
}>> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/insiderTransactions?symbol=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`Insider data not available for ${symbol}: ${response.status}`);
      return [];
    }

    const data: YahooInsiderResponse = await response.json() as YahooInsiderResponse;
    const result = data.insiderTransactions?.result?.[0];
    
    if (!result || !result.transactions) {
      return [];
    }

    return result.transactions.map(txn => ({
      date: new Date(txn.date * 1000).toISOString().split('T')[0],
      transaction_type: txn.transactionType,
      shares: txn.shares,
      price: txn.price,
      value: txn.value,
      insider_name: txn.insiderName
    }));

  } catch (error) {
    console.warn(`Failed to fetch insider data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Calculate EV/EBITDA ratio
 */
function calculateEvEbitda(enterpriseValue?: number, ebitda?: number): number | null {
  if (!enterpriseValue || !ebitda || ebitda === 0) {
    return null;
  }
  return enterpriseValue / ebitda;
}

/**
 * Clear the fundamentals cache
 */
export function clearFundamentalsCache(): void {
  fundamentalsCache.clear();
}

/**
 * Get cache statistics
 */
export function getFundamentalsCacheStats(): { size: number; keys: string[] } {
  return {
    size: fundamentalsCache.size(),
    keys: fundamentalsCache.keys()
  };
}
