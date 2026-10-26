import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'src');
const SOURCE_EXTENSIONS = new Set(['.astro', '.ts', '.json']);
// A Fleuron release number written into static copy goes stale as soon as the
// next release ships: only the footer, download details and structured data
// should name a version, and they read it from the GitHub release at build
// time (src/lib/release.ts). External tools may still be cited by version
// (QualCoder 3.8.2), and release fixtures are mocked data, so both are out of
// scope for this check.
const VERSION_LITERAL = /\bFleuron\s+v?\d+\.\d+(?:\.\d+)?\b|\b2\.\d+\.\d+\b/g;

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(full);
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) return [];
    if (entry.name.endsWith('.test.ts')) return [];
    return [full];
  });
}

const files = collect(src);
const failures = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(VERSION_LITERAL)) {
    const line = text.slice(0, match.index).split('\n').length;
    failures.push(`${path.relative(root, file)}:${line}: "${match[0]}"`);
  }
}

if (failures.length) {
  console.error(
    'Fleuron release version hard-coded in source copy. Read it from the GitHub release (src/lib/release.ts) instead:\n' +
      failures.join('\n')
  );
  process.exit(1);
}
console.log(`Copy check passed: no Fleuron version literals in ${files.length} source files.`);
