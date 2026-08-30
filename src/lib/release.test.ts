import { describe, it, expect } from 'vitest';
import { parseReleasePayload, formatFileSize } from './release';

const validReleasePayload = {
  tag_name: 'v2.1.0',
  html_url: 'https://github.com/wilson-taiwan/fleuron/releases/tag/v2.1.0',
  published_at: '2026-08-29T15:55:12Z',
  draft: false,
  prerelease: false,
  assets: [
    {
      name: 'latest.json',
      browser_download_url: 'https://github.com/wilson-taiwan/fleuron/releases/download/v2.1.0/latest.json',
      size: 1851,
    },
    {
      name: 'Fleuron_2.1.0_x64-setup.exe',
      browser_download_url: 'https://github.com/wilson-taiwan/fleuron/releases/download/v2.1.0/Fleuron_2.1.0_x64-setup.exe',
      size: 12582912, // 12 MB
    },
    {
      name: 'SHA256SUMS.txt',
      browser_download_url: 'https://github.com/wilson-taiwan/fleuron/releases/download/v2.1.0/SHA256SUMS.txt',
      size: 558,
    },
    {
      name: 'Fleuron_2.1.0_universal.dmg',
      browser_download_url: 'https://github.com/wilson-taiwan/fleuron/releases/download/v2.1.0/Fleuron_2.1.0_universal.dmg',
      size: 18874368, // 18 MB
    },
  ],
};

describe('release parser', () => {
  it('correctly parses happy-path payload with assets out of order', () => {
    const data = parseReleasePayload(validReleasePayload);
    expect(data.version).toBe('2.1.0');
    expect(data.publishedAt).toBe('2026-08-29');
    expect(data.mac.name).toBe('Fleuron_2.1.0_universal.dmg');
    expect(data.mac.url).toBe(
      'https://github.com/wilson-taiwan/fleuron/releases/download/v2.1.0/Fleuron_2.1.0_universal.dmg'
    );
    expect(data.mac.formattedSize).toBe('18.0 MB');
    expect(data.win.name).toBe('Fleuron_2.1.0_x64-setup.exe');
    expect(data.win.url).toBe(
      'https://github.com/wilson-taiwan/fleuron/releases/download/v2.1.0/Fleuron_2.1.0_x64-setup.exe'
    );
    expect(data.win.formattedSize).toBe('12.0 MB');
    expect(data.checksumsUrl).toBe(
      'https://github.com/wilson-taiwan/fleuron/releases/download/v2.1.0/SHA256SUMS.txt'
    );
    expect(data.releaseUrl).toBe('https://github.com/wilson-taiwan/fleuron/releases/tag/v2.1.0');
  });

  it('throws when payload is marked draft', () => {
    const payload = { ...validReleasePayload, draft: true };
    expect(() => parseReleasePayload(payload)).toThrow(/marked as draft/);
  });

  it('throws when payload is marked prerelease', () => {
    const payload = { ...validReleasePayload, prerelease: true };
    expect(() => parseReleasePayload(payload)).toThrow(/marked as prerelease/);
  });

  it('throws when Windows .exe asset is missing', () => {
    const payload = {
      ...validReleasePayload,
      assets: validReleasePayload.assets.filter((a) => !a.name.endsWith('.exe')),
    };
    expect(() => parseReleasePayload(payload)).toThrow(/missing Windows EXE asset/);
  });

  it('throws when macOS .dmg asset is missing', () => {
    const payload = {
      ...validReleasePayload,
      assets: validReleasePayload.assets.filter((a) => !a.name.endsWith('.dmg')),
    };
    expect(() => parseReleasePayload(payload)).toThrow(/missing macOS DMG asset/);
  });

  it('throws on null or non-object payload', () => {
    expect(() => parseReleasePayload(null)).toThrow(/not a valid JSON object/);
    expect(() => parseReleasePayload('string')).toThrow(/not a valid JSON object/);
  });

  it('formats file sizes accurately', () => {
    expect(formatFileSize(500)).toBe('0 KB');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('2 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(18.5 * 1024 * 1024)).toBe('18.5 MB');
  });
});
