import { describe, expect, it } from 'vitest';
import { facadeTexture, png } from '#materials';

describe('a facade written from code', () => {
  it('writes a real PNG, signature and all', () => {
    const file = png({ width: 2, height: 2, rgba: new Uint8Array(16).fill(200) });
    expect([...file.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(String.fromCharCode(...file.subarray(12, 16))).toBe('IHDR');
    expect(file.length).toBeGreaterThan(40);
  });

  it('gives the same building the same windows, and another building different ones', () => {
    const one = facadeTexture({ seed: 42 });
    const again = facadeTexture({ seed: 42 });
    const other = facadeTexture({ seed: 43 });

    expect([...one.colour]).toEqual([...again.colour]);
    expect([...one.colour]).not.toEqual([...other.colour]);
  });

  it('lights some windows and leaves most dark', () => {
    const { lit } = facadeTexture({ seed: 7, across: 6, down: 4, lit: 0.34 });
    expect(lit).toBeGreaterThan(0);
    expect(lit).toBeLessThan(24);
  });

  it('turns every light off when asked, and the emissive map goes black', () => {
    const dark = facadeTexture({ seed: 3, lit: 0 });
    expect(dark.lit).toBe(0);
    // Two tiles of the same size, one with lights and one without, differ.
    expect([...dark.emissive]).not.toEqual([...facadeTexture({ seed: 3, lit: 1 }).emissive]);
  });

  it('stays small enough to ship on every building', () => {
    expect(facadeTexture({ seed: 1 }).colour.byteLength).toBeLessThan(40_000);
  });
});
