import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['boxes/**/test/**/*.test.ts'],
    environment: 'node',
    globals: false,
  },
});
