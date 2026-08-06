import { describe, expect, it } from 'vitest';
import { BuildingError } from '#spec';
import { Surface, cap, junction, ringAt, shellProblems, template, templates, triangleCount, walls, windingProblems, wireRun, type SectionShape } from '#kit';

const plain: SectionShape = {
  bottom: [
    [-9, 7],
    [9, 7],
    [9, -7],
    [-9, -7],
  ],
  top: [
    [-9, 7],
    [9, 7],
    [9, -7],
    [-9, -7],
  ],
  height: 3.2,
  floors: 1,
};

const twisted: SectionShape = {
  ...plain,
  top: [
    [-6, 5],
    [7, 6],
    [6, -5],
    [-7, -6],
  ],
  floors: 3,
  height: 9.6,
};

function closed(shape: SectionShape) {
  const skin = new Surface('facade');
  walls(skin, shape);
  cap(skin, ringAt(shape, 0), 0, false);
  cap(skin, ringAt(shape, 1), shape.height, true);
  return [skin.data()];
}

describe('geometry', () => {
  it('builds a box that is closed, outward facing and positive in volume', () => {
    const box = new Surface('facade').box([-1, 0, -1], [1, 2, 1]).data();
    expect(triangleCount(box)).toBe(12);
    expect(windingProblems(box)).toEqual([]);
    expect(shellProblems([box])).toEqual([]);
  });

  it('catches a shell turned inside out', () => {
    const box = new Surface('facade').box([-1, 0, -1], [1, 2, 1]).data();
    const flipped = { ...box, indices: box.indices.slice().reverse() };
    expect(shellProblems([flipped]).some((p) => p.detail.includes('inside out'))).toBe(true);
  });
});

describe('sections', () => {
  it('closes a plain section, and a twisted tapered one too', () => {
    expect(shellProblems(closed(plain))).toEqual([]);
    expect(shellProblems(closed(twisted))).toEqual([]);
  });

  it('keeps every wall facing outward through a twist', () => {
    for (const part of closed(twisted)) expect(windingProblems(part)).toEqual([]);
  });

  it('cuts the walls into one row per floor, so a texture tiles per floor', () => {
    const skin = new Surface('facade');
    walls(skin, { ...plain, floors: 5, height: 16 });
    expect(triangleCount(skin.data())).toBe(5 * 4 * 2);
  });

  it('lofts the junction between two sections and closes it', () => {
    const lower = plain.top;
    const upper: [number, number][] = [
      [-5, 4],
      [5, 4],
      [5, -4],
      [-5, -4],
    ];
    const collar = junction('facade', lower, upper).data();
    expect(windingProblems(collar)).toEqual([]);
    expect(triangleCount(collar)).toBe(8);
  });

  it('runs cables up one face as closed boxes', () => {
    const parts = wireRun({ ...plain, floors: 2, height: 6.4 }, 'S');
    expect(parts).toHaveLength(1);
    for (const part of parts) expect(windingProblems(part)).toEqual([]);
    expect(shellProblems(parts)).toEqual([]);
  });
});

describe('templates', () => {
  it('gives every template correct winding and normals', () => {
    for (const t of templates()) {
      for (const part of t.build(plain)) {
        expect(windingProblems(part), `${t.id}/${part.material}`).toEqual([]);
      }
    }
  });

  it('closes every section it builds, so a stack of them is a stack of solids', () => {
    for (const t of templates()) {
      expect(shellProblems(t.build(twisted)), t.id).toEqual([]);
    }
  });

  it('keeps a plain one floor section at twelve triangles: four walls and two caps', () => {
    const parts = template('bulk-flat').build(plain);
    expect(parts.reduce((n, p) => n + triangleCount(p), 0)).toBe(12);
  });

  it('refuses a template the kit does not have', () => {
    expect(() => template('nope')).toThrow(BuildingError);
    try {
      template('nope');
    } catch (error) {
      expect((error as BuildingError).code).toBe('E_UNKNOWN_TEMPLATE');
    }
  });
});
