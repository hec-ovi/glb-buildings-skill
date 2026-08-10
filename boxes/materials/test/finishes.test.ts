import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FINISHES, PAINTS, STYLES, finish, fits, loadPack, png, tileOf } from '#materials';

const look = { mode: 'textured', style: 'cyber', seed: 7 } as const;

describe('the finish library', () => {
  it('knows every finish a part can be given, and refuses one it does not', () => {
    for (const name of [...FINISHES, ...PAINTS]) expect(finish(name, look), name).toBeDefined();
    expect(finish('marzipan', look)).toBeUndefined();
  });

  it('carries a picture when the building is textured and none when it is plain', () => {
    expect(finish('concrete', look)?.image).toBeDefined();
    expect(finish('concrete', { ...look, mode: 'plain' })?.image).toBeUndefined();
    // The flat colour is there either way, so a plain file is still a named colour per part.
    expect(finish('concrete', { ...look, mode: 'plain' })?.colour).toHaveLength(3);
  });

  it('tints one tile into any colour, so a tower runs six lines for one picture', () => {
    const cyan = finish('neon:cyan', look)!;
    const magenta = finish('neon:magenta', look)!;
    const mixed = finish('neon:#ff2f88', look)!;

    expect(cyan.emissive).not.toEqual(magenta.emissive);
    expect(mixed.emissive).toEqual([255 / 255, 0x2f / 255, 0x88 / 255]);
    // And it is one picture: the tile does not change with the colour.
    expect([...cyan.image!.load().colour.bytes]).toEqual([...magenta.image!.load().colour.bytes]);
  });

  it('draws every family differently, and the same one the same way twice', () => {
    const drawn = (style: (typeof STYLES)[number]) => [...finish('facade', { ...look, style })!.image!.load().colour.bytes];
    expect(drawn('modern')).not.toEqual(drawn('cyber'));
    expect(drawn('fifties')).toEqual(drawn('fifties'));
  });

  it('keeps every tile small enough to ship on every building in a scene', () => {
    for (const style of STYLES) {
      for (const name of FINISHES) {
        const image = finish(name, { ...look, style })?.image;
        if (!image) continue;
        expect(image.load().colour.bytes.byteLength, `${style} ${name}`).toBeLessThan(40_000);
      }
    }
  });

  it('says which finishes fill an element and which tile by the metre', () => {
    expect(fits('window')).toBe(true);
    expect(fits('concrete')).toBe(false);
    expect(tileOf('pipe')).toBe(1);
    expect(tileOf('concrete')).toBe(3);
  });
});

describe('a pack of generated images', () => {
  it('stands in for the drawn tile, and leaves the rest of them alone', async () => {
    const root = await mkdtemp(join(tmpdir(), 'packs-'));
    await mkdir(join(root, 'cyber'), { recursive: true });
    const supplied = png({ width: 2, height: 2, rgba: new Uint8Array(16).fill(180) });
    await writeFile(join(root, 'cyber', 'concrete.png'), supplied);

    const pack = await loadPack(root, 'cyber');
    expect(pack.finishes).toEqual(['concrete']);

    const dressed = { ...look, pack };
    expect([...finish('concrete', dressed)!.image!.load().colour.bytes]).toEqual([...supplied]);
    expect([...finish('metal', dressed)!.image!.load().colour.bytes]).toEqual([...finish('metal', look)!.image!.load().colour.bytes]);
  });

  it('is nothing at all when the folder is not there, so a build still works', async () => {
    const pack = await loadPack(join(tmpdir(), 'no-such-packs'), 'cyber');
    expect(pack.finishes).toEqual([]);
    expect(pack.get('concrete')).toBeUndefined();
  });
});
