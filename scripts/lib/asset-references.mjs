import parseSrcset from 'parse-srcset';
import { elements, attr, tags, textContent } from './html.mjs';

export function isLocalAsset(value) {
  if (!value || /^(data:|blob:|#)/i.test(value)) return true;
  try { return new URL(value, 'https://fleuron.study').origin === 'https://fleuron.study'; }
  catch { return false; }
}

export function assetReferences(content, html = true) {
  const refs = [], css = [];
  if (html) {
    const nodes = elements(content);
    const attrs = { script: ['src'], img: ['src'], video: ['src', 'poster'], audio: ['src'], source: ['src'], track: ['src'], iframe: ['src'], embed: ['src'], object: ['data'], image: ['href', 'xlink:href'], use: ['href', 'xlink:href'], input: ['src'] };
    for (const node of nodes) {
      for (const name of attrs[node.tagName] ?? []) if (attr(node, name)) refs.push(attr(node, name));
      if (node.tagName === 'link' && (attr(node, 'rel') ?? '').split(/\s+/).some(rel => ['stylesheet', 'preload', 'prefetch', 'dns-prefetch', 'preconnect', 'modulepreload', 'icon', 'apple-touch-icon', 'manifest'].includes(rel))) refs.push(attr(node, 'href'));
      if (['img', 'source'].includes(node.tagName) && attr(node, 'srcset')) refs.push(...parseSrcset(attr(node, 'srcset')).map(candidate => candidate.url));
      if (attr(node, 'style')) css.push(attr(node, 'style'));
      if (node.tagName === 'iframe' && attr(node, 'srcdoc')) refs.push(...assetReferences(attr(node, 'srcdoc')));
    }
    css.push(...tags(nodes, 'style').map(textContent));
  } else css.push(content);
  for (const text of css) {
    for (const match of text.matchAll(/url\(\s*(?:['"]?)([^'"()]+)(?:['"]?)\s*\)/gi)) refs.push(match[1].trim());
    for (const match of text.matchAll(/@import\s+['"]([^'"]+)['"]/gi)) refs.push(match[1].trim());
  }
  return refs.filter(Boolean);
}
