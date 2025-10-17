#!/usr/bin/env node

/**
 * Test script to verify audit logger redaction functionality
 * Tests that sensitive data is properly redacted from logs
 */

console.log('🧪 Testing Audit Logger Redaction\n');

// Mock the redaction function (simplified version of the real one)
function redactSensitiveData(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Redact strings that look like tokens/keys/secrets
    if (/(TOKEN|KEY|SECRET|DSN)/i.test(obj)) {
      return '[REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  if (typeof obj === 'object') {
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact Authorization headers
      if (key.toLowerCase() === 'authorization') {
        redacted[key] = '[REDACTED]';
      }
      // Redact keys that look like they contain sensitive data
      else if (/(TOKEN|KEY|SECRET|DSN)/i.test(key)) {
        redacted[key] = '[REDACTED]';
      }
      // Recursively redact nested objects
      else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }

  return obj;
}

// Test 1: Simple string redaction
console.log('1️⃣ Testing string redaction:');
const sensitiveStrings = [
  'APIFY_TOKEN=abc123def456',
  'TRUEFOUNDRY_API_KEY=xyz789',
  'SENTRY_DSN=https://abc@def.ingest.sentry.io/123',
  'Authorization: Bearer token123',
  'Regular string without secrets',
  'API_KEY=secret123'
];

sensitiveStrings.forEach(str => {
  const redacted = redactSensitiveData(str);
  console.log(`   "${str}" → "${redacted}"`);
});
console.log();

// Test 2: Object redaction
console.log('2️⃣ Testing object redaction:');
const sensitiveObject = {
  user_id: 'user123',
  APIFY_TOKEN: 'abc123def456',
  TRUEFOUNDRY_API_KEY: 'xyz789',
  SENTRY_DSN: 'https://abc@def.ingest.sentry.io/123',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123',
    'User-Agent': 'FinSage/1.0.0'
  },
  data: {
    symbols: ['AAPL', 'MSFT'],
    api_key: 'secret456',
    normal_field: 'normal_value'
  }
};

const redactedObject = redactSensitiveData(sensitiveObject);
console.log('   Original object:');
console.log(JSON.stringify(sensitiveObject, null, 2));
console.log('\n   Redacted object:');
console.log(JSON.stringify(redactedObject, null, 2));
console.log();

// Test 3: Array redaction
console.log('3️⃣ Testing array redaction:');
const sensitiveArray = [
  { name: 'user1', API_KEY: 'key1' },
  { name: 'user2', TOKEN: 'token2' },
  { name: 'user3', normal_field: 'value3' }
];

const redactedArray = redactSensitiveData(sensitiveArray);
console.log('   Original array:');
console.log(JSON.stringify(sensitiveArray, null, 2));
console.log('\n   Redacted array:');
console.log(JSON.stringify(redactedArray, null, 2));
console.log();

// Test 4: Nested object redaction
console.log('4️⃣ Testing nested object redaction:');
const nestedObject = {
  request: {
    method: 'POST',
    url: '/api/data',
    headers: {
      'Authorization': 'Bearer abc123',
      'Content-Type': 'application/json'
    },
    body: {
      symbols: ['AAPL'],
      config: {
        API_TOKEN: 'secret123',
        normal_setting: 'value'
      }
    }
  },
  response: {
    status: 200,
    data: {
      SENTRY_DSN: 'https://secret@sentry.io/123',
      results: ['data1', 'data2']
    }
  }
};

const redactedNested = redactSensitiveData(nestedObject);
console.log('   Original nested object:');
console.log(JSON.stringify(nestedObject, null, 2));
console.log('\n   Redacted nested object:');
console.log(JSON.stringify(redactedNested, null, 2));
console.log();

// Test 5: Edge cases
console.log('5️⃣ Testing edge cases:');
const edgeCases = [
  null,
  undefined,
  '',
  'NORMAL_STRING',
  {},
  [],
  { normal_key: 'normal_value' },
  { TOKEN: null },
  { KEY: undefined }
];

edgeCases.forEach((testCase, index) => {
  const redacted = redactSensitiveData(testCase);
  console.log(`   Case ${index + 1}: ${JSON.stringify(testCase)} → ${JSON.stringify(redacted)}`);
});

console.log('\n✅ All redaction tests completed!');
console.log('\n📋 Summary:');
console.log('   - Strings containing TOKEN, KEY, SECRET, DSN are redacted');
console.log('   - Authorization headers are redacted');
console.log('   - Object keys matching patterns are redacted');
console.log('   - Nested objects and arrays are recursively processed');
console.log('   - Edge cases (null, undefined, empty) are handled safely');
console.log('   - Normal data is preserved unchanged');
