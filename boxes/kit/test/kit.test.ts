import { describe, expect, it } from 'vitest';
import { BuildingError } from '#spec';
import { FACADE_STYLE } from '#materials';
import { Surface, WINDOW, cap, capRing, cylinder, ringAt, proudProblems, shellProblems, sunkProblems, template, templates, triangleCount, walls, windingProblems, dress, type SectionShape } from '#kit';

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

  it('catches a stored normal pointing away from its triangle', () => {
    const box = new Surface('facade').box([-1, 0, -1], [1, 2, 1]).data();
    const turned = { ...box, normals: box.normals.map((n) => -n) };
    expect(windingProblems(turned).some((p) => p.detail.includes('faces away'))).toBe(true);
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

  it('stands columns at the corners, along the faces, or only in gaps', () => {
    for (const style of ['corners', 'ribs', 'partial'] as const) {
      const parts = dress(bulk, { columns: style, seed: 5 });
      expect(parts.length, style).toBe(1);
      expect(windingProblems(parts[0]!), style).toEqual([]);
      expect(shellProblems(parts), style).toEqual([]);
    }
  });
});

describe('one window, drawn and built', () => {
  // Eight bays of three metres, so the wall shows exactly one tile across.
  const glazed: SectionShape = {
    bottom: [
      [-12, 12],
      [12, 12],
      [12, -12],
      [-12, -12],
    ],
    top: [
      [-12, 12],
      [12, 12],
      [12, -12],
      [-12, -12],
    ],
    height: 3.2,
    floors: 1,
    windows: WINDOW,
  };

  const built = () => {
    const skin = new Surface('facade');
    const pane = new Surface('glass');
    walls(skin, glazed, pane);
    return { skin: skin.data(), pane: pane.data() };
  };

  it('stands the pane on the window the texture draws, in the same place on the tile', () => {
    // The glass face is the first quad of the first pane: the first bay of the first floor.
    const front = built().pane.uvs.slice(0, 12);
    const us = front.filter((_, i) => i % 2 === 0);
    const vs = front.filter((_, i) => i % 2 === 1);
    const { across, down, pane: glass } = FACADE_STYLE;

    // The bottom floor sits in the bottom row of the tile, and the glass sits inside that row
    // exactly where the wall draws it: measured down from the row's own top.
    const rowTop = 1 - 1 / down;
    expect(Math.min(...us)).toBeCloseTo(glass.left / across, 5);
    expect(Math.max(...us)).toBeCloseTo(glass.right / across, 5);
    expect(Math.min(...vs)).toBeCloseTo(rowTop + glass.top / down, 5);
    expect(Math.max(...vs)).toBeCloseTo(rowTop + glass.bottom / down, 5);
  });

  it('cuts it at the height the texture draws it, so the two never disagree', () => {
    const { pane } = built();
    const ys = pane.positions.filter((_, i) => i % 3 === 1);
    expect(Math.min(...ys)).toBeCloseTo(glazed.height * (1 - FACADE_STYLE.pane.bottom), 5);
    expect(Math.max(...ys)).toBeCloseTo(glazed.height * (1 - FACADE_STYLE.pane.top), 5);
  });

  it('lays one row of the tile on each floor, and one bay on every three metres', () => {
    const skin = new Surface('facade');
    walls(skin, { ...glazed, floors: 6, height: 19.2, windows: undefined });
    const uvs = skin.data().uvs;
    const us = uvs.filter((_, i) => i % 2 === 0);
    const vs = uvs.filter((_, i) => i % 2 === 1);

    // A 24 m face is exactly one tile across, and the bays walk on round the ring, so four faces
    // span four tiles. The bottom floor lands on the bottom row of the tile and each floor above
    // walks up one row, so six floors cover one and a half tiles and the sampler repeats past
    // the top.
    expect(Math.max(...us)).toBeCloseTo(4, 5);
    expect(Math.max(...vs)).toBeCloseTo(1, 5);
    expect(Math.min(...vs)).toBeCloseTo(1 - 6 / FACADE_STYLE.down, 5);
    expect(new Set(vs.map((v) => Math.round(v * 1000))).size).toBe(7);
  });

  it('ends every face on a mullion, whatever width the face is', () => {
    // The bay is a target, not a rule: a face carries a whole number of them and they come out
    // however wide they need to be. Otherwise the bay at a corner is sliced through a window.
    for (const [width, bays] of [[24, 8], [28, 9], [17, 6], [7, 2]] as const) {
      // Square, so every face of it carries the same count and the reading is unambiguous.
      const half = width / 2;
      const ring: [number, number][] = [[-half, half], [half, half], [half, -half], [-half, -half]];
      const skin = new Surface('facade');
      walls(skin, { bottom: ring, top: ring, height: 3.2, floors: 1 });

      const us = skin.data().uvs.filter((_, i) => i % 2 === 0);
      // Four faces walked round: every u sits on a whole bay, and the walk ends on the ring total.
      expect(Math.max(...us) * FACADE_STYLE.across, `${width} m face`).toBeCloseTo(bays * 4, 5);
      for (const u of us) {
        const at = u * FACADE_STYLE.across;
        expect(Math.abs(at - Math.round(at)), `${width} m face lands mid-bay`).toBeLessThan(1e-5);
      }
    }
  });

  it('wears the whole picture round a round section instead of one bay per segment', () => {
    // Sixteen short edges, each one bay wide. Restarting the tile at every edge would show the
    // picture's first bay sixteen times and none of the rest, which on a facade whose lights sit
    // mid-picture is a tower with every window off.
    const ring: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      ring.push([Math.cos(angle) * 11, Math.sin(angle) * 11]);
    }
    const skin = new Surface('facade');
    walls(skin, { bottom: ring, top: ring, height: 3.2, floors: 1 });

    const us = skin.data().uvs.filter((_, i) => i % 2 === 0);
    expect(Math.max(...us) * FACADE_STYLE.across).toBeCloseTo(16, 5);
  });

  it('puts the cut pane on the window the wall draws, on a face that is not a whole tile', () => {
    // A 28 m face carries nine bays, so the tile is stretched a little and the pane has to be
    // stretched with it. Reading the same bay count in both places is what keeps them together.
    const half = 14;
    const ring: [number, number][] = [[-half, half], [half, half], [half, -half], [-half, -half]];
    const skin = new Surface('facade');
    const pane = new Surface('glass');
    walls(skin, { bottom: ring, top: ring, height: 3.2, floors: 1, windows: WINDOW }, pane);

    const wallU = Math.max(...skin.data().uvs.filter((_, i) => i % 2 === 0));
    const front = pane.data().uvs.slice(0, 12);
    const paneU = front.filter((_, i) => i % 2 === 0);
    const bays = wallU * FACADE_STYLE.across;

    // Nine bays a face, four faces walked round.
    expect(bays).toBeCloseTo(36, 5);
    // The first pane sits in the first bay of the tile, wherever the face ends.
    expect(Math.min(...paneU)).toBeCloseTo(FACADE_STYLE.pane.left / FACADE_STYLE.across, 5);
    expect(Math.max(...paneU)).toBeCloseTo(FACADE_STYLE.pane.right / FACADE_STYLE.across, 5);
    // And the last pane of the walk reads the bay its own wall lays there, not bay one again.
    const allPaneU = pane.data().uvs.filter((_, i) => i % 2 === 0);
    expect(Math.max(...allPaneU)).toBeCloseTo((27 + 8 + FACADE_STYLE.pane.right) / FACADE_STYLE.across, 5);
  });
});

