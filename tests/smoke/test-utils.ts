import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Expected response schema
export const FinSageResponseSchema = z.object({
  status: z.enum(['success', 'needs_data', 'error']),
  mode: z.enum(['MONITOR', 'SUGGEST', 'EXECUTE', 'BACKTEST']),
  universe: z.array(z.string()),
  signals: z.array(z.object({
    symbol: z.string(),
    type: z.string(),
    signal: z.string(),
    confidence: z.number(),
    description: z.string(),
    value: z.number(),
    threshold: z.number(),
    source_refs: z.array(z.string())
  })),
  suggestions: z.array(z.object({
    symbol: z.string(),
    action: z.string(),
    current_weight: z.number(),
    suggested_weight: z.number(),
    reasoning: z.string(),
    confidence: z.number(),
    risk_level: z.string(),
    source_refs: z.array(z.string())
  })),
  rebalance: z.object({
    total_value: z.number(),
    target_allocation: z.record(z.string(), z.number()),
    current_allocation: z.record(z.string(), z.number()),
    drift: z.number(),
    rebalance_needed: z.boolean(),
    source_refs: z.array(z.string())
  }),
  data_requests: z.array(z.string()).optional(),
  error: z.string().optional()
});

export type FinSageResponse = z.infer<typeof FinSageResponseSchema>;

export interface TestCase {
  name: string;
  input: string;
  expectedStatus: 'success' | 'needs_data' | 'error';
  expectedSignals?: number;
  expectedSuggestions?: number;
  expectedRebalance?: boolean;
  timeout?: number;
}

export class SmokeTestRunner {
  private outputDir: string;

  constructor() {
    this.outputDir = join(process.cwd(), 'backend', 'runtime_outputs', 'smoke');
    mkdirSync(this.outputDir, { recursive: true });
  }

  async runTestCase(testCase: TestCase, mode: 'suggest' | 'backtest' = 'suggest'): Promise<FinSageResponse> {
    const startTime = Date.now();
    
    try {
      // Set up environment for test
      const env = {
        ...process.env,
        STUB_MODE: 'true', // Force stub mode for consistent testing
        NODE_ENV: 'test'
      };

      // Run the runner with the test input
      const command = `cd apps/runner && npm run ${mode}`;
      const result = execSync(command, {
        input: testCase.input,
        encoding: 'utf8',
        env,
        timeout: testCase.timeout || 30000,
        cwd: process.cwd()
      });

      // Parse the response
      const response = JSON.parse(result.trim());
      
      // Validate schema
      const validatedResponse = FinSageResponseSchema.parse(response);
      
      // Write artifact
      const artifactPath = join(this.outputDir, `${testCase.name}.json`);
      writeFileSync(artifactPath, JSON.stringify({
        testCase,
        response: validatedResponse,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }, null, 2));

      return validatedResponse;

    } catch (error) {
      // Write error artifact
      const artifactPath = join(this.outputDir, `${testCase.name}.json`);
      writeFileSync(artifactPath, JSON.stringify({
        testCase,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }, null, 2));

      throw error;
    }
  }

  validateResponse(response: FinSageResponse, testCase: TestCase): void {
    // Validate status
    expect(response.status).toBe(testCase.expectedStatus);

    // Validate signals count if specified
    if (testCase.expectedSignals !== undefined) {
      expect(response.signals).toHaveLength(testCase.expectedSignals);
    }

    // Validate suggestions count if specified
    if (testCase.expectedSuggestions !== undefined) {
      expect(response.suggestions).toHaveLength(testCase.expectedSuggestions);
    }

    // Validate rebalance if specified
    if (testCase.expectedRebalance !== undefined) {
      expect(response.rebalance.rebalance_needed).toBe(testCase.expectedRebalance);
    }

    // Validate universe is not empty
    expect(response.universe.length).toBeGreaterThan(0);

    // Validate all signals have required fields
    response.signals.forEach(signal => {
      expect(signal.symbol).toBeTruthy();
      expect(signal.type).toBeTruthy();
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(1);
      expect(signal.source_refs.length).toBeGreaterThan(0);
    });

    // Validate all suggestions have required fields
    response.suggestions.forEach(suggestion => {
      expect(suggestion.symbol).toBeTruthy();
      expect(suggestion.action).toBeTruthy();
      expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
      expect(suggestion.confidence).toBeLessThanOrEqual(1);
      expect(suggestion.source_refs.length).toBeGreaterThan(0);
    });
  }
}

export const testCases: Record<string, TestCase> = {
  high_pe_bad_news: {
    name: 'A_high_pe_bad_news',
    input: 'Scan portfolio for high P/E stocks with negative news. Focus on AAPL, TSLA, MSFT. Do not execute trades.',
    expectedStatus: 'success',
    expectedSignals: 3,
    expectedSuggestions: 2
  },
  momentum_break: {
    name: 'B_momentum_break',
    input: 'Analyze momentum signals for SPY, QQQ. Look for golden cross patterns and RSI indicators. Suggest momentum trades.',
    expectedStatus: 'success',
    expectedSignals: 2,
    expectedSuggestions: 1
  },
  rebalance_drift: {
    name: 'C_rebalance_drift',
    input: 'Check portfolio drift for rebalancing needs. Current allocation: AAPL 30%, MSFT 25%, GOOGL 20%, TSLA 15%, SPY 10%. Target: equal weight 20% each.',
    expectedStatus: 'success',
    expectedRebalance: true,
    expectedSuggestions: 3
  },
  missing_data: {
    name: 'D_missing_data',
    input: 'Analyze portfolio for symbols: INVALID_SYMBOL_123, ANOTHER_BAD_SYMBOL. Check for signals and suggestions.',
    expectedStatus: 'needs_data',
    expectedSignals: 0,
    expectedSuggestions: 0
  },
  execute_safety: {
    name: 'E_execute_safety',
    input: 'Execute mode: Analyze AAPL, MSFT portfolio. Check if any trades should be executed. Verify safety constraints.',
    expectedStatus: 'success',
    expectedSignals: 2,
    expectedSuggestions: 1
  }
};
