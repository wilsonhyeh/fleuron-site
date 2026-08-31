import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { elements, tags, textContent, auditPage, meta } from './lib/html.mjs';

const { values } = parseArgs({ options: { base: { type: 'string' }, 'production-hosts': { type: 'boolean', default: false } } });
if (!values.base) throw new Error('Pass --base https://fleuron.study (or the local verification server). Read-only GET checks.');
const base = new URL(values.base);
if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('--base must be an HTTP(S) origin without credentials/path/query');
if (values['production-hosts'] && base.origin !== 'https://fleuron.study') throw new Error('--production-hosts requires --base https://fleuron.study');
const pages = JSON.parse(fs.readFileSync(new URL('../src/content/site-pages.json', import.meta.url), 'utf8'));
const failures = [], rows = [];
const assert = (ok, label) => { if (!ok) failures.push(label); };
async function get(url) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  if (body.length > 5_000_000) throw new Error('Unexpectedly large response');
  rows.push({ url: String(url), status: response.status, nel: response.headers.has('nel'), reportTo: response.headers.has('report-to') });
  return { response, body };
}
async function run(label, fn) {
  try { await fn(); } catch (error) { failures.push(`${label}: NETWORK/PARSE ERROR (${error.name})`); }
}
for (const page of pages) {
  await run(page.path, async () => {
    const { response, body } = await get(new URL(page.path, base));
    assert(response.status === 200, `${page.path}: expected direct 200, got ${response.status}`);
    assert(!/\b(noindex|none)\b/i.test(response.headers.get('x-robots-tag') ?? ''), `${page.path}: noindex response header`);
    failures.push(...auditPage(body, page).map(e => `${page.path}: ${e}`));
    if (page.path !== '/') {
      const { response: redirect } = await get(new URL(page.path.slice(0, -1), base));
      assert([301, 308].includes(redirect.status), `${page.path}: slashless URL must permanently redirect`);
      assert(new URL(redirect.headers.get('location') ?? '', base).href === new URL(page.path, base).href, `${page.path}: wrong slash redirect destination`);
    }
  });
}
await run('404', async () => {
  const { response, body } = await get(new URL('/search-check-missing-20260830/', base));
  assert(response.status === 404, 'missing path must return 404');
  assert(meta(elements(body), 'robots').some(s => /noindex/i.test(s)), 'custom 404 needs noindex');
});
await run('sitemap', async () => {
  const { response, body } = await get(new URL('/sitemap.xml', base));
  assert(response.status === 200, 'sitemap must return 200');
  const urls = tags(elements(body), 'loc').map(textContent).sort();
  assert(JSON.stringify(urls) === JSON.stringify(pages.map(p => new URL(p.path, 'https://fleuron.study').href).sort()), 'sitemap differs from public routes');
});
await run('robots', async () => {
  const { response, body } = await get(new URL('/robots.txt', base));
  assert(response.status === 200 && body.includes('Sitemap: https://fleuron.study/sitemap.xml'), 'robots/sitemap declaration mismatch');
  assert(!/^Disallow:\s*\/\s*$/im.test(body), 'robots blocks the whole site');
});
if (values['production-hosts']) {
  for (const host of ['http://fleuron.study', 'http://www.fleuron.study', 'https://www.fleuron.study', 'https://fleuron-site.pages.dev']) {
    await run(host, async () => {
      const expected = 'https://fleuron.study/download/?audit=1';
      let url = new URL('/download/?audit=1', host), finished = false;
      for (let hop = 0; hop < 6; hop++) {
        const { response } = await get(url);
        if (response.status === 200) { assert(hop > 0 && url.href === expected, `${host}: duplicate 200 or lost path/query`); finished = true; break; }
        assert([301, 308].includes(response.status), `${host}: non-permanent redirect ${response.status}`);
        const location = response.headers.get('location');
        if (!location) break;
        url = new URL(location, url);
        if (!['fleuron.study', 'www.fleuron.study', 'fleuron-site.pages.dev'].includes(url.hostname) || url.username || url.password) throw new Error('Unexpected redirect host');
      }
      assert(finished, `${host}: redirect chain did not finish`);
    });
  }
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), method: 'GET; not a Googlebot test', responses: rows, failures }, null, 2));
if (failures.length) process.exit(1);
console.log('Deployed URL checks passed. Search Console, preview headers and mail DNS require separate evidence.');
