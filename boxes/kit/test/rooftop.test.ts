import { describe, expect, it } from 'vitest';
import {
  Surfaces,
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
  MAX_ABOVE,
  windingProblems,
  type MeshData,
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

const triangles = (meshes: MeshData[]) => meshes.reduce((sum, mesh) => sum + triangleCount(mesh), 0);
const heights = (meshes: MeshData[]) => meshes.flatMap((mesh) => mesh.positions.filter((_, i) => i % 3 === 1));

function onDeck(part: string, turn = 0): MeshData[] {
  const kit = new Surfaces();
  rooftop(kit, roof, { placements: [{ cell: 'C2', part: part as never, turn }], seed: 7 });
  return kit.data();
}

/** One part on its own, away from the deck's railing, so its own cost is what is measured. */
function alone(draw: (kit: Surfaces, random: () => number) => void): MeshData[] {
  const kit = new Surfaces();
  let n = 0;
  draw(kit, () => ((n = (n * 9301 + 49297) % 233280), n / 233280));
  return kit.data();
}

describe('what stands on a roof', () => {
  it('closes every part into solids, whatever it is', () => {
    for (const part of DECK_PARTS) {
      const meshes = onDeck(part);
      expect(triangles(meshes), part).toBeGreaterThan(0);
      for (const mesh of meshes) expect(windingProblems(mesh), part).toEqual([]);
      expect(shellProblems(meshes), part).toEqual([]);
    }
  });

  it('draws every part in what it is actually made of', () => {
    const materials = (part: string) => onDeck(part).map((mesh) => mesh.material);
    // Plant is plate metal, aerials are galvanised steel, and a mast carries a lit tip.
    expect(materials('unit')).toContain('metal');
    expect(materials('pipe')).toContain('pipe');
    expect(materials('dish')).toContain('antenna');
    expect(materials('mast')).toContain('antenna');
    expect(materials('mast')).toContain('beacon:red');
  });

  it('keeps the new parts affordable, so a roof can carry several of them', () => {
    // A roof may spend 4500 triangles on everything, and the mast is the extravagant one.
    const costs: [string, number][] = [
      ['whip', triangles(alone((k, r) => whips(k, [0, 0], 0, r)))],
      ['dish', triangles(alone((k, r) => dish(k, [0, 0], 0, 0, r)))],
      ['array', triangles(alone((k, r) => sector(k, [0, 0], 0, 0, r)))],
      ['solar', triangles(alone((k, r) => solar(k, [0, 0], 0, 0, r)))],
      ['tank', triangles(alone((k, r) => tank(k, [0, 0], 0, r)))],
      ['mast', triangles(alone((k, r) => mast(k, [0, 0], 0, r)))],
    ];
    for (const [name, cost] of costs) {
      expect(cost, name).toBeGreaterThan(0);
      expect(cost, name).toBeLessThan(name === 'mast' ? 900 : 450);
    }
  });

  it('gives the same part the same shape for the same seed, and a different one for another', () => {
    const drawn = (seed: number) => {
      const kit = new Surfaces();
      rooftop(kit, roof, { placements: [{ cell: 'C2', part: 'mast' }], seed });
      return kit.data().flatMap((mesh) => mesh.positions);
    };
    expect(drawn(7)).toEqual(drawn(7));
    expect(drawn(7)).not.toEqual(drawn(8));
  });

  it('never draws a part taller than the proof that keeps parts on the building', () => {
    // A mast whose height is picked at random must still fit under MAX_ABOVE, or a legal
    // placement fails the build over something the composer never chose.
    for (let seed = 1; seed <= 40; seed++) {
      let n = seed;
      const meshes = alone((k) => mast(k, [0, 0], 0, () => ((n = (n * 9301 + 49297) % 233280), n / 233280)));
      expect(Math.max(...heights(meshes)), `seed ${seed}`).toBeLessThan(MAX_ABOVE);
    }
  });

  it('stands a mast well clear of the deck and brings its guys back down to it', () => {
    const ys = heights(alone((k, r) => mast(k, [0, 0], 0, r)));
    // Tall enough to read on a skyline, and something of it still touches the roof.
    expect(Math.max(...ys)).toBeGreaterThan(6);
    expect(Math.min(...ys)).toBeLessThan(0.1);
  });

  it('aims a dish and a solar array with the turn it was given', () => {
    for (const part of ['dish', 'solar']) {
      const at = (turn: number) => onDeck(part, turn).flatMap((mesh) => mesh.positions);
      expect(at(0), part).not.toEqual(at(90));
    }
  });
});

/**
 * Every piece of a part has to touch another one. Solids that merely cross do not share edges,
 * so this groups them by whether their boxes meet, which is what "not floating" actually means.
 */
function loosePieces(meshes: MeshData[]): number {
  const boxes = solids(meshes).map((group) => {
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
      const meshes = alone((k, r) => dish(k, [0, 0], 0, turn, r));
      expect(loosePieces(meshes), `turn ${turn}`).toBe(0);
      // And something of it still reaches the deck it stands on.
      expect(Math.min(...heights(meshes)), `turn ${turn}`).toBeLessThan(0.01);
    }
  });

  it('leaves no piece of any part loose from the rest of it', () => {
    for (const [name, draw] of [
      ['mast', (k: Surfaces, r: () => number) => mast(k, [0, 0], 0, r)],
      ['array', (k: Surfaces, r: () => number) => sector(k, [0, 0], 0, 0, r)],
      ['tank', (k: Surfaces, r: () => number) => tank(k, [0, 0], 0, r)],
    ] as const) {
      expect(loosePieces(alone(draw)), name).toBe(0);
    }
  });

  it('stands every other part on the deck it is placed on', () => {
    for (const [name, draw] of [
      ['array', (k: Surfaces, r: () => number) => sector(k, [0, 0], 0, 0, r)],
      ['whip', (k: Surfaces, r: () => number) => whips(k, [0, 0], 0, r)],
      ['solar', (k: Surfaces, r: () => number) => solar(k, [0, 0], 0, 0, r)],
      ['tank', (k: Surfaces, r: () => number) => tank(k, [0, 0], 0, r)],
    ] as const) {
      expect(Math.min(...heights(alone(draw))), name).toBeLessThan(0.06);
    }
  });
});
