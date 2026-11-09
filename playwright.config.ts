import { defineConfig } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the locally installed Chrome, so no browser download is needed.
    channel: 'chrome',
  },
  webServer: {
    // The e2e mode adds a small test hook (src/testHook.ts) that production builds leave out.
    command: `npm run check && npx vite build --mode e2e && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
