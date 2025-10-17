#!/usr/bin/env node

/**
 * Test script to demonstrate provider badges
 * Shows how different provider types will be displayed
 */

console.log('🏷️  Provider Badge Test\n');

// Mock data with different provider types
const testSignals = [
  {
    symbol: 'AAPL',
    type: 'valuation',
    signal: 'BUY',
    confidence: 0.85,
    description: 'Strong fundamentals',
    value: 25.8,
    threshold: 20.0,
    source_refs: ['tool:get_fundamentals:uuid-123'],
    meta: { provider: 'yahoo' }
  },
  {
    symbol: 'MSFT',
    type: 'technical',
    signal: 'HOLD',
    confidence: 0.65,
    description: 'RSI indicates overbought',
    value: 75.2,
    threshold: 70.0,
    source_refs: ['tool:get_quotes:uuid-456'],
    meta: { provider: 'google' }
  },
  {
    symbol: 'GOOGL',
    type: 'momentum',
    signal: 'SELL',
    confidence: 0.72,
    description: 'Negative news sentiment',
    value: -0.3,
    threshold: -0.2,
    source_refs: ['tool:get_news:uuid-789'],
    meta: { provider: 'apify' }
  },
  {
    symbol: 'TSLA',
    type: 'quality',
    signal: 'BUY',
    confidence: 0.88,
    description: 'Low risk score',
    value: 0.25,
    threshold: 0.4,
    source_refs: ['tool:truefoundry:uuid-012'],
    meta: { provider: 'truefoundry' }
  },
  {
    symbol: 'NVDA',
    type: 'valuation',
    signal: 'HOLD',
    confidence: 0.55,
    description: 'Stub data for testing',
    value: 15.2,
    threshold: 18.0,
    source_refs: ['tool:get_fundamentals:uuid-345'],
    meta: { provider: 'stub' }
  },
  {
    symbol: 'META',
    type: 'technical',
    signal: 'SELL',
    confidence: 0.78,
    description: 'Fallback to stub data',
    value: 85.5,
    threshold: 80.0,
    source_refs: ['tool:get_quotes:uuid-678'],
    meta: { provider: 'stub_fallback' }
  }
];

const testSuggestions = [
  {
    symbol: 'AAPL',
    action: 'buy',
    current_weight: 0.15,
    suggested_weight: 0.20,
    reasoning: 'Strong fundamentals and positive momentum',
    confidence: 0.85,
    risk_level: 'low',
    source_refs: ['tool:get_fundamentals:uuid-123', 'tool:get_quotes:uuid-456'],
    meta: { provider: 'yahoo' }
  },
  {
    symbol: 'MSFT',
    action: 'hold',
    current_weight: 0.12,
    suggested_weight: 0.12,
    reasoning: 'Stable performance, no changes needed',
    confidence: 0.65,
    risk_level: 'medium',
    source_refs: ['tool:get_quotes:uuid-456'],
    meta: { provider: 'google' }
  },
  {
    symbol: 'GOOGL',
    action: 'sell',
    current_weight: 0.18,
    suggested_weight: 0.10,
    reasoning: 'Negative news sentiment and high valuation',
    confidence: 0.72,
    risk_level: 'high',
    source_refs: ['tool:get_news:uuid-789', 'tool:get_fundamentals:uuid-012'],
    meta: { provider: 'apify' }
  },
  {
    symbol: 'TSLA',
    action: 'buy',
    current_weight: 0.08,
    suggested_weight: 0.15,
    reasoning: 'Low risk score and strong technical indicators',
    confidence: 0.88,
    risk_level: 'low',
    source_refs: ['tool:truefoundry:uuid-012', 'tool:get_quotes:uuid-345'],
    meta: { provider: 'truefoundry' }
  },
  {
    symbol: 'NVDA',
    action: 'hold',
    current_weight: 0.10,
    suggested_weight: 0.10,
    reasoning: 'Stub data - no real analysis available',
    confidence: 0.55,
    risk_level: 'medium',
    source_refs: ['tool:get_fundamentals:uuid-345'],
    meta: { provider: 'stub' }
  },
  {
    symbol: 'META',
    action: 'sell',
    current_weight: 0.14,
    suggested_weight: 0.08,
    reasoning: 'Fallback analysis due to API failure',
    confidence: 0.78,
    risk_level: 'high',
    source_refs: ['tool:get_quotes:uuid-678'],
    meta: { provider: 'stub_fallback' }
  }
];

// Badge rendering functions (simplified versions)
function getProviderBadge(provider) {
  if (!provider) return '❌ NO PROVIDER';
  
  const isStub = provider.endsWith('stub') || provider.endsWith('stub_fallback');
  const isLive = ['google', 'yahoo', 'apify', 'truefoundry'].includes(provider);
  
  if (isStub) {
    return `🔘 STUB (${provider})`;
  }
  
  if (isLive) {
    return `🟢 ${provider.toUpperCase()}`;
  }
  
  return `🔵 ${provider.toUpperCase()}`;
}

console.log('📊 Signal Table with Provider Badges:');
console.log('=' .repeat(80));
console.log('Symbol | Type      | Signal | Confidence | Provider Badge');
console.log('-' .repeat(80));

testSignals.forEach(signal => {
  const badge = getProviderBadge(signal.meta?.provider);
  console.log(
    `${signal.symbol.padEnd(6)} | ${signal.type.padEnd(9)} | ${signal.signal.padEnd(6)} | ${(signal.confidence * 100).toFixed(0).padStart(10)}% | ${badge}`
  );
});

console.log('\n💡 Suggestion Cards with Provider Badges:');
console.log('=' .repeat(80));

testSuggestions.forEach(suggestion => {
  const badge = getProviderBadge(suggestion.meta?.provider);
  console.log(`\n${suggestion.symbol} - ${suggestion.action.toUpperCase()}`);
  console.log(`  Reasoning: ${suggestion.reasoning}`);
  console.log(`  Confidence: ${(suggestion.confidence * 100).toFixed(0)}% | Risk: ${suggestion.risk_level}`);
  console.log(`  Provider: ${badge}`);
});

console.log('\n🎨 Badge Color Legend:');
console.log('🟢 Green badges = LIVE data sources (Google, Yahoo, Apify, TrueFoundry)');
console.log('🔘 Gray badges = STUB data sources (stub, stub_fallback)');
console.log('🔵 Blue badges = Other/Unknown providers');

console.log('\n✅ Provider badges will make LIVE usage visually obvious to judges!');
console.log('   - LIVE data sources show green badges with provider name');
console.log('   - STUB data sources show gray badges');
console.log('   - Easy to see which data is real vs mock');
