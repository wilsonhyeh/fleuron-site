import { describe, it, expect } from 'vitest';
import { rewriteMarkdownLinks, transformInstallingMarkdown } from './install-doc';

describe('install-doc transform and link rewriting', () => {
  it('rewrites known relative links to GitHub absolute URLs', () => {
    const input = `See [IT Deployment Guide](docs/IT-DEPLOYMENT.md) and [Support](SUPPORT.md).`;
    const output = rewriteMarkdownLinks(input);
    expect(output).toContain('https://github.com/wilson-taiwan/fleuron/blob/main/docs/IT-DEPLOYMENT.md');
    expect(output).toContain('https://github.com/wilson-taiwan/fleuron/blob/main/SUPPORT.md');
  });

  it('leaves absolute URLs and anchors untouched', () => {
    const input = `Visit [Releases](https://github.com/wilson-taiwan/fleuron/releases) or [Section](#install-on-macos).`;
    const output = rewriteMarkdownLinks(input);
    expect(output).toBe(input);
  });

  it('throws on unmapped relative link', () => {
    const input = `Check [Mystery](mystery-unmapped-doc.md).`;
    expect(() => rewriteMarkdownLinks(input)).toThrow(/unmapped relative link/);
  });

  it('throws on empty markdown content', () => {
    expect(() => transformInstallingMarkdown('', 'abcdef123')).toThrow(/content is empty/);
  });

  it('transforms valid markdown to HTML and extracts short SHA', () => {
    const markdown = `# Installing Fleuron\n\nSee [IT](docs/IT-DEPLOYMENT.md).`;
    const result = transformInstallingMarkdown(markdown, '1fa3e6f064336209d5cf69a68c11c1f0a5a4bdb5');
    expect(result.shortSha).toBe('1fa3e6f');
    expect(result.html).toContain('<h1>Installing Fleuron</h1>');
    expect(result.html).toContain('https://github.com/wilson-taiwan/fleuron/blob/main/docs/IT-DEPLOYMENT.md');
  });
});
