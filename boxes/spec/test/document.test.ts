import { describe, expect, it } from 'vitest';
import { BuildingError, describeBuilding, newDocument, parseDocument, partition, bayCount } from '#spec';

const valid = {
  version: 1,
  name: 'tower-a',
  footprint: { kind: 'rect', width: 18000, depth: 14000 },
  bands: [{ id: 'body', kind: 'bulk', tier: 'flat', floors: 12, template: 'bulk-flat' }],
};

describe('parseDocument', () => {
  it('fills the grid defaults and keeps every length a whole millimetre', () => {
    const doc = parseDocument(valid);
    expect(doc.grid).toEqual({ bay: 3000, floorHeight: 3200 });
    expect(Number.isSafeInteger(doc.footprint.width)).toBe(true);
  });

  it('refuses a length that is not a whole millimetre, and says where', () => {
    const error = catchError(() => parseDocument({ ...valid, footprint: { kind: 'rect', width: 18000.5, depth: 14000 } }));
    expect(error.code).toBe('E_DOC_INVALID');
    expect(error.at).toEqual(['footprint', 'width']);
  });

  it('refuses two bands with the same id', () => {
    const bands = [valid.bands[0], { ...valid.bands[0] }];
    expect(catchError(() => parseDocument({ ...valid, bands })).code).toBe('E_BAND_ID_DUPLICATE');
  });

  it('refuses a document written by another schema version', () => {
    expect(catchError(() => parseDocument({ ...valid, version: 2 })).code).toBe('E_DOC_VERSION');
  });

  it('refuses a document with no bands', () => {
    expect(catchError(() => parseDocument({ ...valid, bands: [] })).code).toBe('E_DOC_INVALID');
  });

  it('refuses two ways of rounding one plan, and settings the shape cannot use', () => {
    const band = (over: Record<string, unknown>) => ({ ...valid, bands: [{ ...valid.bands[0], ...over }] });

    expect(catchError(() => parseDocument(band({ bow: 'S', corner: 600 }))).message).toContain('Pick one');
    expect(catchError(() => parseDocument(band({ arc: 90 }))).message).toContain('--shape round');
    expect(catchError(() => parseDocument(band({ shape: 'round', bow: 'S' }))).message).toContain('--arc');
    expect(catchError(() => parseDocument(band({ shape: 'round', corner: 600 }))).message).toContain('round section does not have');
    expect(catchError(() => parseDocument(band({ bow: 'SS' }))).message).toContain('twice');
    expect(catchError(() => parseDocument(band({ bow: 'up' }))).code).toBe('E_DOC_INVALID');

    expect(() => parseDocument(band({ shape: 'round', arc: 120 }))).not.toThrow();
    expect(() => parseDocument(band({ bow: 'NS' }))).not.toThrow();
  });
});

describe('newDocument', () => {
  it('gives a document that parses, with a main floor, a body and a roof', () => {
    const doc = newDocument('tower-a', { width: 18, depth: 14, floors: 14 });
    expect(doc.bands.map((b) => b.kind)).toEqual(['main', 'bulk', 'roof']);
    expect(doc.footprint).toEqual({ kind: 'rect', width: 18000, depth: 14000 });
    expect(() => parseDocument(doc)).not.toThrow();
  });
});

describe('partition', () => {
  it('splits a length into whole millimetres that sum back exactly', () => {
    for (const total of [18000, 14001, 7, 1_000_003]) {
      for (const count of [1, 3, 5, 7]) {
        const parts = partition(total, count);
        expect(parts).toHaveLength(count);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
        expect(parts.every(Number.isSafeInteger)).toBe(true);
      }
    }
  });

  it('fits at least one bay per side', () => {
    expect(bayCount(1200, 3000)).toBe(1);
    expect(bayCount(18000, 3000)).toBe(6);
  });
});

describe('describeBuilding', () => {
  const plain = newDocument('tower-a', { width: 18, depth: 14, floors: 24 });

  it('sizes a plain building and says it carries nothing', () => {
    const line = describeBuilding(plain);
    expect(line).toContain('24 floors in three sections');
    expect(line).toContain('18 x 14 m');
    expect(line).toContain('Plain masses');
  });

  it('names the move and what it wears, once each however many sections carry it', () => {
    const balcony = { kind: 'balcony', col: 10, row: 2, cols: 20, rows: 12, material: 'concrete' };
    const worn = parseDocument({
      ...plain,
      bands: plain.bands.map((band) =>
        band.kind === 'bulk'
          ? { ...band, twist: 20, windows: true, faces: [{ side: 'S', elements: [balcony] }] }
          : { ...band, windows: true, faces: [{ side: 'S', elements: [balcony] }] },
      ),
    });
    const line = describeBuilding(worn);
    expect(line).toContain('A twisted run');
    // Two sections carry each of them, and the line says each once.
    expect(line.match(/cut windows/g)).toHaveLength(1);
    expect(line.match(/balconies/g)).toHaveLength(1);
  });

  it('gives the same document the same line, so a rebuild never rewrites the list', () => {
    expect(describeBuilding(plain)).toBe(describeBuilding(parseDocument(plain)));
  });
});

function catchError(run: () => unknown): BuildingError {
  try {
    run();
  } catch (error) {
    if (error instanceof BuildingError) return error;
    throw error;
  }
  throw new Error('expected a BuildingError');
}
