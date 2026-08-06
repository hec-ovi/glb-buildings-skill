import { describe, expect, it } from 'vitest';
import { BuildingError } from '#spec';
import { Surface, shellProblems, template, templates, triangleCount, windingProblems } from '#kit';

const shape = { x0: -9, x1: 9, z0: -7, z1: 7, height: 3.2 };

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

describe('templates', () => {
  it('gives every template correct winding and normals', () => {
    for (const t of templates()) {
      for (const part of t.build(shape)) {
        expect(windingProblems(part), `${t.id}/${part.material}`).toEqual([]);
      }
    }
  });

  it('keeps a fake floor under 100 triangles', () => {
    const parts = template('bulk-flat').build(shape);
    expect(parts.reduce((n, p) => n + triangleCount(p), 0)).toBeLessThan(100);
  });

  it('closes a building when the main floor, the bulk and the roof are stacked', () => {
    const ground = template('main-plain').build({ ...shape, height: 4.5 });
    const body = template('bulk-flat')
      .build(shape)
      .map((part) => lift(part, 4.5));
    const crown = template('roof-parapet')
      .build({ ...shape, height: 0.9 })
      .map((part) => lift(part, 7.7));
    expect(shellProblems([...ground, ...body, ...crown])).toEqual([]);
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

function lift(part: { positions: number[] }, y: number) {
  const positions = part.positions.slice();
  for (let i = 1; i < positions.length; i += 3) positions[i] = positions[i]! + y;
  return { ...part, positions } as never;
}
