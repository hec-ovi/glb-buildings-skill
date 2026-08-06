import { describe, expect, it } from 'vitest';
import { BuildingError, newDocument, parseDocument, type BuildingDocument } from '#spec';
import { assemble, findBay, floors, seamsMatch } from '#assemble';

const doc = newDocument('tower-a', { width: 18, depth: 14, floors: 14 });

function withBands(bands: BuildingDocument['bands']): BuildingDocument {
  return parseDocument({ ...doc, bands });
}

describe('assemble', () => {
  it('stacks bands from the ground with no gap between them', () => {
    const scene = assemble(doc);
    let y = 0;
    for (const band of scene.bands) {
      expect(band.y0).toBe(y);
      y = band.y1;
    }
    expect(scene.size.height).toBe(y);
  });

  it('splits every side into bays that cover it exactly', () => {
    const scene = assemble(doc);
    for (const floor of floors(scene)) {
      for (const side of ['N', 'E', 'S', 'W'] as const) {
        const bays = floor.bays.filter((bay) => bay.side === side);
        const covered = bays.reduce((sum, bay) => sum + bay.width, 0);
        expect(covered).toBe(side === 'N' || side === 'S' ? doc.footprint.width : doc.footprint.depth);
      }
    }
  });

  it('gives every floor of a band the same bay layout, so the mesh is written once', () => {
    const band = assemble(doc).bands.find((b) => b.id === 'body');
    const counts = new Set(band!.floors.map((floor) => floor.bays.length));
    expect(counts.size).toBe(1);
  });

  it('names bays so a human can read them back', () => {
    const scene = assemble(doc);
    expect(findBay(scene, 'body.f3.S1')?.side).toBe('S');
    expect(findBay(scene, 'body.f3.S99')).toBeUndefined();
  });

  it('matches the seams of two bands on the same footprint, and not of an inset one', () => {
    const scene = assemble(
      withBands([
        { id: 'a', kind: 'bulk', tier: 'flat', floors: 2, template: 'bulk-flat' },
        { id: 'b', kind: 'bulk', tier: 'flat', floors: 2, template: 'bulk-flat' },
        { id: 'c', kind: 'bulk', tier: 'flat', floors: 2, template: 'bulk-flat', inset: 1500 },
      ] as BuildingDocument['bands']),
    );
    const [a, b, c] = scene.bands;
    expect(seamsMatch(a!.seam, b!.seam)).toBe(true);
    expect(seamsMatch(b!.seam, c!.seam)).toBe(false);
  });

  it('refuses a band that insets past its own footprint', () => {
    let code = '';
    try {
      assemble(withBands([{ id: 'a', kind: 'bulk', tier: 'flat', floors: 1, template: 'bulk-flat', inset: 9000 }] as BuildingDocument['bands']));
    } catch (error) {
      code = (error as BuildingError).code;
    }
    expect(code).toBe('E_DOC_INVALID');
  });
});
