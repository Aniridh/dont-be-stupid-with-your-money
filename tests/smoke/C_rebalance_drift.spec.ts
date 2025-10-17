import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SmokeTestRunner, testCases, FinSageResponse } from './test-utils.js';

describe('C_rebalance_drift', () => {
  let runner: SmokeTestRunner;
  let response: FinSageResponse;

  beforeAll(async () => {
    runner = new SmokeTestRunner();
  });

  afterAll(() => {
    // Cleanup if needed
  });

  it('should detect portfolio drift and suggest rebalancing', async () => {
    const testCase = testCases.rebalance_drift;
    
    response = await runner.runTestCase(testCase, 'suggest');
    
    // Validate response structure
    runner.validateResponse(response, testCase);
    
    // Specific validations for this test case
    expect(response.mode).toBe('SUGGEST');
    expect(response.universe).toContain('AAPL');
    expect(response.universe).toContain('MSFT');
    expect(response.universe).toContain('GOOGL');
    expect(response.universe).toContain('TSLA');
    expect(response.universe).toContain('SPY');
    
    // Check that rebalancing is needed
    expect(response.rebalance.rebalance_needed).toBe(true);
    expect(response.rebalance.drift).toBeGreaterThan(0.05); // Should exceed 5% threshold
    
    // Check for rebalance suggestions
    const rebalanceSuggestions = response.suggestions.filter(s => 
      s.action.toLowerCase().includes('rebalance') ||
      s.action.toLowerCase().includes('adjust') ||
      s.action.toLowerCase().includes('weight')
    );
    expect(rebalanceSuggestions.length).toBeGreaterThan(0);
    
    // Validate current vs target allocation
    const currentAllocation = response.rebalance.current_allocation;
    const targetAllocation = response.rebalance.target_allocation;
    
    expect(Object.keys(currentAllocation).length).toBeGreaterThan(0);
    expect(Object.keys(targetAllocation).length).toBeGreaterThan(0);
    
    // Check that allocations sum to approximately 1.0
    const currentSum = Object.values(currentAllocation).reduce((sum, val) => sum + val, 0);
    const targetSum = Object.values(targetAllocation).reduce((sum, val) => sum + val, 0);
    
    expect(currentSum).toBeCloseTo(1.0, 2);
    expect(targetSum).toBeCloseTo(1.0, 2);
    
    // Validate that there are significant weight differences
    const weightDifferences = Object.keys(currentAllocation).map(symbol => 
      Math.abs((currentAllocation[symbol] || 0) - (targetAllocation[symbol] || 0))
    );
    
    const maxDifference = Math.max(...weightDifferences);
    expect(maxDifference).toBeGreaterThan(0.05); // Should have at least 5% difference
    
    // Check for specific rebalancing actions
    const reduceSuggestions = response.suggestions.filter(s => 
      s.current_weight > s.suggested_weight
    );
    const increaseSuggestions = response.suggestions.filter(s => 
      s.current_weight < s.suggested_weight
    );
    
    expect(reduceSuggestions.length + increaseSuggestions.length).toBeGreaterThan(0);
  }, 30000);

  it('should work in STUB_MODE', async () => {
    const testCase = { ...testCases.rebalance_drift, name: 'C_rebalance_drift_stub' };
    
    const stubResponse = await runner.runTestCase(testCase, 'suggest');
    
    expect(stubResponse.status).toBe('success');
    expect(stubResponse.rebalance.rebalance_needed).toBe(true);
    expect(stubResponse.suggestions.length).toBeGreaterThan(0);
  }, 30000);
});
