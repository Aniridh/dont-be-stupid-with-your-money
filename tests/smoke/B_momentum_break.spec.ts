import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SmokeTestRunner, testCases, FinSageResponse } from './test-utils.js';

describe('B_momentum_break', () => {
  let runner: SmokeTestRunner;
  let response: FinSageResponse;

  beforeAll(async () => {
    runner = new SmokeTestRunner();
  });

  afterAll(() => {
    // Cleanup if needed
  });

  it('should detect momentum signals and suggest momentum trades', async () => {
    const testCase = testCases.momentum_break;
    
    response = await runner.runTestCase(testCase, 'suggest');
    
    // Validate response structure
    runner.validateResponse(response, testCase);
    
    // Specific validations for this test case
    expect(response.mode).toBe('SUGGEST');
    expect(response.universe).toContain('SPY');
    expect(response.universe).toContain('QQQ');
    
    // Check for momentum signals
    const momentumSignals = response.signals.filter(s => s.type === 'momentum');
    expect(momentumSignals.length).toBeGreaterThan(0);
    
    // Check for technical signals (RSI, golden cross)
    const technicalSignals = response.signals.filter(s => 
      s.type === 'technical' || 
      s.signal.toLowerCase().includes('rsi') ||
      s.signal.toLowerCase().includes('golden') ||
      s.signal.toLowerCase().includes('cross')
    );
    expect(technicalSignals.length).toBeGreaterThan(0);
    
    // Check for buy suggestions (momentum typically suggests buying)
    const buySuggestions = response.suggestions.filter(s => 
      s.action.toLowerCase().includes('buy') || 
      s.action.toLowerCase().includes('increase')
    );
    expect(buySuggestions.length).toBeGreaterThan(0);
    
    // Validate momentum-specific signal properties
    momentumSignals.forEach(signal => {
      expect(signal.description).toMatch(/momentum|breakout|trend/i);
      expect(signal.confidence).toBeGreaterThan(0.6);
    });
    
    // Validate technical signal properties
    technicalSignals.forEach(signal => {
      expect(signal.value).toBeGreaterThan(0);
      expect(signal.threshold).toBeGreaterThan(0);
    });
  }, 30000);

  it('should work in STUB_MODE', async () => {
    const testCase = { ...testCases.momentum_break, name: 'B_momentum_break_stub' };
    
    const stubResponse = await runner.runTestCase(testCase, 'suggest');
    
    expect(stubResponse.status).toBe('success');
    expect(stubResponse.signals.length).toBeGreaterThan(0);
    expect(stubResponse.suggestions.length).toBeGreaterThan(0);
  }, 30000);
});
