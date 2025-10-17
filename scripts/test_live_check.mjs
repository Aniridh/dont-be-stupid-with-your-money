#!/usr/bin/env node

/**
 * Test script to verify live_check.mjs functionality
 * Tests the script with different environment configurations
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Testing live_check.mjs Script\n');

// Test configurations
const testConfigs = [
  {
    name: 'No LIVE modes enabled',
    env: {
      STUB_MODE: 'true',
      LIVE_NEWS: 'false',
      LIVE_QUOTES: 'false',
      LIVE_FUNDS: 'false',
      LIVE_TF_GATEWAY: 'false'
    },
    expectedExitCode: 0
  },
  {
    name: 'LIVE_NEWS enabled (should fail without backend)',
    env: {
      STUB_MODE: 'false',
      LIVE_NEWS: 'true',
      LIVE_QUOTES: 'false',
      LIVE_FUNDS: 'false',
      LIVE_TF_GATEWAY: 'false'
    },
    expectedExitCode: 1
  },
  {
    name: 'LIVE_QUOTES enabled (should fail without backend)',
    env: {
      STUB_MODE: 'false',
      LIVE_NEWS: 'false',
      LIVE_QUOTES: 'true',
      LIVE_FUNDS: 'false',
      LIVE_TF_GATEWAY: 'false'
    },
    expectedExitCode: 1
  },
  {
    name: 'LIVE_FUNDS enabled (should fail without backend)',
    env: {
      STUB_MODE: 'false',
      LIVE_NEWS: 'false',
      LIVE_QUOTES: 'false',
      LIVE_FUNDS: 'true',
      LIVE_TF_GATEWAY: 'false'
    },
    expectedExitCode: 1
  },
  {
    name: 'LIVE_TF_GATEWAY enabled (should fail without backend)',
    env: {
      STUB_MODE: 'false',
      LIVE_NEWS: 'false',
      LIVE_QUOTES: 'false',
      LIVE_FUNDS: 'false',
      LIVE_TF_GATEWAY: 'true'
    },
    expectedExitCode: 1
  },
  {
    name: 'All LIVE modes enabled (should fail without backend)',
    env: {
      STUB_MODE: 'false',
      LIVE_NEWS: 'true',
      LIVE_QUOTES: 'true',
      LIVE_FUNDS: 'true',
      LIVE_TF_GATEWAY: 'true'
    },
    expectedExitCode: 1
  }
];

// Function to run live_check.mjs with specific environment
function runLiveCheck(envVars, timeout = 10000) {
  return new Promise((resolve) => {
    const child = spawn('node', ['scripts/live_check.mjs'], {
      env: { ...process.env, ...envVars },
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timeoutId = setTimeout(() => {
      child.kill();
      resolve({
        exitCode: 'TIMEOUT',
        stdout,
        stderr: stderr + '\n[TEST TIMEOUT]'
      });
    }, timeout);
    
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({
        exitCode: code,
        stdout,
        stderr
      });
    });
  });
}

// Run tests
async function runTests() {
  let passed = 0;
  let total = testConfigs.length;
  
  for (const config of testConfigs) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Testing: ${config.name}`);
    console.log(`Environment: ${JSON.stringify(config.env, null, 2)}`);
    console.log(`Expected exit code: ${config.expectedExitCode}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const result = await runLiveCheck(config.env);
    
    console.log('STDOUT:');
    console.log(result.stdout);
    
    if (result.stderr) {
      console.log('STDERR:');
      console.log(result.stderr);
    }
    
    const actualExitCode = result.exitCode;
    const expectedExitCode = config.expectedExitCode;
    
    if (actualExitCode === expectedExitCode) {
      console.log(`✅ PASS: Exit code ${actualExitCode} matches expected ${expectedExitCode}`);
      passed++;
    } else if (actualExitCode === 'TIMEOUT') {
      console.log(`⏰ TIMEOUT: Script took too long to complete`);
    } else {
      console.log(`❌ FAIL: Exit code ${actualExitCode} does not match expected ${expectedExitCode}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}/${total}`);
  console.log(`   ❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log(`\n🎉 All tests passed!`);
    process.exit(0);
  } else {
    console.log(`\n💥 Some tests failed!`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
