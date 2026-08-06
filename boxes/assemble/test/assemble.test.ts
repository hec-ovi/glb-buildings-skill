import { describe, expect, it } from 'vitest';
import { BuildingError, newDocument, parseDocument, type BuildingDocument } from '#spec';
import { assemble, findBay, floors, seamsMatch } from '#assemble';

const doc = newDocument('tower-a', { width: 18, depth: 14, floors: 14 });

function withBands(bands: BuildingDocument['bands']): BuildingDocument {
  return parseDocument({ ...doc, bands });
}

/** Square metres inside a footprint. */
function area(ring: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum) / 2e6;
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

  it('slices a round section, and keeps every slice convex', () => {
    const band = (over: Partial<BuildingDocument['bands'][number]>) =>
      assemble(withBands([{ id: 'a', kind: 'bulk', tier: 'flat', floors: 2, template: 'bulk-flat', shape: 'round', ...over }] as BuildingDocument['bands'])).bands[0]!;

    const full = area(band({}).bottom);
    // A quarter turn is a wedge with its point at the middle, so the middle is one of its corners.
    const quarter = band({ arc: 90 });
    expect(quarter.bottom).toContainEqual([0, 0]);
    expect(area(quarter.bottom) / full).toBeCloseTo(0.25, 1);

    // A half turn's middle sits on the chord, where a corner would be a fold rather than a corner.
    expect(band({ arc: 180 }).bottom).not.toContainEqual([0, 0]);
    expect(area(band({ arc: 180 }).bottom) / full).toBeCloseTo(0.5, 1);

    // Past a half turn the slice is the cylinder with a flat cut across it, so it keeps most of it.
    expect(area(band({ arc: 270 }).bottom) / full).toBeGreaterThan(0.75);
  });

  it('bows a face out into a round end, and two of them into a stadium', () => {
    const band = (bow: string) =>
      assemble(withBands([{ id: 'a', kind: 'bulk', tier: 'flat', floors: 2, template: 'bulk-flat', bow }] as BuildingDocument['bands'])).bands[0]!;

    const plain = area(band('').bottom);
    const one = area(band('S').bottom);
    const both = area(band('NS').bottom);
    expect(one).toBeGreaterThan(plain);
    expect(both - one).toBeCloseTo(one - plain, -5);
    // Four round ends on one plan would meet in a cusp, so they come out shallower instead.
    expect(area(band('NESW').bottom)).toBeGreaterThan(plain);
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
