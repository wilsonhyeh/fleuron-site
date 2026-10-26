import { test, expect } from '@playwright/test';
import { sitePages } from '../src/content/site-pages';

// The site is light-only, so a dark OS preference must not change any page or
// produce a horizontal overflow at either width.
for (const width of [390, 1280]) {
  for (const route of sitePages) {
    test(`${route.path} works at ${width}px in a dark OS`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: 'dark' });
      const unexpected: string[] = [];
      const errors: string[] = [];
      // Allowlist: the Cloudflare Web Analytics beacon (script load + visit
      // beacons), disclosed on /privacy/. Everything else external fails.
      const allowedExternal = new Set(['https://static.cloudflareinsights.com', 'https://cloudflareinsights.com']);
      page.on('request', request => {
        const url = new URL(request.url());
        if (!['http://127.0.0.1:4321', 'null'].includes(url.origin) && !allowedExternal.has(url.origin)) unexpected.push(`${url.origin}${url.pathname}`);
      });
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Download' })).toHaveAttribute('href', '/download/');
      // Light-only: no toggle, and the paper colour survives a dark OS.
      await expect(page.getByRole('button', { name: /theme/i })).toHaveCount(0);
      await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(247, 243, 234)');
      for (const detail of await page.locator('details').all()) {
        await detail.locator('summary').click();
        await expect(detail).toHaveAttribute('open', '');
        await expect(detail.locator('p')).toBeVisible();
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow, 'horizontal page overflow').toBe(false);
      expect(unexpected, 'unexpected page-initiated external resource; does not observe browser-managed NEL').toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test('missing paths return the custom 404, not a homepage 200', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Return home' }).click();
  await expect(page).toHaveURL('/');
});

test('download links remain visible and target official release assets', async ({ page }) => {
  await page.goto('/download/');
  for (const platform of ['macOS', 'Windows']) {
    const link = page.getByRole('link', { name: `Download for ${platform}`, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /^https:\/\/github\.com\/wilsonhyeh\/fleuron\/releases\/download\/v/);
  }
});

test('all registered landing pages are reachable from actual site links', async ({ page }) => {
  for (const route of sitePages.filter(p => p.path !== '/')) {
    await page.goto(route.path.startsWith('/guides/') || route.path.startsWith('/compare/') ? '/guides/' : '/');
    await page.locator(`a[href="${route.path}"]`).first().click();
    await expect(page).toHaveURL(route.path);
  }
});
