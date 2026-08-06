import { describe, expect, it } from 'vitest';
import { BuildingError } from '#spec';
import { Surface, cap, capRing, cylinder, junction, ringAt, proudProblems, shellProblems, template, templates, triangleCount, walls, windingProblems, dress, type SectionShape } from '#kit';

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
    const parts = dress({ ...plain, floors: 2, height: 6.4 }, { wires: 'S' });
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

describe('fake parts', () => {
  const bulk: SectionShape = { ...plain, floors: 4, height: 12.8 };

  it('stands greebles off the faces as closed boxes, and repeats them for the same seed', () => {
    const once = dress(bulk, { greebles: 0.5, seed: 42 });
    const again = dress(bulk, { greebles: 0.5, seed: 42 });
    const other = dress(bulk, { greebles: 0.5, seed: 43 });

    expect(once[0]!.positions).toEqual(again[0]!.positions);
    expect(once[0]!.positions).not.toEqual(other[0]!.positions);
    expect(windingProblems(once[0]!)).toEqual([]);
    expect(shellProblems(once)).toEqual([]);
  });

  it('gives more parts at a higher density, and none at zero', () => {
    const light = dress(bulk, { greebles: 0.2, seed: 7 });
    const heavy = dress(bulk, { greebles: 0.9, seed: 7 });
    expect(dress(bulk, { greebles: 0 })).toEqual([]);
    expect(triangleCount(heavy[0]!)).toBeGreaterThan(triangleCount(light[0]!));
  });

  it('builds balconies with a rounded front, closed, one per floor', () => {
    const parts = dress(bulk, { balconies: 'S' });
    expect(windingProblems(parts[0]!)).toEqual([]);
    expect(shellProblems(parts)).toEqual([]);
    // A rounded front means more than the four sides of a box.
    expect(triangleCount(parts[0]!)).toBeGreaterThan(4 * 12);
  });

  it('stands columns at the corners, along the faces, or only in gaps', () => {
    for (const style of ['corners', 'ribs', 'partial'] as const) {
      const parts = dress(bulk, { columns: style, seed: 5 });
      expect(parts.length, style).toBe(1);
      expect(windingProblems(parts[0]!), style).toEqual([]);
      expect(shellProblems(parts), style).toEqual([]);
    }
  });
});

describe('the crown', () => {
  const deck: SectionShape = { ...plain, floors: 1, height: 3 };

  it('stands a mast, a tank, units and a railing on the deck, all closed', () => {
    const parts = dress(deck, { clutter: 0.7, seed: 11 });
    expect(parts).toHaveLength(1);
    expect(windingProblems(parts[0]!)).toEqual([]);
    expect(shellProblems(parts)).toEqual([]);
  });

  it('gives the same crown for the same seed and a different one otherwise', () => {
    expect(dress(deck, { clutter: 0.6, seed: 3 })[0]!.positions).toEqual(dress(deck, { clutter: 0.6, seed: 3 })[0]!.positions);
    expect(dress(deck, { clutter: 0.6, seed: 3 })[0]!.positions).not.toEqual(dress(deck, { clutter: 0.6, seed: 4 })[0]!.positions);
  });

  it('puts more on a busier deck, and nothing at zero', () => {
    expect(dress(deck, { clutter: 0 })).toEqual([]);
    expect(triangleCount(dress(deck, { clutter: 0.9, seed: 2 })[0]!)).toBeGreaterThan(
      triangleCount(dress(deck, { clutter: 0.3, seed: 2 })[0]!),
    );
  });
});

describe('chamfered sections', () => {
  const chamfered: SectionShape = { ...plain, floors: 3, height: 9.6, chamfer: 0.25 };

  it('closes a section that is bevelled top and bottom', () => {
    const parts = template('bulk-flat').build(chamfered);
    expect(windingProblems(parts[0]!)).toEqual([]);
    expect(shellProblems(parts)).toEqual([]);
  });

  it('pulls the caps in, so the bevel has something to sit on', () => {
    const plainCap = capRing({ ...chamfered, chamfer: 0 }, 1);
    const bevelled = capRing(chamfered, 1);
    expect(Math.abs(bevelled[0]![0])).toBeLessThan(Math.abs(plainCap[0]![0]));
  });

  it('costs two more rows than an unbevelled section, and nothing else', () => {
    const flat = triangleCount(template('bulk-flat').build({ ...chamfered, chamfer: 0 })[0]!);
    const bevel = triangleCount(template('bulk-flat').build(chamfered)[0]!);
    expect(bevel - flat).toBe(2 * 4 * 2);
  });
});

describe('the shell proof', () => {
  it('catches one solid that is inside out among many that are not', () => {
    const good = new Surface('facade').box([-4, 0, -4], [4, 6, 4]).data();
    const small = new Surface('facade').box([1, 6, 1], [2, 7, 2]).data();
    const inverted = { ...small, indices: [...small.indices].reverse() };

    expect(shellProblems([good, small])).toEqual([]);
    const problems = shellProblems([good, inverted]);
    expect(problems.some((problem) => problem.detail.includes('inside out'))).toBe(true);
  });

  it('reads a cylinder as a solid, and an upside down one as a fault', () => {
    const round = new Surface('roof');
    cylinder(round, [0, 0], 1.2, 0, 2.5, 10);
    const built = round.data();
    expect(windingProblems(built)).toEqual([]);
    expect(shellProblems([built])).toEqual([]);

    const flipped = { ...built, indices: [...built.indices].reverse() };
    expect(shellProblems([flipped]).some((problem) => problem.detail.includes('inside out'))).toBe(true);
  });
});

describe('parts stay on their section', () => {
  const footprint = { x0: -9, x1: 9, z0: -7, z1: 7 };

  it('anchors a corner column to the corner, mostly inside the section', () => {
    const parts = dress({ ...plain, floors: 3, height: 9.6 }, { columns: 'corners' });
    expect(proudProblems(parts, footprint)).toEqual([]);

    const xs = parts[0]!.positions.filter((_, i) => i % 3 === 0);
    // It reaches past the corner by a hand's width, not by half its own size.
    expect(Math.max(...xs) - footprint.x1).toBeLessThan(0.4);
    expect(Math.max(...xs)).toBeGreaterThan(footprint.x1);
  });

  it('catches a part that has drifted off the building', () => {
    const adrift = new Surface('facade').box([40, 0, 40], [41, 2, 41]).data();
    const problems = proudProblems([adrift], footprint);
    expect(problems).toHaveLength(1);
    expect(problems[0]!.detail).toContain('past the section');
  });
});

