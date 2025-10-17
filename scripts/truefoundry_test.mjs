#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from repo root
config({ path: resolve('.env') });

console.log('🔍 TrueFoundry Risk Scoring Test\n');

// Test the TrueFoundry integration
async function testTrueFoundryIntegration() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  try {
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const health = await healthResponse.json();
    
    if (!health.ok) {
      throw new Error(`Backend not healthy: ${JSON.stringify(health)}`);
    }
    
    console.log(`   ✅ Backend healthy (stub: ${health.stub})`);
    
    console.log('\n2️⃣ Testing runner with TrueFoundry risk scoring...');
    
    // Test the runner suggest command
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const runner = spawn('node', ['apps/runner/src/runner.ts', 'suggest'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      let output = '';
      let errorOutput = '';
      
      runner.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      runner.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      runner.on('close', (code) => {
        if (code !== 0) {
          console.error(`   ❌ Runner failed with code ${code}`);
          console.error(`   Error: ${errorOutput}`);
          reject(new Error(`Runner failed: ${errorOutput}`));
          return;
        }
        
        console.log(`   ✅ Runner completed successfully`);
        console.log(`   Output: ${output.trim()}`);
        
        // Check if TrueFoundry integration is working
        if (output.includes('TrueFoundry risk scoring enabled')) {
          console.log(`   🔍 TrueFoundry integration detected`);
        } else if (output.includes('TrueFoundry not configured')) {
          console.log(`   ℹ️ TrueFoundry not configured (expected in STUB mode)`);
        }
        
        // Check for risk signals
        if (output.includes('tool:truefoundry:')) {
          console.log(`   ✅ Risk signals with TrueFoundry source_refs found`);
        }
        
        resolve();
      });
      
      runner.on('error', (error) => {
        console.error(`   ❌ Failed to start runner: ${error.message}`);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Troubleshooting:');
      console.log('   • Make sure backend is running: npm -w backend run dev');
      console.log('   • Check backend URL:', backendUrl);
      console.log('   • Verify backend health: curl', `${backendUrl}/health`);
    }
    
    process.exit(1);
  }
}

// Test TrueFoundry configuration
function testConfiguration() {
  console.log('3️⃣ Testing TrueFoundry configuration...');
  
  const apiKey = process.env.TRUEFOUNDRY_API_KEY;
  const gatewayUrl = process.env.TRUEFOUNDRY_GATEWAY_URL;
  
  console.log(`   API Key: ${apiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`   Gateway URL: ${gatewayUrl ? '✅ Set' : '❌ Not set'}`);
  
  if (apiKey && gatewayUrl) {
    console.log(`   🔧 TrueFoundry is configured for LIVE mode`);
    console.log(`   🌐 Gateway URL: ${gatewayUrl}`);
  } else {
    console.log(`   ℹ️ TrueFoundry not configured - will use STUB mode`);
    console.log(`   💡 To enable LIVE mode, set TRUEFOUNDRY_API_KEY and TRUEFOUNDRY_GATEWAY_URL`);
  }
}

// Test risk scoring features
function testRiskFeatures() {
  console.log('\n4️⃣ Risk scoring features:');
  console.log(`   📊 RSI: Relative Strength Index (0-100)`);
  console.log(`   📈 ATR: Average True Range (volatility measure)`);
  console.log(`   📰 News Sentiment: Average sentiment (-1 to 1)`);
  console.log(`   💰 P/E: Price-to-Earnings ratio`);
  console.log(`   📊 PEG: PEG ratio (P/E to Growth)`);
  console.log(`   🎯 Risk Score: 0-1 (0=low risk, 1=high risk)`);
  console.log(`   📈 Signal Logic:`);
  console.log(`      • Score < 0.3 → BUY (low risk)`);
  console.log(`      • Score > 0.7 → SELL (high risk)`);
  console.log(`      • 0.3-0.7 → HOLD (medium risk)`);
}

// Run the test
async function main() {
  console.log('🚀 Starting TrueFoundry integration test...\n');
  
  // Test configuration
  testConfiguration();
  
  // Test risk features
  testRiskFeatures();
  
  // Test integration
  await testTrueFoundryIntegration();
  
  console.log('\n🎉 TrueFoundry integration test completed!');
  
  // Show usage examples
  console.log('\n📚 Usage examples:');
  console.log('   # Test runner with risk scoring');
  console.log('   npm run suggest');
  console.log('');
  console.log('   # Check for TrueFoundry signals in output');
  console.log('   # Look for source_refs containing "tool:truefoundry:"');
  console.log('');
  console.log('   # Enable LIVE mode by setting environment variables:');
  console.log('   export TRUEFOUNDRY_API_KEY=your_key');
  console.log('   export TRUEFOUNDRY_GATEWAY_URL=https://your-gateway-url.com');
  console.log('   npm run suggest');
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
