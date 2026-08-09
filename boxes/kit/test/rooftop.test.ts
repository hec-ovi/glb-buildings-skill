import { describe, expect, it } from 'vitest';
import {
  Surface,
  dish,
  mast,
  rooftop,
  sector,
  shellProblems,
  solar,
  solids,
  tank,
  triangleCount,
  whips,
  windingProblems,
  type SectionShape,
} from '#kit';
import { DECK_PARTS } from '#spec';

/** A roof deck: one floor of a 16 by 12 m section, so the grid has room for a 2x2 part. */
const roof: SectionShape = {
  bottom: [
    [-8, 6],
    [8, 6],
    [8, -6],
    [-8, -6],
  ],
  top: [
    [-8, 6],
    [8, 6],
    [8, -6],
    [-8, -6],
  ],
  floors: 1,
  height: 1.2,
};

function onDeck(part: string, turn = 0) {
  const surface = new Surface('roof');
  rooftop(surface, roof, { placements: [{ cell: 'C2', part: part as never, turn }], seed: 7 });
  return surface.data();
}

/** One part on its own, away from the deck's railing, so its own cost is what is measured. */
function alone(draw: (surface: Surface, random: () => number) => void) {
  const surface = new Surface('roof');
  let n = 0;
  draw(surface, () => ((n = (n * 9301 + 49297) % 233280), n / 233280));
  return surface.data();
}

describe('what stands on a roof', () => {
  it('closes every part into solids, whatever it is', () => {
    for (const part of DECK_PARTS) {
      const mesh = onDeck(part);
      expect(triangleCount(mesh), part).toBeGreaterThan(0);
      expect(windingProblems(mesh), part).toEqual([]);
      expect(shellProblems([mesh]), part).toEqual([]);
    }
  });

  it('keeps the new parts affordable, so a roof can carry several of them', () => {
    // A roof may spend 4500 triangles on everything, and the mast is the extravagant one.
    const costs: [string, number][] = [
      ['whip', triangleCount(alone((s, r) => whips(s, [0, 0], 0, r)))],
      ['dish', triangleCount(alone((s, r) => dish(s, [0, 0], 0, 0, r)))],
      ['array', triangleCount(alone((s, r) => sector(s, [0, 0], 0, 0, r)))],
      ['solar', triangleCount(alone((s, r) => solar(s, [0, 0], 0, 0, r)))],
      ['tank', triangleCount(alone((s, r) => tank(s, [0, 0], 0, r)))],
      ['mast', triangleCount(alone((s, r) => mast(s, [0, 0], 0, r)))],
    ];
    for (const [name, cost] of costs) {
      expect(cost, name).toBeGreaterThan(0);
      expect(cost, name).toBeLessThan(name === 'mast' ? 900 : 450);
    }
  });

  it('gives the same part the same shape for the same seed, and a different one for another', () => {
    const drawn = (seed: number) => {
      const face = new Surface('roof');
      rooftop(face, roof, { placements: [{ cell: 'C2', part: 'mast' }], seed });
      return face.data().positions;
    };
    expect(drawn(7)).toEqual(drawn(7));
    expect(drawn(7)).not.toEqual(drawn(8));
  });

  it('stands a mast well clear of the deck and brings its guys back down to it', () => {
    const mesh = alone((s, r) => mast(s, [0, 0], 0, r));
    const ys = mesh.positions.filter((_, i) => i % 3 === 1);
    // Tall enough to read on a skyline, and something of it still touches the roof.
    expect(Math.max(...ys)).toBeGreaterThan(6);
    expect(Math.min(...ys)).toBeLessThan(0.1);
  });

  it('aims a dish and a solar array with the turn it was given', () => {
    for (const part of ['dish', 'solar']) {
      expect(onDeck(part, 0).positions, part).not.toEqual(onDeck(part, 90).positions);
    }
  });
});

/**
 * Every piece of a part has to touch another one. Solids that merely cross do not share edges,
 * so this groups them by whether their boxes meet, which is what "not floating" actually means.
 */
function loosePieces(mesh: Parameters<typeof triangleCount>[0]): number {
  const boxes = solids([mesh]).map((group) => {
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (const points of group) {
      for (const point of points) {
        for (let a = 0; a < 3; a++) {
          lo[a] = Math.min(lo[a]!, point[a]!);
          hi[a] = Math.max(hi[a]!, point[a]!);
        }
      }
    }
    return { lo, hi };
  });

  const meets = (a: number, b: number) =>
    [0, 1, 2].every((axis) => boxes[a]!.lo[axis]! <= boxes[b]!.hi[axis]! + 1e-6 && boxes[b]!.lo[axis]! <= boxes[a]!.hi[axis]! + 1e-6);

  // Walk from the first piece to everything it can reach through pieces that meet.
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length > 0) {
    const at = queue.pop()!;
    for (let other = 0; other < boxes.length; other++) {
      if (!seen.has(other) && meets(at, other)) {
        seen.add(other);
        queue.push(other);
      }
    }
  }
  return boxes.length - seen.size;
}

describe('nothing on a roof floats', () => {
  it('joins a dish to the post that holds it', () => {
    // A dish hangs in front of its post, so without the mount arm it floats clear of it.
    for (const turn of [0, 1.2, 2.6, 4.1]) {
      const mesh = alone((s, r) => dish(s, [0, 0], 0, turn, r));
      expect(loosePieces(mesh), `turn ${turn}`).toBe(0);
      // And something of it still reaches the deck it stands on.
      const ys = mesh.positions.filter((_, i) => i % 3 === 1);
      expect(Math.min(...ys), `turn ${turn}`).toBeLessThan(0.01);
    }
  });

  it('leaves no piece of any part loose from the rest of it', () => {
    for (const [name, draw] of [
      ['mast', (s: Surface, r: () => number) => mast(s, [0, 0], 0, r)],
      ['array', (s: Surface, r: () => number) => sector(s, [0, 0], 0, 0, r)],
      ['tank', (s: Surface, r: () => number) => tank(s, [0, 0], 0, r)],
    ] as const) {
      expect(loosePieces(alone(draw)), name).toBe(0);
    }
  });

  it('stands every other part on the deck it is placed on', () => {
    for (const [name, draw] of [
      ['array', (s: Surface, r: () => number) => sector(s, [0, 0], 0, 0, r)],
      ['whip', (s: Surface, r: () => number) => whips(s, [0, 0], 0, r)],
      ['solar', (s: Surface, r: () => number) => solar(s, [0, 0], 0, 0, r)],
      ['tank', (s: Surface, r: () => number) => tank(s, [0, 0], 0, r)],
    ] as const) {
      const ys = alone(draw).positions.filter((_, i) => i % 3 === 1);
      expect(Math.min(...ys), name).toBeLessThan(0.06);
    }
  });
});
