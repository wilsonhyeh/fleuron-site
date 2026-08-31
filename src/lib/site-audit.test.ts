import { describe, expect, it } from 'vitest';
import { auditPage } from '../../scripts/lib/html.mjs';
const page = { path: '/download/', title: 'Download', description: 'Get the app' };
const html = '<html><head><title>Download</title><meta name="description" content="Get the app"><link rel="canonical" href="https://fleuron.study/download/"><meta property="og:url" content="https://fleuron.study/download/"></head><body><h1>Download</h1></body></html>';
describe('search audit regressions', () => {
  it('accepts aligned final URLs and rejects the old slash mismatch', () => {
    expect(auditPage(html, page)).toEqual([]);
    expect(auditPage(html.replaceAll('/download/', '/download'), page)).toContain('canonical must match final URL');
  });
  it('rejects invented reviews and broken JSON-LD', () => {
    const reviewed = html.replace('</body>', '<script type="application/ld+json">{"@type":"SoftwareApplication","review":{"rating":5}}</script></body>');
    expect(auditPage(reviewed, page)).toContain('unverified rating or review');
    expect(auditPage(html.replace('</body>', '<script type="application/ld+json">{bad}</script></body>'), page)).toContain('invalid JSON-LD');
  });
  it('rejects indexable errors and noindex landing pages', () => {
    expect(auditPage(html, page, { errorPage: true })).toContain('error page must be noindex');
    expect(auditPage(html.replace('</head>', '<meta name="robots" content="noindex"></head>'), page)).toContain('indexable page has noindex');
  });
});
