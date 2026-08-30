import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(import.meta.dirname, '../dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist/ directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

function getAllHtmlFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

const htmlFiles = getAllHtmlFiles(DIST_DIR);
if (htmlFiles.length === 0) {
  console.error('Error: No HTML files found in dist/.');
  process.exit(1);
}

// 1. Index all HTML files and their IDs/anchors
const pageAnchors = new Map(); // relativePath -> Set<id>

for (const filePath of htmlFiles) {
  const relPath = path.relative(DIST_DIR, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const anchors = new Set();

  const idMatches = content.matchAll(/\sid=["']([^"']+)["']/g);
  for (const m of idMatches) {
    anchors.add(m[1]);
  }

  const nameMatches = content.matchAll(/<a\s+[^>]*name=["']([^"']+)["']/g);
  for (const m of nameMatches) {
    anchors.add(m[1]);
  }

  pageAnchors.set(relPath, anchors);
}

function resolveInternalTarget(currentRelPath, targetUrl) {
  const [urlPath, anchor] = targetUrl.split('#');

  let targetFilePath = '';
  if (!urlPath) {
    // Self-page anchor
    targetFilePath = currentRelPath;
  } else if (urlPath.startsWith('/')) {
    // Root-relative path
    let clean = urlPath.slice(1);
    if (clean === '' || clean.endsWith('/')) {
      targetFilePath = path.join(clean, 'index.html');
    } else if (path.extname(clean) !== '') {
      targetFilePath = clean;
    } else {
      // Check if directory with index.html exists, or .html file
      if (fs.existsSync(path.join(DIST_DIR, clean, 'index.html'))) {
        targetFilePath = path.join(clean, 'index.html');
      } else if (fs.existsSync(path.join(DIST_DIR, `${clean}.html`))) {
        targetFilePath = `${clean}.html`;
      } else {
        targetFilePath = path.join(clean, 'index.html');
      }
    }
  } else {
    // Document-relative path
    const currentDir = path.dirname(currentRelPath);
    let resolved = path.join(currentDir, urlPath);
    if (resolved.endsWith('/')) {
      targetFilePath = path.join(resolved, 'index.html');
    } else if (path.extname(resolved) !== '') {
      targetFilePath = resolved;
    } else {
      if (fs.existsSync(path.join(DIST_DIR, resolved, 'index.html'))) {
        targetFilePath = path.join(resolved, 'index.html');
      } else {
        targetFilePath = path.join(resolved, 'index.html');
      }
    }
  }

  return { targetFilePath, anchor };
}

// 2. Validate all internal links and asset references
const errors = [];
const externalLinks = new Set();
let checkedCount = 0;

for (const filePath of htmlFiles) {
  const relPath = path.relative(DIST_DIR, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Match href and src
  const linkMatches = content.matchAll(/\s(?:href|src)=["']([^"']+)["']/g);
  for (const m of linkMatches) {
    const rawUrl = m[1].trim();

    if (
      rawUrl.startsWith('http://') ||
      rawUrl.startsWith('https://') ||
      rawUrl.startsWith('mailto:') ||
      rawUrl.startsWith('tel:') ||
      rawUrl.startsWith('javascript:') ||
      rawUrl.startsWith('data:')
    ) {
      externalLinks.add(rawUrl);
      continue;
    }

    checkedCount++;
    const { targetFilePath, anchor } = resolveInternalTarget(relPath, rawUrl);
    const fullTargetPath = path.join(DIST_DIR, targetFilePath);

    if (!fs.existsSync(fullTargetPath)) {
      errors.push({
        sourceFile: relPath,
        rawUrl,
        reason: `Target file not found: dist/${targetFilePath}`,
      });
      continue;
    }

    if (anchor) {
      const anchors = pageAnchors.get(targetFilePath);
      if (anchors && !anchors.has(anchor)) {
        errors.push({
          sourceFile: relPath,
          rawUrl,
          reason: `Anchor "#${anchor}" not found in dist/${targetFilePath}`,
        });
      }
    }
  }
}

console.log(`\nLink Check Summary:`);
console.log(`- HTML Pages scanned: ${htmlFiles.length}`);
console.log(`- Internal references checked: ${checkedCount}`);
console.log(`- External URLs listed: ${externalLinks.size}`);

if (errors.length > 0) {
  console.error(`\n❌ Found ${errors.length} broken internal links/references:`);
  for (const err of errors) {
    console.error(`  - In ${err.sourceFile}: "${err.rawUrl}" -> ${err.reason}`);
  }
  process.exit(1);
} else {
  console.log(`✓ All internal links and asset references resolve successfully.\n`);
}
