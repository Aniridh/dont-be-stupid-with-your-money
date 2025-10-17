import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    timeout: 30000, // 30 seconds per test
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    environment: 'node',
    globals: true,
  },
});
