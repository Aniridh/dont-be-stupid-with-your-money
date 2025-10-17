/**
 * Technical Analysis Utilities
 * Simple implementations of common technical indicators
 */

export interface OHLCV {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

export interface TAResult {
  sma: number[];
  rsi: number[];
  atr: number[];
}

/**
 * Calculate Simple Moving Average (SMA) for a given period
 * @param prices Array of closing prices
 * @param period Number of periods to average
 * @returns Array of SMA values (undefined for insufficient data)
 */
export function calculateSMA(prices: number[], period: number): (number | undefined)[] {
  if (prices.length < period) {
    return new Array(prices.length).fill(undefined);
  }

  const sma: (number | undefined)[] = new Array(period - 1).fill(undefined);
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
    sma.push(sum / period);
  }
  
  return sma;
}

/**
 * Calculate Relative Strength Index (RSI) for a given period
 * @param prices Array of closing prices
 * @param period Number of periods to calculate RSI (default: 14)
 * @returns Array of RSI values (undefined for insufficient data)
 */
export function calculateRSI(prices: number[], period: number = 14): (number | undefined)[] {
  if (prices.length < period + 1) {
    return new Array(prices.length).fill(undefined);
  }

  const rsi: (number | undefined)[] = new Array(period).fill(undefined);
  
  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate RSI for the first valid period
  if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsi[period] = 100 - (100 / (1 + rs));
  }
  
  // Calculate RSI for remaining periods using Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = changes[i - 1];
    let gain = 0;
    let loss = 0;
    
    if (change > 0) {
      gain = change;
    } else {
      loss = Math.abs(change);
    }
    
    // Wilder's smoothing: new_avg = (prev_avg * (period - 1) + current) / period
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }
  
  return rsi;
}

/**
 * Calculate Average True Range (ATR) for a given period
 * @param data Array of OHLCV data
 * @param period Number of periods to calculate ATR (default: 14)
 * @returns Array of ATR values (undefined for insufficient data)
 */
export function calculateATR(data: OHLCV[], period: number = 14): (number | undefined)[] {
  if (data.length < period + 1) {
    return new Array(data.length).fill(undefined);
  }

  const atr: (number | undefined)[] = new Array(period).fill(undefined);
  
  // Calculate True Range for each period
  const trueRanges: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    const tr1 = current.h - current.l;
    const tr2 = Math.abs(current.h - previous.c);
    const tr3 = Math.abs(current.l - previous.c);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate initial ATR as simple average
  let atrSum = 0;
  for (let i = 0; i < period; i++) {
    atrSum += trueRanges[i];
  }
  
  atr[period] = atrSum / period;
  
  // Calculate ATR for remaining periods using Wilder's smoothing
  for (let i = period + 1; i < data.length; i++) {
    const currentTR = trueRanges[i - 1];
    const prevATR = atr[i - 1]!;
    
    // Wilder's smoothing: new_atr = (prev_atr * (period - 1) + current_tr) / period
    atr[i] = (prevATR * (period - 1) + currentTR) / period;
  }
  
  return atr;
}

/**
 * Calculate all technical indicators for a given dataset
 * @param data Array of OHLCV data
 * @param smaPeriod Period for SMA calculation
 * @param rsiPeriod Period for RSI calculation (default: 14)
 * @param atrPeriod Period for ATR calculation (default: 14)
 * @returns Object containing arrays of calculated indicators
 */
export function calculateAllIndicators(
  data: OHLCV[],
  smaPeriod: number,
  rsiPeriod: number = 14,
  atrPeriod: number = 14
): TAResult {
  const closingPrices = data.map(d => d.c);
  
  return {
    sma: calculateSMA(closingPrices, smaPeriod) as number[],
    rsi: calculateRSI(closingPrices, rsiPeriod) as number[],
    atr: calculateATR(data, atrPeriod) as number[]
  };
}

/**
 * Get the latest valid value from a technical indicator array
 * @param indicator Array of indicator values (may contain undefined)
 * @returns Latest valid value or undefined if none found
 */
export function getLatestValue(indicator: (number | undefined)[]): number | undefined {
  for (let i = indicator.length - 1; i >= 0; i--) {
    if (indicator[i] !== undefined) {
      return indicator[i];
    }
  }
  return undefined;
}

/**
 * Check if a price is above/below SMA
 * @param price Current price
 * @param sma SMA value
 * @returns 1 if above, -1 if below, 0 if equal
 */
export function compareToSMA(price: number, sma: number): number {
  if (price > sma) return 1;
  if (price < sma) return -1;
  return 0;
}

/**
 * Check if RSI indicates overbought/oversold conditions
 * @param rsi RSI value
 * @param overboughtThreshold Overbought threshold (default: 70)
 * @param oversoldThreshold Oversold threshold (default: 30)
 * @returns 1 if overbought, -1 if oversold, 0 if neutral
 */
export function checkRSICondition(
  rsi: number,
  overboughtThreshold: number = 70,
  oversoldThreshold: number = 30
): number {
  if (rsi >= overboughtThreshold) return 1;
  if (rsi <= oversoldThreshold) return -1;
  return 0;
}

/**
 * Calculate price change percentage
 * @param current Current price
 * @param previous Previous price
 * @returns Percentage change
 */
export function calculatePriceChange(current: number, previous: number): number {
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate volatility using ATR as percentage of price
 * @param atr ATR value
 * @param price Current price
 * @returns Volatility as percentage
 */
export function calculateVolatility(atr: number, price: number): number {
  return (atr / price) * 100;
}
