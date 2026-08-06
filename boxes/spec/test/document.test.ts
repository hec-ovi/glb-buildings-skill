import { describe, expect, it } from 'vitest';
import { BuildingError, newDocument, parseDocument, partition, bayCount } from '#spec';

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

function catchError(run: () => unknown): BuildingError {
  try {
    run();
  } catch (error) {
    if (error instanceof BuildingError) return error;
    throw error;
  }
  throw new Error('expected a BuildingError');
}
