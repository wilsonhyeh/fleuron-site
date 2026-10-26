import { parse } from 'parse5';

export function elements(html) {
  const result = [];
  function visit(node) {
    if (node.tagName) result.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(parse(html));
  return result;
}
export function attr(node, name) { return node.attrs?.find(a => a.name === name)?.value; }
export function textContent(node) { return node.value ?? (node.childNodes ?? []).map(textContent).join(''); }
export function tags(nodes, name) { return nodes.filter(node => node.tagName === name); }
export function meta(nodes, key) { return nodes.filter(n => n.tagName === 'meta' && (attr(n, 'name') === key || attr(n, 'property') === key)).map(n => attr(n, 'content') ?? ''); }
export function canonical(nodes) { return nodes.filter(n => n.tagName === 'link' && attr(n, 'rel') === 'canonical').map(n => attr(n, 'href')); }
export function schemaNodes(nodes) {
  return tags(nodes, 'script').filter(n => attr(n, 'type') === 'application/ld+json').flatMap(n => {
    const data = JSON.parse(textContent(n));
    return data['@graph'] ?? (Array.isArray(data) ? data : [data]);
  });
}

export function auditPage(html, page, { errorPage = false } = {}) {
  const nodes = elements(html), errors = [];
  const expect = (ok, message) => { if (!ok) errors.push(message); };
  expect(tags(nodes, 'h1').length === 1, 'expected one H1');
  const titles = tags(nodes, 'title').filter(n => n.parentNode?.tagName === 'head');
  expect(titles.length === 1 && textContent(titles[0]).trim() === page.title, 'page title mismatch');
  expect(meta(nodes, 'description').length === 1 && meta(nodes, 'description')[0] === page.description, 'description mismatch');
  const robots = meta(nodes, 'robots').join(',');
  if (errorPage) {
    expect(/\bnoindex\b/i.test(robots), 'error page must be noindex');
    expect(canonical(nodes).length === 0, 'error page must not canonicalize to home');
  } else {
    const expectedUrl = new URL(page.path, 'https://fleuron.study').href;
    expect(canonical(nodes).length === 1 && canonical(nodes)[0] === expectedUrl, 'canonical must match final URL');
    expect(meta(nodes, 'og:url').length === 1 && meta(nodes, 'og:url')[0] === expectedUrl, 'og:url must match canonical');
    expect(!/\b(noindex|none)\b/i.test(robots), 'indexable page has noindex');
  }
  try {
    const schemas = schemaNodes(nodes);
    for (const schema of schemas) {
      expect(!('aggregateRating' in schema) && !('review' in schema), 'unverified rating or review');
      if (schema['@type'] === 'SoftwareApplication') {
        expect(page.path === '/' && !errorPage, 'SoftwareApplication belongs on home only');
        expect(schema.name === 'Fleuron' && schema.softwareVersion, 'application identity/version missing');
        expect(schema.offers?.price === 0 && schema.offers?.priceCurrency === 'USD', 'offline offer must be free');
        expect(schema.license === 'https://github.com/wilsonhyeh/fleuron/blob/main/LICENSE', 'license mismatch');
        expect(schema.operatingSystem?.includes('macOS 14+') && schema.operatingSystem?.includes('Windows 11 x64'), 'support mismatch');
        // Truthfulness guard for the product claim in structured data. 2.8.0
        // has no account or sync service, so the schema must state the local
        // scope and must not advertise collaboration as available.
        expect(schema.description?.includes('no account'), 'description omits local-only scope');
        expect(!/optional team sync|hosted collaboration|free during beta/i.test(schema.description ?? ''), 'description advertises paused collaboration');
      }
    }
    if (page.path === '/' && !errorPage) {
      expect(schemas.filter(s => s['@type'] === 'SoftwareApplication').length === 1, 'missing or duplicate SoftwareApplication');
      expect(schemas.filter(s => s['@type'] === 'WebSite').length === 1, 'missing or duplicate WebSite');
    }
  } catch { errors.push('invalid JSON-LD'); }
  return errors;
}
