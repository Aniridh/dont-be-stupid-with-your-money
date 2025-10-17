#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from repo root
config({ path: resolve('.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const ticker = args[0] || 'AAPL';
const period = args[1] || '1mo';

console.log('🔍 Price Provider Test\n');
console.log(`📊 Ticker: ${ticker}`);
console.log(`📅 Period: ${period}`);
console.log(`🔧 Mode: ${process.env.STUB_MODE === 'false' ? 'LIVE (Google/Yahoo)' : 'STUB (Demo)'}\n`);

// Test the price provider
async function testPriceProvider() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  try {
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const health = await healthResponse.json();
    
    if (!health.ok) {
      throw new Error(`Backend not healthy: ${JSON.stringify(health)}`);
    }
    
    console.log(`   ✅ Backend healthy (stub: ${health.stub})`);
    
    console.log('\n2️⃣ Testing get_quotes tool...');
    const quotesResponse = await fetch(`${backendUrl}/mcp/tools/get_quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbols: [ticker],
        fields: ['price', 'change', 'volume'],
        tool_call_id: `test_quotes_${Date.now()}`
      })
    });
    
    if (!quotesResponse.ok) {
      const errorText = await quotesResponse.text();
      throw new Error(`Quotes request failed: ${quotesResponse.status} ${quotesResponse.statusText} - ${errorText}`);
    }
    
    const quotesResult = await quotesResponse.json();
    
    if (quotesResult.error) {
      console.error(`   ❌ Quotes error: ${quotesResult.error.code} - ${quotesResult.error.message}`);
    } else {
      console.log(`   ✅ Quotes executed successfully`);
      console.log(`   📈 Total quotes: ${quotesResult.data.quotes?.length || 0}`);
      
      if (quotesResult.data.quotes && quotesResult.data.quotes.length > 0) {
        const quote = quotesResult.data.quotes[0];
        console.log(`   💰 ${quote.symbol}: $${quote.price} (${quote.change_percent > 0 ? '+' : ''}${quote.change_percent}%)`);
        console.log(`   📊 Volume: ${quote.volume?.toLocaleString() || 'N/A'}`);
        console.log(`   🔧 Source: ${quote.source || 'unknown'}`);
        if (quote.timestamp) {
          console.log(`   ⏰ Timestamp: ${new Date(quote.timestamp).toLocaleString()}`);
        }
        
        // Show enhanced data if available
        if (quote.range_52w) {
          console.log(`   📈 52W Range: $${quote.range_52w.low.toFixed(2)} - $${quote.range_52w.high.toFixed(2)}`);
        }
        if (quote.avg_volume_30d) {
          console.log(`   📊 Avg Volume (30d): ${quote.avg_volume_30d.toLocaleString()}`);
        }
        if (quote.sma20 !== null) {
          console.log(`   📈 SMA(20): $${quote.sma20.toFixed(2)}`);
        }
        if (quote.sma50 !== null) {
          console.log(`   📈 SMA(50): $${quote.sma50.toFixed(2)}`);
        }
        if (quote.sma200 !== null) {
          console.log(`   📈 SMA(200): $${quote.sma200.toFixed(2)}`);
        }
        if (quote.rsi14 !== null) {
          console.log(`   📊 RSI(14): ${quote.rsi14.toFixed(2)}`);
        }
        if (quote.atr14 !== null) {
          console.log(`   📉 ATR(14): $${quote.atr14.toFixed(2)}`);
        }
      }
    }
    
    console.log('\n3️⃣ Testing get_history tool...');
    const historyResponse = await fetch(`${backendUrl}/mcp/tools/get_history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: ticker,
        period: period,
        interval: '1d',
        tool_call_id: `test_history_${Date.now()}`
      })
    });
    
    if (!historyResponse.ok) {
      const errorText = await historyResponse.text();
      throw new Error(`History request failed: ${historyResponse.status} ${historyResponse.statusText} - ${errorText}`);
    }
    
    const historyResult = await historyResponse.json();
    
    if (historyResult.error) {
      console.error(`   ❌ History error: ${historyResult.error.code} - ${historyResult.error.message}`);
    } else {
      console.log(`   ✅ History executed successfully`);
      console.log(`   📈 Total data points: ${historyResult.data.history?.length || 0}`);
      
      if (historyResult.data.history && historyResult.data.history.length > 0) {
        const latest = historyResult.data.history[historyResult.data.history.length - 1];
        console.log(`   📊 Latest: O:$${latest.open} H:$${latest.high} L:$${latest.low} C:$${latest.close} V:${latest.volume?.toLocaleString()}`);
        
        // Show technical indicators if available
        if (latest.sma_20 !== null) {
          console.log(`   📈 SMA(20): $${latest.sma_20.toFixed(2)}`);
        }
        if (latest.sma_50 !== null) {
          console.log(`   📈 SMA(50): $${latest.sma_50.toFixed(2)}`);
        }
        if (latest.sma_200 !== null) {
          console.log(`   📈 SMA(200): $${latest.sma_200.toFixed(2)}`);
        }
        if (latest.rsi_14 !== null) {
          console.log(`   📊 RSI(14): ${latest.rsi_14.toFixed(2)}`);
        }
        if (latest.atr_14 !== null) {
          console.log(`   📉 ATR(14): $${latest.atr_14.toFixed(2)}`);
        }
        if (latest.avg_volume_30d) {
          console.log(`   📊 Avg Volume (30d): ${latest.avg_volume_30d.toLocaleString()}`);
        }
        if (latest.range_52w) {
          console.log(`   📈 52W Range: $${latest.range_52w.low.toFixed(2)} - $${latest.range_52w.high.toFixed(2)}`);
        }
        if (latest.day_change_pct !== undefined) {
          console.log(`   📊 Day Change: ${latest.day_change_pct > 0 ? '+' : ''}${latest.day_change_pct.toFixed(2)}%`);
        }
        
        // Show date range
        const first = historyResult.data.history[0];
        const last = historyResult.data.history[historyResult.data.history.length - 1];
        console.log(`   📅 Date range: ${first.date} to ${last.date}`);
      }
    }
    
    console.log('\n🎉 Price provider test completed successfully!');
    
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

// Run the test
async function main() {
  console.log('🚀 Starting price provider test...\n');
  
  // Check environment
  if (process.env.STUB_MODE === 'false') {
    console.log('🌐 LIVE mode: Will use Google Finance + Yahoo Finance');
    console.log('   • Google Finance: Primary for real-time quotes');
    console.log('   • Yahoo Finance: Fallback for quotes, primary for history');
    console.log('   • Technical Analysis: SMA(20), RSI(14), ATR(14)');
  } else {
    console.log('🎭 STUB mode: Will use demo data with technical indicators');
  }
  
  console.log('');
  
  // Test price provider
  await testPriceProvider();
  
  // Show usage examples
  console.log('\n📚 Usage examples:');
  console.log('   # Test with default ticker (AAPL) and period (1mo)');
  console.log('   npm run price:test');
  console.log('');
  console.log('   # Test with custom ticker');
  console.log('   npm run price:test TSLA');
  console.log('');
  console.log('   # Test with custom period');
  console.log('   npm run price:test AAPL 1y');
  console.log('');
  console.log('   # Test with different periods');
  console.log('   npm run price:test MSFT 6mo');
  console.log('   npm run price:test GOOGL 3mo');
  console.log('   npm run price:test NVDA 1d');
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
