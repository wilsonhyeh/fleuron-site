import { describe, expect, it } from 'vitest';
import { assetReferences, isLocalAsset } from '../../scripts/lib/asset-references.mjs';
describe('static resource references', () => {
  it('finds srcset, object, poster, inline CSS and resource links regardless of attribute order', () => {
    const html = '<img src="/local.png" srcset="/small.png 1x, https://outside.invalid/large.png 2x"><object data="//outside.invalid/embed"></object><video poster="https://outside.invalid/poster"></video><link href="https://outside.invalid/font" rel="preload"><p style="background:url(https://outside.invalid/bg)"></p>';
    expect(assetReferences(html).filter((url: string) => !isLocalAsset(url))).toHaveLength(5);
  });
  it('does not mistake outbound links or JSON-LD for automatic page assets', () => {
    expect(assetReferences('<a href="https://github.com/example">Source</a><script type="application/ld+json">{"url":"https://schema.org"}</script>')).toEqual([]);
  });
  it('does not silently allow unrelated subdomains', () => {
    expect(isLocalAsset('https://other.fleuron.study/font.woff2')).toBe(false);
    expect(isLocalAsset('/fonts/local.woff2')).toBe(true);
    expect(isLocalAsset('javascript:alert(1)')).toBe(false);
  });
});
