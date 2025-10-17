/**
 * TrueFoundry Gateway Integration
 * Risk scoring through TrueFoundry AI Gateway
 */

import fetch from 'node-fetch';

interface RiskFeatures {
  rsi: number;
  atr: number;
  news_sentiment_mean: number;
  pe: number;
  peg: number;
}

interface RiskScoreResponse {
  enabled: boolean;
  score?: number;
  meta?: {
    latency_ms: number;
    model: string;
  };
  error?: string;
}

/**
 * Score risk for a given set of features using TrueFoundry AI Gateway
 */
export async function scoreRisk(features: RiskFeatures): Promise<RiskScoreResponse> {
  const startTime = Date.now();
  
  // Check if TrueFoundry is configured
  const apiKey = process.env['TRUEFOUNDRY_API_KEY'];
  const gatewayUrl = process.env['TRUEFOUNDRY_GATEWAY_URL'];
  
  if (!apiKey || !gatewayUrl) {
    return {
      enabled: false,
      error: 'TrueFoundry not configured (missing API_KEY or GATEWAY_URL)'
    };
  }

  try {
    // Prepare the request payload
    const payload = {
      features: {
        rsi: features.rsi,
        atr: features.atr,
        news_sentiment_mean: features.news_sentiment_mean,
        pe: features.pe,
        peg: features.peg
      },
      model: "finsage-risk-v0",
      timestamp: new Date().toISOString()
    };

    // Make request to TrueFoundry AI Gateway
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'FinSage-Agent/1.0.0'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        enabled: true,
        error: `TrueFoundry API error: ${response.status} ${response.statusText} - ${errorText}`,
        meta: {
          latency_ms: latency,
          model: "finsage-risk-v0"
        }
      };
    }

    const result = await response.json() as any;
    
    // Extract risk score from response
    // Expected format: { score: number } or { risk_score: number } or { prediction: number }
    const score = result.score || result.risk_score || result.prediction || result.data?.score;
    
    if (typeof score !== 'number') {
      return {
        enabled: true,
        error: `Invalid response format from TrueFoundry: ${JSON.stringify(result)}`,
        meta: {
          latency_ms: latency,
          model: "finsage-risk-v0"
        }
      };
    }

    return {
      enabled: true,
      score: Math.max(0, Math.min(1, score)), // Clamp between 0 and 1
      meta: {
        latency_ms: latency,
        model: "finsage-risk-v0"
      }
    };

  } catch (error) {
    const latency = Date.now() - startTime;
    
    return {
      enabled: true,
      error: `TrueFoundry request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      meta: {
        latency_ms: latency,
        model: "finsage-risk-v0"
      }
    };
  }
}

/**
 * Batch score risk for multiple tickers
 */
export async function scoreRiskBatch(
  tickerFeatures: Array<{ ticker: string; features: RiskFeatures }>
): Promise<Array<{ ticker: string; result: RiskScoreResponse }>> {
  const results = [];
  
  for (const { ticker, features } of tickerFeatures) {
    try {
      const result = await scoreRisk(features);
      results.push({ ticker, result });
    } catch (error) {
      results.push({
        ticker,
        result: {
          enabled: true,
          error: `Failed to score risk for ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    }
  }
  
  return results;
}

/**
 * Check if TrueFoundry is configured
 */
export function isTrueFoundryConfigured(): boolean {
  const liveTF = process.env['LIVE_TF_GATEWAY'] === 'true';
  const hasCredentials = !!(process.env['TRUEFOUNDRY_API_KEY'] && process.env['TRUEFOUNDRY_GATEWAY_URL']);
  return liveTF && hasCredentials;
}

/**
 * Get TrueFoundry configuration status
 */
export function getTrueFoundryStatus(): {
  configured: boolean;
  api_key_set: boolean;
  gateway_url_set: boolean;
} {
  return {
    configured: isTrueFoundryConfigured(),
    api_key_set: !!process.env['TRUEFOUNDRY_API_KEY'],
    gateway_url_set: !!process.env['TRUEFOUNDRY_GATEWAY_URL']
  };
}
