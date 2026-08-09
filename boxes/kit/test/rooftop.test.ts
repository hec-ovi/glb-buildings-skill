import { describe, expect, it } from 'vitest';
import {
  Surface,
  dish,
  mast,
  rooftop,
  sector,
  shellProblems,
  solar,
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
