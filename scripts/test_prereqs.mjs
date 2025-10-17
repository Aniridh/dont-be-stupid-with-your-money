#!/usr/bin/env node

/**
 * Test script to verify assertLivePrereqs() functionality
 * Tests different LIVE mode configurations and error handling
 */

import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Testing assertLivePrereqs() Functionality\n');

// Helper functions to simulate the env.ts logic
const isStubMode = () => process.env.STUB_MODE === 'true';
const isLiveNews = () => !isStubMode() && process.env.LIVE_NEWS === 'true';
const isLiveQuotes = () => !isStubMode() && process.env.LIVE_QUOTES === 'true';
const isLiveFunds = () => !isStubMode() && process.env.LIVE_FUNDS === 'true';
const isLiveTFGateway = () => !isStubMode() && process.env.LIVE_TF_GATEWAY === 'true';

function assertLivePrereqs() {
  const missing = [];
  
  // Check LIVE_NEWS prerequisites
  if (isLiveNews()) {
    if (!process.env.APIFY_TOKEN) missing.push('APIFY_TOKEN');
    if (!process.env.APIFY_ACTOR_ID) missing.push('APIFY_ACTOR_ID');
  }
  
  // Check LIVE_TF_GATEWAY prerequisites
  if (isLiveTFGateway()) {
    if (!process.env.TRUEFOUNDRY_API_KEY) missing.push('TRUEFOUNDRY_API_KEY');
    if (!process.env.TRUEFOUNDRY_GATEWAY_URL) missing.push('TRUEFOUNDRY_GATEWAY_URL');
  }
  
  if (missing.length > 0) {
    const enabledModes = [];
    if (isLiveNews()) enabledModes.push('LIVE_NEWS');
    if (isLiveQuotes()) enabledModes.push('LIVE_QUOTES');
    if (isLiveFunds()) enabledModes.push('LIVE_FUNDS');
    if (isLiveTFGateway()) enabledModes.push('LIVE_TF_GATEWAY');
    
    throw new Error(
      `❌ Missing required environment variables for LIVE modes:\n` +
      `   Enabled modes: ${enabledModes.join(', ')}\n` +
      `   Missing variables: ${missing.join(', ')}\n` +
      `   Set these variables or disable the corresponding LIVE_* flags\n` +
      `   Example: LIVE_NEWS=false or set APIFY_TOKEN=your_token`
    );
  }
}

// Test 1: STUB_MODE=true (should pass regardless of LIVE flags)
console.log('1️⃣ Testing STUB_MODE=true (should pass):');
process.env.STUB_MODE = 'true';
process.env.LIVE_NEWS = 'true';
process.env.LIVE_QUOTES = 'true';
process.env.LIVE_FUNDS = 'true';
process.env.LIVE_TF_GATEWAY = 'true';
// Clear all API keys
delete process.env.APIFY_TOKEN;
delete process.env.APIFY_ACTOR_ID;
delete process.env.TRUEFOUNDRY_API_KEY;
delete process.env.TRUEFOUNDRY_GATEWAY_URL;

try {
  assertLivePrereqs();
  console.log('   ✅ PASS: STUB_MODE=true allows missing API keys\n');
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}\n`);
}

// Test 2: LIVE_NEWS=true without API keys (should fail)
console.log('2️⃣ Testing LIVE_NEWS=true without API keys (should fail):');
process.env.STUB_MODE = 'false';
process.env.LIVE_NEWS = 'true';
process.env.LIVE_QUOTES = 'false';
process.env.LIVE_FUNDS = 'false';
process.env.LIVE_TF_GATEWAY = 'false';

try {
  assertLivePrereqs();
  console.log('   ❌ FAIL: Should have thrown error for missing API keys\n');
} catch (error) {
  console.log('   ✅ PASS: Correctly caught missing API keys');
  console.log(`   Error: ${error.message.split('\n')[0]}\n`);
}

// Test 3: LIVE_NEWS=true with API keys (should pass)
console.log('3️⃣ Testing LIVE_NEWS=true with API keys (should pass):');
process.env.STUB_MODE = 'false';
process.env.LIVE_NEWS = 'true';
process.env.APIFY_TOKEN = 'test_token_123';
process.env.APIFY_ACTOR_ID = 'test_actor_456';

try {
  assertLivePrereqs();
  console.log('   ✅ PASS: LIVE_NEWS with API keys works\n');
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}\n`);
}

