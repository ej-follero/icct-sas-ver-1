import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Get dirname in ESM context
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true as const,
    setupFiles: ['.storybook/vitest.setup.ts'],
    include: ['src/**/*.stories.{js,jsx,ts,tsx}', 'src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', '.storybook'],
    browser: {
      enabled: true,
      headless: true,
      provider: 'playwright',
      name: 'chromium'
    },
    root: __dirname,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/**/*.stories.{js,jsx,ts,tsx}', 'src/**/*.test.{js,jsx,ts,tsx}']
    }
  }
});
