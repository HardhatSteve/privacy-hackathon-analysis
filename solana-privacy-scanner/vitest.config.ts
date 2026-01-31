import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000, // Increased for rate limiting
    hookTimeout: 30000,
    pool: 'forks', // Run tests in separate processes
    poolOptions: {
      forks: {
        singleFork: true, // Run all tests in single fork to prevent parallel execution
      },
    },
  },
});
