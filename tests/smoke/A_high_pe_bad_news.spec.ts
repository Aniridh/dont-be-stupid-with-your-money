import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SmokeTestRunner, testCases, FinSageResponse } from './test-utils.js';

describe('A_high_pe_bad_news', () => {
  let runner: SmokeTestRunner;
  let response: FinSageResponse;

  beforeAll(async () => {
    runner = new SmokeTestRunner();
  });

  afterAll(() => {
    // Cleanup if needed
  });

  it('should detect high P/E stocks with negative news and suggest sell signals', async () => {
    const testCase = testCases.high_pe_bad_news;
    
    response = await runner.runTestCase(testCase, 'suggest');
    
    // Validate response structure
    runner.validateResponse(response, testCase);
    
    // Specific validations for this test case
    expect(response.mode).toBe('SUGGEST');
    expect(response.universe).toContain('AAPL');
    expect(response.universe).toContain('TSLA');
    expect(response.universe).toContain('MSFT');
    
    // Check for valuation signals (high P/E)
    const valuationSignals = response.signals.filter(s => s.type === 'valuation');
    expect(valuationSignals.length).toBeGreaterThan(0);
    
    // Check for negative sentiment in news-related signals
    const newsSignals = response.signals.filter(s => 
      s.description.toLowerCase().includes('news') || 
      s.description.toLowerCase().includes('sentiment')
    );
    expect(newsSignals.length).toBeGreaterThan(0);
    
    // Check for sell suggestions
    const sellSuggestions = response.suggestions.filter(s => 
      s.action.toLowerCase().includes('sell') || 
      s.action.toLowerCase().includes('reduce')
    );
    expect(sellSuggestions.length).toBeGreaterThan(0);
    
    // Validate confidence levels are reasonable
    response.signals.forEach(signal => {
      expect(signal.confidence).toBeGreaterThan(0.5); // High confidence for clear signals
    });
    
    response.suggestions.forEach(suggestion => {
      expect(suggestion.confidence).toBeGreaterThan(0.6); // High confidence for sell suggestions
    });
  }, 30000);

  it('should work in STUB_MODE', async () => {
    // This test ensures STUB_MODE behavior is consistent
    const testCase = { ...testCases.high_pe_bad_news, name: 'A_high_pe_bad_news_stub' };
    
    const stubResponse = await runner.runTestCase(testCase, 'suggest');
    
    expect(stubResponse.status).toBe('success');
    expect(stubResponse.signals.length).toBeGreaterThan(0);
    expect(stubResponse.suggestions.length).toBeGreaterThan(0);
  }, 30000);
});