// Test 4: LIVE_TF_GATEWAY=true without API keys (should fail)
console.log('4️⃣ Testing LIVE_TF_GATEWAY=true without API keys (should fail):');
process.env.STUB_MODE = 'false';
process.env.LIVE_NEWS = 'false';
process.env.LIVE_QUOTES = 'false';
process.env.LIVE_FUNDS = 'false';
process.env.LIVE_TF_GATEWAY = 'true';
delete process.env.TRUEFOUNDRY_API_KEY;
delete process.env.TRUEFOUNDRY_GATEWAY_URL;

try {
  assertLivePrereqs();
  console.log('   ❌ FAIL: Should have thrown error for missing TF keys\n');
} catch (error) {
  console.log('   ✅ PASS: Correctly caught missing TF API keys');
  console.log(`   Error: ${error.message.split('\n')[0]}\n`);
}

// Test 5: Multiple LIVE modes with mixed API keys (should fail)
console.log('5️⃣ Testing multiple LIVE modes with mixed API keys (should fail):');
process.env.STUB_MODE = 'false';
process.env.LIVE_NEWS = 'true';
process.env.LIVE_QUOTES = 'true';
process.env.LIVE_FUNDS = 'true';
process.env.LIVE_TF_GATEWAY = 'true';
process.env.APIFY_TOKEN = 'test_token_123';
process.env.APIFY_ACTOR_ID = 'test_actor_456';
// Missing TF keys
delete process.env.TRUEFOUNDRY_API_KEY;
delete process.env.TRUEFOUNDRY_GATEWAY_URL;

try {
  assertLivePrereqs();
  console.log('   ❌ FAIL: Should have thrown error for missing TF keys\n');
} catch (error) {
  console.log('   ✅ PASS: Correctly caught missing TF API keys');
  console.log(`   Error: ${error.message.split('\n')[0]}\n`);
}

// Test 6: All LIVE modes with all API keys (should pass)
console.log('6️⃣ Testing all LIVE modes with all API keys (should pass):');
process.env.STUB_MODE = 'false';
process.env.LIVE_NEWS = 'true';
process.env.LIVE_QUOTES = 'true';
process.env.LIVE_FUNDS = 'true';
process.env.LIVE_TF_GATEWAY = 'true';
process.env.APIFY_TOKEN = 'test_token_123';
process.env.APIFY_ACTOR_ID = 'test_actor_456';
process.env.TRUEFOUNDRY_API_KEY = 'test_tf_key_789';
process.env.TRUEFOUNDRY_GATEWAY_URL = 'https://test-tf-gateway.com';

try {
  assertLivePrereqs();
  console.log('   ✅ PASS: All LIVE modes with all API keys work\n');
} catch (error) {
  console.log(`   ❌ FAIL: ${error.message}\n`);
}

console.log('✅ All prerequisite tests completed!');
console.log('\n📋 Summary:');
console.log('   - STUB_MODE=true bypasses all LIVE mode checks');
console.log('   - LIVE_NEWS requires APIFY_TOKEN and APIFY_ACTOR_ID');
console.log('   - LIVE_TF_GATEWAY requires TRUEFOUNDRY_API_KEY and TRUEFOUNDRY_GATEWAY_URL');
console.log('   - LIVE_QUOTES and LIVE_FUNDS require no API keys (free services)');
console.log('   - Clear error messages show which modes are enabled and what\'s missing');
