import fs from 'node:fs';
import path from 'node:path';
import { assetReferences, isLocalAsset } from './lib/asset-references.mjs';
const dist = path.resolve(import.meta.dirname, '../dist');
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
const candidates = files(dist).filter(file => /\.(html|css)$/.test(file));
const failures = [];
let count = 0;
for (const file of candidates) {
  const refs = assetReferences(fs.readFileSync(file, 'utf8'), file.endsWith('.html'));
  count += refs.length;
  for (const ref of refs) if (!isLocalAsset(ref)) failures.push(`${path.relative(dist, file)}: external resource reference ${ref}`);
}
if (!candidates.length) failures.push('No built HTML/CSS to inspect.');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Static asset-reference check passed: ${candidates.length} files, ${count} references. This does not test arbitrary runtime requests or hosting-layer reports.`);
