#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from repo root
config({ path: resolve('.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const tickersArg = args[0] || 'AAPL,MSFT,NVDA';
const metricsArg = args[1] || 'pe_ratio,peg_ratio,ev_ebitda,roic';

const tickers = tickersArg.split(',').map(t => t.trim().toUpperCase());
const metrics = metricsArg.split(',').map(m => m.trim());

console.log('🔍 Fundamentals Test\n');
console.log(`📊 Tickers: ${tickers.join(', ')}`);
console.log(`📈 Metrics: ${metrics.join(', ')}`);
console.log(`🔧 Mode: ${process.env.STUB_MODE === 'false' ? 'LIVE (Yahoo Finance)' : 'STUB (Demo)'}\n`);

// Test the fundamentals tool
async function testFundamentalsTool() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  
  try {
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const health = await healthResponse.json();
    
    if (!health.ok) {
      throw new Error(`Backend not healthy: ${JSON.stringify(health)}`);
    }
    
    console.log(`   ✅ Backend healthy (stub: ${health.stub})`);
    
    console.log('\n2️⃣ Testing get_fundamentals tool...');
    const fundamentalsResponse = await fetch(`${backendUrl}/mcp/tools/get_fundamentals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbols: tickers,
        metrics: metrics,
        tool_call_id: `test_fundamentals_${Date.now()}`
      })
    });
    
    if (!fundamentalsResponse.ok) {
      const errorText = await fundamentalsResponse.text();
      throw new Error(`Fundamentals request failed: ${fundamentalsResponse.status} ${fundamentalsResponse.statusText} - ${errorText}`);
    }
    
    const result = await fundamentalsResponse.json();
    
    if (result.error) {
      console.error(`   ❌ Fundamentals error: ${result.error.code} - ${result.error.message}`);
      return;
    }
    
    console.log(`   ✅ Fundamentals executed successfully`);
    console.log(`   📊 Total fundamentals: ${result.data.fundamentals?.length || 0}`);
    
    // Show results for each ticker
    console.log('\n3️⃣ Results by ticker:');
    if (result.data.fundamentals) {
      result.data.fundamentals.forEach((fund: any) => {
        console.log(`\n   📈 ${fund.symbol}:`);
        console.log(`      💰 P/E (TTM): ${fund.pe_ttm !== null ? fund.pe_ttm.toFixed(2) : 'N/A'}`);
        console.log(`      📊 PEG Ratio: ${fund.peg !== null ? fund.peg.toFixed(2) : 'N/A'}`);
        console.log(`      🏢 EV/EBITDA: ${fund.ev_ebitda !== null ? fund.ev_ebitda.toFixed(2) : 'N/A'}`);
        console.log(`      💡 ROIC: ${fund.roic !== null ? (fund.roic * 100).toFixed(2) + '%' : 'N/A'}`);
        console.log(`      📈 Gross Margin: ${fund.gross_margin_pct !== null ? fund.gross_margin_pct.toFixed(2) + '%' : 'N/A'}`);
        console.log(`      💰 Current Ratio: ${fund.current_ratio !== null ? fund.current_ratio.toFixed(2) : 'N/A'}`);
        console.log(`      📅 Earnings Date: ${fund.earnings_date || 'N/A'}`);
        console.log(`      📊 EPS Consensus: ${fund.eps_consensus !== null ? fund.eps_consensus.toFixed(2) : 'N/A'}`);
        console.log(`      📈 EPS Actual: ${fund.eps_actual !== null ? fund.eps_actual.toFixed(2) : 'N/A'}`);
        console.log(`      🔧 Provider: ${fund.provider || 'unknown'}`);
        
        // Show insider transactions if available
        if (fund.insider_txns && fund.insider_txns.length > 0) {
          console.log(`      👥 Insider Transactions (${fund.insider_txns.length}):`);
          fund.insider_txns.slice(0, 3).forEach((txn: any) => {
            console.log(`         ${txn.date}: ${txn.transaction_type} ${txn.shares.toLocaleString()} shares`);
            if (txn.insider_name) {
              console.log(`           Insider: ${txn.insider_name}`);
            }
          });
          if (fund.insider_txns.length > 3) {
            console.log(`         ... and ${fund.insider_txns.length - 3} more`);
          }
        } else {
          console.log(`      👥 Insider Transactions: None`);
        }
      });
    }
    
    // Show source references
    if (result.data.source_refs) {
      console.log(`\n4️⃣ Source references: ${result.data.source_refs.join(', ')}`);
    }
    
    console.log('\n🎉 Fundamentals test completed successfully!');
    
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
  console.log('🚀 Starting fundamentals test...\n');
  
  // Check environment
  if (process.env.STUB_MODE === 'false') {
    console.log('🌐 LIVE mode: Will use Yahoo Finance API');
    console.log('   • Quote data: P/E, PEG, EV/EBITDA, ROIC, margins');
    console.log('   • Insider transactions: Recent insider activity');
    console.log('   • LRU Cache: 5-minute TTL for performance');
  } else {
    console.log('🎭 STUB mode: Will use demo data');
  }
  
  console.log('');
  
  // Test fundamentals tool
  await testFundamentalsTool();
  
  // Show usage examples
  console.log('\n📚 Usage examples:');
  console.log('   # Test with default tickers and metrics');
  console.log('   npm run fundamentals:test');
  console.log('');
  console.log('   # Test with custom tickers');
  console.log('   npm run fundamentals:test TSLA,GOOGL,AMZN');
  console.log('');
  console.log('   # Test with specific metrics');
  console.log('   npm run fundamentals:test AAPL,MSFT "pe_ratio,roic,gross_margin"');
  console.log('');
  console.log('   # Test single ticker');
  console.log('   npm run fundamentals:test AAPL');
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
