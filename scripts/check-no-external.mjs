import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(import.meta.dirname, '../dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

function getAllFiles(dir, exts) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(full, exts));
    } else if (entry.isFile() && exts.some((ext) => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const files = getAllFiles(DIST_DIR, ['.html', '.css']);
if (files.length === 0) {
  console.error('Error: No HTML or CSS files found in dist/.');
  process.exit(1);
}

const errors = [];
let checkedAssetsCount = 0;

function isAllowedAssetUrl(urlStr) {
  if (!urlStr || urlStr.startsWith('data:') || urlStr.startsWith('blob:')) {
    return true;
  }

  // Relative URLs are internal assets
  if (!urlStr.includes('://') && !urlStr.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(urlStr, 'https://fleuron.study');
    const host = parsed.hostname.toLowerCase();
    if (host === 'fleuron.study' || host.endsWith('.fleuron.study') || host === 'localhost' || host === '127.0.0.1') {
      return true;
    }
  } catch (e) {
    return false;
  }

  return false;
}

for (const filePath of files) {
  const relPath = path.relative(DIST_DIR, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.endsWith('.html')) {
    // 1. Script tags: <script ... src="..." ...>
    const scriptSrcMatches = content.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi);
    for (const m of scriptSrcMatches) {
      checkedAssetsCount++;
      const src = m[1].trim();
      if (!isAllowedAssetUrl(src)) {
        errors.push({
          file: relPath,
          type: 'External script request',
          url: src,
        });
      }
    }

    // 2. Link tags: <link rel="stylesheet|preload|prefetch|icon" ... href="...">
    const linkMatches = content.matchAll(/<link\b[^>]*\shref=["']([^"']+)["'][^>]*>/gi);
    for (const m of linkMatches) {
      const fullTag = m[0];
      const href = m[1].trim();
      // Check if rel is a resource loading tag
      if (/\brel=["'](?:stylesheet|preload|prefetch|dns-prefetch|preconnect|modulepreload|icon|apple-touch-icon)["']/i.test(fullTag)) {
        checkedAssetsCount++;
        if (!isAllowedAssetUrl(href)) {
          errors.push({
            file: relPath,
            type: 'External link resource request',
            url: href,
          });
        }
      }
    }

    // 3. Media tags: <img>, <video>, <audio>, <source>, <track>, <iframe>, <embed>, <object>
    const mediaMatches = content.matchAll(/<(?:img|video|audio|source|track|iframe|embed)\b[^>]*\ssrc=["']([^"']+)["']/gi);
    for (const m of mediaMatches) {
      checkedAssetsCount++;
      const src = m[1].trim();
      if (!isAllowedAssetUrl(src)) {
        errors.push({
          file: relPath,
          type: 'External media resource request',
          url: src,
        });
      }
    }
  }

  // 4. CSS url(...) and @import in both .css files and inline <style> blocks
  const cssUrlMatches = content.matchAll(/url\(\s*(?:['"]?)([^'"()]+)(?:['"]?)\s*\)/gi);
  for (const m of cssUrlMatches) {
    checkedAssetsCount++;
    const targetUrl = m[1].trim();
    if (!isAllowedAssetUrl(targetUrl)) {
      errors.push({
        file: relPath,
        type: 'External CSS url() resource request',
        url: targetUrl,
      });
    }
  }

  const importMatches = content.matchAll(/@import\s+(?:url\(['"]?([^'"()]+)['"]?\)|['"]([^'"]+)['"])/gi);
  for (const m of importMatches) {
    checkedAssetsCount++;
    const targetUrl = (m[1] || m[2] || '').trim();
    if (!isAllowedAssetUrl(targetUrl)) {
      errors.push({
        file: relPath,
        type: 'External CSS @import request',
        url: targetUrl,
      });
    }
  }
}

console.log(`\nNo-External-Request Check Summary:`);
console.log(`- Files scanned: ${files.length} (${files.filter((f) => f.endsWith('.html')).length} HTML, ${files.filter((f) => f.endsWith('.css')).length} CSS)`);
console.log(`- Asset request references verified: ${checkedAssetsCount}`);

if (errors.length > 0) {
  console.error(`\n❌ Found ${errors.length} third-party resource requests (strictly prohibited):`);
  for (const err of errors) {
    console.error(`  - In ${err.file}: [${err.type}] "${err.url}"`);
  }
  process.exit(1);
} else {
  console.log(`✓ Zero third-party resource requests detected across all built files.\n`);
}
