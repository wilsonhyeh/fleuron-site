import { describe, expect, it } from 'vitest';
import { serializeStructuredData } from './structured-data';

describe('inline structured data', () => {
  it('round-trips text without permitting an HTML script breakout', () => {
    const data = { name: '</script><script>alert(1)</script>&\u2028\u2029' };
    const serialized = serializeStructuredData(data);
    expect(serialized).not.toMatch(/[<>&\u2028\u2029]/);
    expect(JSON.parse(serialized)).toEqual(data);
  });
});
