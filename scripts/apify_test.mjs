#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from repo root
config({ path: resolve('.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const tickersArg = args[0] || 'AAPL,MSFT,NVDA';
const lookbackDaysArg = parseInt(args[1]) || 3;

const tickers = tickersArg.split(',').map(t => t.trim().toUpperCase());
const lookbackDays = lookbackDaysArg;
const hoursBack = lookbackDays * 24;

console.log('🔍 Apify News Test\n');
console.log(`📊 Tickers: ${tickers.join(', ')}`);
console.log(`📅 Lookback: ${lookbackDays} days (${hoursBack} hours)`);
console.log(`🔧 Mode: ${process.env.STUB_MODE === 'false' ? 'LIVE (Apify)' : 'STUB (Demo)'}\n`);

// Test the backend tool
async function testNewsTool() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  try {
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const health = await healthResponse.json();
    
    if (!health.ok) {
      throw new Error(`Backend not healthy: ${JSON.stringify(health)}`);
    }
    
    console.log(`   ✅ Backend healthy (stub: ${health.stub})`);
    
    console.log('\n2️⃣ Testing get_news tool...');
    const toolResponse = await fetch(`${backendUrl}/mcp/tools/get_news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbols: tickers,
        hours_back: hoursBack,
        tool_call_id: `test_${Date.now()}`
      })
    });
    
    if (!toolResponse.ok) {
      const errorText = await toolResponse.text();
      throw new Error(`Tool request failed: ${toolResponse.status} ${toolResponse.statusText} - ${errorText}`);
    }
    
    const result = await toolResponse.json();
    
    if (result.error) {
      console.error(`   ❌ Tool error: ${result.error.code} - ${result.error.message}`);
      return;
    }
    
    console.log(`   ✅ Tool executed successfully`);
    console.log(`   📊 Source: ${result.data.meta?.source || 'unknown'}`);
    console.log(`   📈 Total items: ${result.data.items?.length || 0}`);
    
    // Group by ticker and show counts
    console.log('\n3️⃣ Results by ticker:');
    const itemsByTicker = {};
    
    if (result.data.items) {
      result.data.items.forEach(item => {
        if (!itemsByTicker[item.symbol]) {
          itemsByTicker[item.symbol] = [];
        }
        itemsByTicker[item.symbol].push(item);
      });
    }
    
    tickers.forEach(ticker => {
      const items = itemsByTicker[ticker] || [];
      console.log(`   ${ticker}: ${items.length} items`);
      
      if (items.length > 0) {
        const sample = items[0];
        console.log(`      📰 Sample: "${sample.headline}"`);
        console.log(`      📅 Published: ${new Date(sample.published_at).toLocaleString()}`);
        console.log(`      😊 Sentiment: ${sample.sentiment.toFixed(2)}`);
        console.log(`      🏷️  Tags: [${sample.tags.join(', ')}]`);
        console.log(`      📰 Source: ${sample.source}`);
      } else {
        console.log(`      ⚠️  No news found for ${ticker}`);
      }
      console.log('');
    });
    
    // Show meta information
    if (result.data.meta) {
      console.log('4️⃣ Meta information:');
      console.log(`   Tickers: ${result.data.meta.tickers.join(', ')}`);
      console.log(`   Lookback days: ${result.data.meta.lookback_days}`);
      console.log(`   Source: ${result.data.meta.source}`);
    }
    
    // Show source references
    if (result.data.source_refs) {
      console.log(`\n5️⃣ Source references: ${result.data.source_refs.join(', ')}`);
    }
    
    console.log('\n🎉 Test completed successfully!');
    
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

// Alternative: Test direct function import (for development)
async function testDirectFunction() {
  try {
    console.log('🔧 Testing direct function import...');
    
    // This would require the backend to be built and available
    // For now, we'll just show the approach
    console.log('   ⚠️  Direct function testing requires backend compilation');
    console.log('   💡 Use HTTP endpoint testing instead');
    
  } catch (error) {
    console.error('   ❌ Direct function test failed:', error.message);
  }
}

// Run the test
async function main() {
  console.log('🚀 Starting Apify news test...\n');
  
  // Check environment
  if (process.env.STUB_MODE === 'false') {
    if (!process.env.APIFY_TOKEN || !process.env.APIFY_ACTOR_ID) {
      console.error('❌ LIVE mode requires APIFY_TOKEN and APIFY_ACTOR_ID environment variables');
      console.log('💡 Set these in your .env file or run:');
      console.log('   export APIFY_TOKEN=your_token');
      console.log('   export APIFY_ACTOR_ID=your_actor_id');
      process.exit(1);
    }
    console.log('🌐 LIVE mode: Will use Apify API');
  } else {
    console.log('🎭 STUB mode: Will use demo data');
  }
  
  console.log('');
  
  // Test via HTTP endpoint
  await testNewsTool();
  
  // Show usage examples
  console.log('\n📚 Usage examples:');
  console.log('   # Test with default tickers (AAPL,MSFT,NVDA)');
  console.log('   npm run apify:test');
  console.log('');
  console.log('   # Test with custom tickers');
  console.log('   npm run apify:test TSLA,GOOGL,AMZN');
  console.log('');
  console.log('   # Test with custom lookback period');
  console.log('   npm run apify:test AAPL,MSFT 7');
  console.log('');
  console.log('   # Test single ticker');
  console.log('   npm run apify:test AAPL 1');
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
