import { expect, test as base } from '@playwright/test';

/**
 * Network guard (CLAUDE.md rule 2): every test that imports `test` from here fails if the page
 * requests anything from a host other than the app's own origin.
 */
export const test = base.extend<{ networkGuard: string[] }>({
  networkGuard: [
    async ({ page, baseURL }, use) => {
      const appOrigin = new URL(baseURL ?? '').origin;
      const foreign: string[] = [];
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (url.protocol.startsWith('http') && url.origin !== appOrigin) foreign.push(req.url());
      });
      await use(foreign);
      expect(foreign, 'requests to third-party hosts').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
export type { Page } from '@playwright/test';
