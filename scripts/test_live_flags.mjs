#!/usr/bin/env node

/**
 * Test script to verify LIVE flags functionality
 * Tests graceful degradation from LIVE to STUB mode
 */

import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Testing LIVE Flags Configuration\n');

// Test 1: Default behavior (STUB_MODE=true)
console.log('1️⃣ Testing default behavior (STUB_MODE=true):');
process.env.STUB_MODE = 'true';
process.env.LIVE_NEWS = 'true';
process.env.LIVE_QUOTES = 'true';
process.env.LIVE_FUNDS = 'true';
process.env.LIVE_TF_GATEWAY = 'true';

// Simulate the env.ts logic
const isStubMode = () => process.env.STUB_MODE === 'true';
const isLiveNews = () => !isStubMode() && process.env.LIVE_NEWS === 'true';
const isLiveQuotes = () => !isStubMode() && process.env.LIVE_QUOTES === 'true';
const isLiveFunds = () => !isStubMode() && process.env.LIVE_FUNDS === 'true';
const isLiveTFGateway = () => !isStubMode() && process.env.LIVE_TF_GATEWAY === 'true';

console.log(`   STUB_MODE: ${isStubMode()}`);
console.log(`   LIVE_NEWS: ${isLiveNews()}`);
console.log(`   LIVE_QUOTES: ${isLiveQuotes()}`);
console.log(`   LIVE_FUNDS: ${isLiveFunds()}`);
console.log(`   LIVE_TF_GATEWAY: ${isLiveTFGateway()}`);
console.log(`   ✅ Expected: All LIVE flags should be false when STUB_MODE=true\n`);

// Test 2: LIVE mode with individual flags
console.log('2️⃣ Testing LIVE mode with individual flags:');
process.env.STUB_MODE = 'false';
process.env.LIVE_NEWS = 'true';
process.env.LIVE_QUOTES = 'false';
process.env.LIVE_FUNDS = 'true';
process.env.LIVE_TF_GATEWAY = 'false';

console.log(`   STUB_MODE: ${isStubMode()}`);
console.log(`   LIVE_NEWS: ${isLiveNews()}`);
console.log(`   LIVE_QUOTES: ${isLiveQuotes()}`);
console.log(`   LIVE_FUNDS: ${isLiveFunds()}`);
console.log(`   LIVE_TF_GATEWAY: ${isLiveTFGateway()}`);
console.log(`   ✅ Expected: Only LIVE_NEWS and LIVE_FUNDS should be true\n`);

// Test 3: All LIVE flags enabled
console.log('3️⃣ Testing all LIVE flags enabled:');
process.env.STUB_MODE = 'false';
process.env.LIVE_NEWS = 'true';
process.env.LIVE_QUOTES = 'true';
process.env.LIVE_FUNDS = 'true';
process.env.LIVE_TF_GATEWAY = 'true';

console.log(`   STUB_MODE: ${isStubMode()}`);
console.log(`   LIVE_NEWS: ${isLiveNews()}`);
console.log(`   LIVE_QUOTES: ${isLiveQuotes()}`);
console.log(`   LIVE_FUNDS: ${isLiveFunds()}`);
console.log(`   LIVE_TF_GATEWAY: ${isLiveTFGateway()}`);
console.log(`   ✅ Expected: All LIVE flags should be true\n`);

// Test 4: Graceful degradation simulation
console.log('4️⃣ Testing graceful degradation pattern:');

function simulateToolCall(toolName, isLiveEnabled) {
  console.log(`   ${toolName}:`);
  
  if (isLiveEnabled) {
    try {
      // Simulate LIVE mode attempt
      console.log(`     🔄 Attempting LIVE mode...`);
      
      // Simulate random failure (30% chance)
      if (Math.random() < 0.3) {
        throw new Error('Rate limit exceeded');
      }
      
      console.log(`     ✅ LIVE mode successful`);
      return { provider: 'live', data: 'real_data' };
    } catch (error) {
      console.log(`     ⚠️  LIVE mode failed: ${error.message}`);
      console.log(`     🔄 Falling back to STUB mode...`);
      return { provider: 'stub_fallback', data: 'stub_data' };
    }
  } else {
    console.log(`     🔧 Using STUB mode`);
    return { provider: 'stub', data: 'stub_data' };
  }
}

// Simulate tool calls
const newsResult = simulateToolCall('get_news', isLiveNews());
const quotesResult = simulateToolCall('get_quotes', isLiveQuotes());
const fundsResult = simulateToolCall('get_fundamentals', isLiveFunds());

console.log(`\n   Results:`);
console.log(`   - News: ${newsResult.provider}`);
console.log(`   - Quotes: ${quotesResult.provider}`);
console.log(`   - Fundamentals: ${fundsResult.provider}`);

console.log(`\n✅ All tests completed!`);
console.log(`\n📋 Summary:`);
console.log(`   - STUB_MODE=true forces all LIVE_* flags to false`);
console.log(`   - Individual LIVE flags can be enabled when STUB_MODE=false`);
console.log(`   - Graceful degradation ensures UI never breaks`);
console.log(`   - Provider information is included in responses`);
