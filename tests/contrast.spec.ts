import { test, expect } from '@playwright/test';

import { sitePages } from '../src/content/site-pages';
const PAGES = sitePages.map(page => page.path);

// The site is light-only; each page is audited with a dark OS preference
// emulated so a stray media query would show up as a contrast failure.
test.describe('WCAG AA Contrast Audit', () => {
  for (const path of PAGES) {
    test(`${path} clears WCAG AA contrast with a dark OS preference`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(path);
      await page.locator('details').evaluateAll(nodes => nodes.forEach(node => { (node as HTMLDetailsElement).open = true; }));
      await page.waitForTimeout(200);

      const violations = await page.evaluate(() => {
        function parseColor(str: string): { r: number; g: number; b: number; a: number } {
          const m = str.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
          if (m) {
            return {
              r: parseFloat(m[1]),
              g: parseFloat(m[2]),
              b: parseFloat(m[3]),
              a: m[4] !== undefined ? parseFloat(m[4]) : 1,
            };
          }
          return { r: 0, g: 0, b: 0, a: 1 };
        }

        function getLuminance(r: number, g: number, b: number): number {
          const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        function getContrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }): number {
          const l1 = getLuminance(fg.r, fg.g, fg.b);
          const l2 = getLuminance(bg.r, bg.g, bg.b);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        function blend(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number }): { r: number; g: number; b: number } {
          const a = fg.a;
          return {
            r: Math.round(fg.r * a + bg.r * (1 - a)),
            g: Math.round(fg.g * a + bg.g * (1 - a)),
            b: Math.round(fg.b * a + bg.b * (1 - a)),
          };
        }

        // Base paper colour (light-only build).
        const defaultBg = { r: 0xf7, g: 0xf3, b: 0xea };

        function getEffectiveBgColor(el: Element): { r: number; g: number; b: number } {
          let current: Element | null = el;
          const layers: { r: number; g: number; b: number; a: number }[] = [];

          while (current) {
            const style = window.getComputedStyle(current);
            const color = parseColor(style.backgroundColor);
            if (color.a > 0) {
              layers.unshift(color);
              if (color.a === 1) break;
            }
            current = current.parentElement;
          }

          let resolved = defaultBg;
          for (const layer of layers) {
            resolved = blend(layer, resolved);
          }
          return resolved;
        }

        const elements = Array.from(
          document.querySelectorAll(
            'h1, h2, h3, h4, p, a, button, span, strong, em, code, mark, td, th, li, label, figcaption, summary, caption'
          )
        );

        const results: {
          tag: string;
          text: string;
          fg: string;
          bg: string;
          ratio: number;
          required: number;
        }[] = [];

        for (const el of elements) {
          // Check direct text presence
          const text = (el.textContent || '').trim();
          if (!text) continue;

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
          if (el.classList.contains('sr-only')) continue;

          // Only evaluate if this element has direct text nodes or no children with text
          const hasDirectText = Array.from(el.childNodes).some(
            (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
          );
          if (!hasDirectText && el.children.length > 0) continue;

          const fgColor = parseColor(style.color);
          if (fgColor.a === 0) continue;

          const effectiveBg = getEffectiveBgColor(el);
          const blendedFg = blend(fgColor, effectiveBg);
          const ratio = getContrastRatio(blendedFg, effectiveBg);

          const fontSize = parseFloat(style.fontSize);
          const fontWeight = parseInt(style.fontWeight, 10) || 400;
          const isLargeText = fontSize >= 24 || (fontSize >= 18.5 && fontWeight >= 700);
          const required = isLargeText ? 3.0 : 4.5;

          // Round to 2 decimal places with margin for rounding
          if (ratio < required - 0.05) {
            results.push({
              tag: el.tagName.toLowerCase(),
              text: text.slice(0, 50),
              fg: style.color,
              bg: `rgb(${effectiveBg.r}, ${effectiveBg.g}, ${effectiveBg.b})`,
              ratio: Math.round(ratio * 100) / 100,
              required,
            });
          }
        }

        return results;
      });

      expect(
        violations,
        `Contrast violations on ${path}:\n` +
          violations
            .map((v) => `  - <${v.tag}> "${v.text}": ratio ${v.ratio}:1 (expected ≥ ${v.required}:1, fg: ${v.fg}, bg: ${v.bg})`)
            .join('\n')
      ).toEqual([]);
    });
  }
});