describe('everything a section wears is on the outside of it', () => {
  const bulk: SectionShape = { ...plain, floors: 4, height: 12.8 };
  const worn = {
    'corner columns': { columns: 'corners' },
    ribs: { columns: 'ribs' },
    'columns in the gaps': { columns: 'partial', seed: 5 },
    greebles: { greebles: 0.6, seed: 3 },
    cables: { wires: 'E' },
    'a deck': { clutter: 0.8, seed: 9 },
  } as const;

  for (const [what, options] of Object.entries(worn)) {
    it(`stands ${what} where they can be seen`, () => {
      expect(sunkProblems(dress(bulk, options), bulk)).toEqual([]);
    });
  }

  it('catches a part built the wrong way round, buried in the wall', () => {
    const inside = new Surface('facade').box([-1, 1, -1], [1, 2, 1]).data();
    const problems = sunkProblems([inside], bulk);
    expect(problems).toHaveLength(1);
    expect(problems[0]!.detail).toContain('buried');
  });
});

describe('the crown', () => {
  const deck: SectionShape = { ...plain, floors: 1, height: 3 };

  const drawn = (parts: { positions: number[] }[]) => parts.flatMap((part) => part.positions);
  const cost = (parts: Parameters<typeof triangleCount>[0][]) => parts.reduce((sum, part) => sum + triangleCount(part), 0);

  it('stands a mast, a tank, units and a railing on the deck, all closed', () => {
    const parts = dress(deck, { clutter: 0.7, seed: 11 });
    // One mesh per material now: plate metal, pipe, galvanised steel, the lit tip.
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(windingProblems(part)).toEqual([]);
    expect(shellProblems(parts)).toEqual([]);
  });

  it('gives the same crown for the same seed and a different one otherwise', () => {
    expect(drawn(dress(deck, { clutter: 0.6, seed: 3 }))).toEqual(drawn(dress(deck, { clutter: 0.6, seed: 3 })));
    expect(drawn(dress(deck, { clutter: 0.6, seed: 3 }))).not.toEqual(drawn(dress(deck, { clutter: 0.6, seed: 4 })));
  });

  it('puts more on a busier deck, and nothing at zero', () => {
    expect(dress(deck, { clutter: 0 })).toEqual([]);
    expect(cost(dress(deck, { clutter: 0.9, seed: 2 }))).toBeGreaterThan(cost(dress(deck, { clutter: 0.3, seed: 2 })));
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

