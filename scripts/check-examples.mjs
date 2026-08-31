import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { elements, textContent } from './lib/html.mjs';

const root = path.resolve(import.meta.dirname, '../public/examples/community-garden');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const corpus = JSON.parse(fs.readFileSync(path.join(root, 'corpus.json'), 'utf8'));
const errors = [];
const check = (ok, message) => { if (!ok) errors.push(message); };
const required = ['README.txt', 'corpus.json', 'coding-workspace.webp', 'report.html', 'report.pdf', 'coded-segments.csv', ...['01', '02'].flatMap(n => ['txt', 'vtt', 'docx'].map(ext => `interview-${n}.${ext}`))];
check(manifest.synthetic === true && manifest.participantData === false && manifest.license === 'CC0-1.0', 'synthetic/license declaration missing');
check(/^[a-f0-9]{40}$/.test(manifest.provenance?.sourceBaseCommit), 'source base commit missing');
check(manifest.provenance?.version === '2.1.0 development', 'review export provenance before changing the example version');
check(JSON.stringify(manifest.files.map(f => f.name).sort()) === JSON.stringify(required.sort()), 'manifest does not list exactly the expected artifacts');
check(new Set(manifest.files.map(f => f.name)).size === manifest.files.length, 'duplicate manifest file');
for (const file of manifest.files) {
  if (path.basename(file.name) !== file.name) { errors.push('invalid manifest path'); continue; }
  const location = path.join(root, file.name);
  if (!fs.existsSync(location)) { errors.push(`missing ${file.name}`); continue; }
  const bytes = fs.readFileSync(location);
  check(bytes.length === file.bytes, `size mismatch: ${file.name}`);
  check(createHash('sha256').update(bytes).digest('hex') === file.sha256, `hash mismatch: ${file.name}`);
  if (file.name.endsWith('.pdf')) check(bytes.subarray(0, 5).toString() === '%PDF-', 'PDF signature');
  if (file.name.endsWith('.docx')) check(bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])), `DOCX ZIP signature: ${file.name}`);
  if (file.name.endsWith('.webp')) check(bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP', 'WebP signature');
  const built = path.resolve(root, '../../../dist/examples/community-garden', file.name);
  check(fs.existsSync(built) && fs.readFileSync(built).equals(bytes), `built artifact differs or missing: ${file.name}`);
}
check(corpus.length === manifest.expected.interviews, 'interview count');
for (const interview of corpus) {
  check(interview.turns.length === manifest.expected.turnsPerInterview, `turn count: ${interview.id}`);
  for (const extension of ['txt', 'vtt']) {
    const content = fs.readFileSync(path.join(root, `${interview.id}.${extension}`), 'utf8');
    if (extension === 'vtt') check(content.startsWith('WEBVTT\n'), 'VTT header');
    for (const [speaker, text] of interview.turns) check(content.includes(`${speaker}: ${text}`), `${extension} missing speaker/text: ${interview.id}`);
  }
}
const rows = parse(fs.readFileSync(path.join(root, 'coded-segments.csv')), { columns: true, bom: true, skip_empty_lines: true });
check(rows.length === manifest.expected.codedSegments, 'CSV row count');
const phrase = rows.find(row => row.quote_text === manifest.expected.phrase);
check(phrase?.code_names === manifest.expected.renamedCode && phrase?.segment_memo === manifest.expected.codingMemo, 'CSV phrase/code/memo mismatch');
const wholeTurn = corpus[0].turns[3][1];
check(rows.some(row => row.quote_text === wholeTurn && row.code_names === 'Rules and care'), 'CSV whole-turn mismatch');
check(rows.every(row => row.coder_name === manifest.expected.coder && row.participant_label === 'Volunteer A'), 'CSV attribution mismatch');
const reportText = elements(fs.readFileSync(path.join(root, 'report.html'), 'utf8')).filter(n => n.tagName === 'body').map(textContent).join('');
for (const value of [manifest.expected.phrase, manifest.expected.renamedCode, manifest.expected.codingMemo, wholeTurn, manifest.expected.coder]) check(reportText.includes(value), 'HTML report does not match exported coding');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Example integrity passed: synthetic corpus, manifest, format signatures, built copies and HTML/CSV coding consistency. PDF/DOCX visual and metadata inspection and native workflow verification remain separate evidence.');
