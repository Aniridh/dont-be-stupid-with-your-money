// Simple test script to verify MCP server functionality
import { getPortfolio } from './tools/get_portfolio.js';
import { getQuotes } from './tools/get_quotes.js';
import { getFundamentals } from './tools/get_fundamentals.js';
import { getNews } from './tools/get_news.js';
import { getHistory } from './tools/get_history.js';
import { tradeSimulate } from './tools/trade_simulate.js';
import { tradeExecute } from './tools/trade_execute.js';
import { logEvent } from './tools/log_event.js';

async function runTests() {
  console.log('🧪 Running FinSage MCP Server Tests\n');

  try {
    // Test get_portfolio
    console.log('1. Testing get_portfolio...');
    const portfolio = await getPortfolio({ user_id: 'test_user' });
    console.log('✅ Portfolio:', JSON.stringify(portfolio, null, 2));

    // Test get_quotes
    console.log('\n2. Testing get_quotes...');
    const quotes = await getQuotes({ symbols: ['AAPL', 'TSLA'] });
    console.log('✅ Quotes:', JSON.stringify(quotes, null, 2));

    // Test get_fundamentals
    console.log('\n3. Testing get_fundamentals...');
    const fundamentals = await getFundamentals({ symbols: ['AAPL', 'TSLA'] });
    console.log('✅ Fundamentals:', JSON.stringify(fundamentals, null, 2));

    // Test get_news
    console.log('\n4. Testing get_news...');
    const news = await getNews({ symbols: ['AAPL'], hours_back: 24 });
    console.log('✅ News:', JSON.stringify(news, null, 2));

    // Test get_history
    console.log('\n5. Testing get_history...');
    const history = await getHistory({ symbol: 'AAPL', period: '1mo' });
    console.log('✅ History:', JSON.stringify(history, null, 2));

    // Test trade_simulate
    console.log('\n6. Testing trade_simulate...');
    const simulation = await tradeSimulate({
      trades: [
        { symbol: 'AAPL', action: 'buy', quantity: 10 },
        { symbol: 'TSLA', action: 'sell', quantity: 5 }
      ]
    });
    console.log('✅ Simulation:', JSON.stringify(simulation, null, 2));

    // Test trade_execute
    console.log('\n7. Testing trade_execute...');
    const execution = await tradeExecute({
      trades: [
        { symbol: 'AAPL', action: 'buy', quantity: 10, order_type: 'market' }
      ]
    });
    console.log('✅ Execution:', JSON.stringify(execution, null, 2));

    // Test log_event
    console.log('\n8. Testing log_event...');
    const logResult = await logEvent({
      event_type: 'signal',
      data: { symbol: 'AAPL', signal: 'high_pe' },
      severity: 'medium'
    });
    console.log('✅ Log Event:', JSON.stringify(logResult, null, 2));

    console.log('\n🎉 All tests passed! MCP server is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
