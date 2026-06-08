import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/components/**/*.spec.{ts,tsx}', 'src/components/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/setupTests.ts'],
  },
});
