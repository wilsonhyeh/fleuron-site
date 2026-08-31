import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const SELF = 'src/lib/repo-privacy-guard.test.ts';

const SKIP_FILES = new Set(['package-lock.json']);

const SKIP_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.icns',
  '.pdf',
  '.docx',
  '.woff',
  '.woff2',
  '.ttf',
]);

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  {
    pattern: new RegExp(['wilson', 'yeh'].join(''), 'i'),
    why: "the maintainer's local account name — leaks a real home directory",
  },
  {
    pattern: new RegExp(['wilson', 'hyeh@gmail'].join(''), 'i'),
    why: "the maintainer's personal email address",
  },
  {
    pattern: new RegExp(['camo', 'uflaging'].join(''), 'i'),
    why: 'names the study this tool was built for',
  },
  {
    pattern: new RegExp(['auti', 'stic'].join(''), 'i'),
    why: 'names the population that study recruits',
  },
  {
    pattern: new RegExp(['\\b', 'UC', 'LA', '\\b'].join(''), 'i'),
    why: 'names the institution the study runs under',
  },
  {
    pattern: new RegExp(['disc', 'overy year'].join(''), 'i'),
    why: 'names the research program the study sits in',
  },
  {
    pattern: new RegExp(['Documents/', 'HQ'].join(''), ''),
    why: 'a private planning workspace path',
  },
  {
    pattern: new RegExp(['\\b', 'AGENTS', '\\.md\\b'].join(''), ''),
    why: 'a private agent-tooling file that does not belong in a public tree',
  },
];

function allCandidateFiles(): string[] {
  return [...new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0'))]
    .filter(Boolean)
    .filter((f) => f !== SELF)
    .filter((f) => !SKIP_FILES.has(f));
}

function candidateTextFiles(): string[] {
  return allCandidateFiles().filter((f) => !SKIP_EXTENSIONS.has(path.extname(f).toLowerCase()));
}

describe('repo-wide privacy guard', () => {
  it('includes new untracked files without requiring staging', () => {
    const fixture = '.privacy-guard-untracked-fixture.txt';
    fs.writeFileSync(path.join(ROOT, fixture), 'Synthetic guard fixture', { flag: 'wx' });
    try { expect(allCandidateFiles()).toContain(fixture); }
    finally { fs.unlinkSync(path.join(ROOT, fixture)); }
  });

  it('finds files to scan at all', () => {
    expect(candidateTextFiles().length).toBeGreaterThan(10);
  });

  it('no tracked or untracked candidate file names the maintainer or the originating study', () => {
    const hits: string[] = [];
    for (const file of candidateTextFiles()) {
      const full = path.join(ROOT, file);
      let content: string;
      try {
        content = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      for (const { pattern, why } of FORBIDDEN) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            hits.push(`${file}:${i + 1} — ${why}`);
          }
        }
      }
    }
    expect(hits, `forbidden identifiers in candidate files:\n${hits.join('\n')}`).toEqual([]);
  });

  it('scans all image filenames and alt attributes in src/ for leaks', () => {
    const hits: string[] = [];

    // 1. Scan image filenames
    for (const file of allCandidateFiles()) {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
        for (const { pattern, why } of FORBIDDEN) {
          if (pattern.test(file)) {
            hits.push(`Image filename ${file} — ${why}`);
          }
        }
      }
    }

    // 2. Scan all alt attributes in src/
    for (const file of candidateTextFiles()) {
      if (!file.startsWith('src/')) continue;
      const full = path.join(ROOT, file);
      let content: string;
      try {
        content = fs.readFileSync(full, 'utf8');
      } catch {
        continue;
      }

      // Find all alt="..." or alt={'...'}
      const altMatches = content.matchAll(/alt=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{['"]([^'"]*)['"]\})/g);
      for (const match of altMatches) {
        const altText = match[1] || match[2] || match[3] || match[4] || '';
        for (const { pattern, why } of FORBIDDEN) {
          if (pattern.test(altText)) {
            hits.push(`${file} alt text "${altText}" — ${why}`);
          }
        }
      }
    }

    expect(hits, `forbidden identifiers in image files or alt text:\n${hits.join('\n')}`).toEqual([]);
  });

  it('would actually catch a leak (negative control)', () => {
    const planted = [
      `/Users/${['wilson', 'yeh'].join('')}/Fleuron/x`,
      `a study of ${['auti', 'stic'].join('')} adults`,
      `${['camo', 'uflaging'].join('')} study team`,
      `at ${['UC', 'LA'].join('')} health`,
      `~/${['Documents/', 'HQ'].join('')}/plan.md`,
      `alt="participants with ${['camo', 'uflaging'].join('')} behavior"`,
    ];
    for (const line of planted) {
      expect(FORBIDDEN.some(({ pattern }) => pattern.test(line)), line).toBe(true);
    }
  });
});
