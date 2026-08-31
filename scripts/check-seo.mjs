import fs from 'node:fs';
import path from 'node:path';
import { elements, attr, tags, textContent, auditPage } from './lib/html.mjs';

const root = path.resolve(import.meta.dirname, '..');
const pages = JSON.parse(fs.readFileSync(path.join(root, 'src/content/site-pages.json'), 'utf8'));
const errors = [], links = new Set();
for (const key of ['path', 'title', 'description']) {
  if (new Set(pages.map(p => p[key])).size !== pages.length) errors.push(`duplicate ${key}`);
}
for (const page of pages) {
  if (!page.path.endsWith('/')) errors.push(`non-final path: ${page.path}`);
  const file = path.join(root, 'dist', page.path, 'index.html');
  if (!fs.existsSync(file)) { errors.push(`missing ${page.path}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  errors.push(...auditPage(html, page).map(error => `${page.path}: ${error}`));
  for (const a of tags(elements(html), 'a')) {
    const href = attr(a, 'href');
    if (!href) continue;
    const url = new URL(href, new URL(page.path, 'https://fleuron.study'));
    if (url.origin !== 'https://fleuron.study') continue;
    links.add(url.pathname);
    const normalized = url.pathname === '/' ? '/' : `${url.pathname.replace(/\/+$/, '')}/`;
    if (pages.some(p => p.path === normalized) && url.pathname !== normalized) errors.push(`${page.path}: non-final internal link ${href}`);
  }
}
for (const page of pages) if (!links.has(page.path)) errors.push(`no internal link to ${page.path}`);
const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
const nodes = elements(sitemap);
const urls = tags(nodes, 'loc').map(textContent);
const expected = pages.map(p => new URL(p.path, 'https://fleuron.study').href).sort();
if (JSON.stringify(urls.sort()) !== JSON.stringify(expected)) errors.push('sitemap differs from indexable registry');
if (nodes.some(n => ['lastmod', 'priority', 'changefreq'].includes(n.tagName))) errors.push('sitemap has unsupported freshness/priority fields');
const notFound = path.join(root, 'dist/404.html');
if (!fs.existsSync(notFound)) errors.push('root 404.html missing: Pages would use SPA fallback');
else errors.push(...auditPage(fs.readFileSync(notFound, 'utf8'), { path: '/404.html', title: 'Page not found — Fleuron', description: 'This address does not match a Fleuron page.' }, { errorPage: true }).map(e => `404: ${e}`));
const headers = fs.readFileSync(path.join(root, 'dist/_headers'), 'utf8');
if (!headers.includes('https://:version.fleuron-site.pages.dev/*\n  X-Robots-Tag: noindex')) errors.push('preview noindex rule missing');
if (/^https:\/\/fleuron\.study[^\n]*\n\s+X-Robots-Tag:\s*noindex/im.test(headers)) errors.push('apex noindex rule found');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`SEO structure passed: ${pages.length} indexable pages, truthful schema, final canonicals, sitemap, root 404 and preview rule. Deployed status/headers require a separate check.`);
