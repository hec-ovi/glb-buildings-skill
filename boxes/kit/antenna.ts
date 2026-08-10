/**
 * What stands on a roof and talks: a lattice mast, a dish, a sector array, a cluster of whips.
 *
 * Every one is built from segments, so the legs, braces, guys and mounts are mitred solids
 * rather than boxes pushed through each other, and a mast leaning or a dish tilting is the same
 * call as one standing straight.
 */
import { type Vec } from './geometry.ts';
import { MAX_ABOVE } from './invariants.ts';
import { ANTENNA, BEACON } from './names.ts';
import { segment } from './segment.ts';
import type { Surfaces } from './surfaces.ts';
import type { Corner } from './plan.ts';

const point = (at: Corner, y: number, dx = 0, dz = 0): Vec => [at[0] + dx, y, at[1] + dz];

/** The lens on the tip of a mast: the one part of an antenna that is lit, and how far it rises. */
const TIP_LIGHT = `${BEACON}:red`;
const TIP_RISE = 0.22;

/** The three legs of a lattice mast, on a triangle of this reach about its middle. */
function triangle(at: Corner, reach: number, turn: number): Corner[] {
  return [0, 1, 2].map((i) => {
    const angle = turn + (i / 3) * Math.PI * 2;
    return [at[0] + Math.sin(angle) * reach, at[1] + Math.cos(angle) * reach] as Corner;
  });
}

/**
 * A lattice mast: three legs braced level by level, drawn in to a spire at the top, with guys
 * running down to the deck. This is the tall thing on a skyline, so it earns its triangles.
 */
export function mast(kit: Surfaces, at: Corner, y: number, random: () => number): void {
  const surface = kit.get(ANTENNA);
  const tip = 0.8 + random();
  // A mast may not out-reach the proof that keeps parts on the building. Drawing one taller than
  // that and letting the build refuse it puts a composer in front of a failure it cannot fix:
  // nothing it chose decides how tall a mast is.
  const height = Math.min(6 + random() * 5, MAX_ABOVE - tip - TIP_RISE - 0.2);
  const reach = 0.35 + random() * 0.2;
  const turn = random() * Math.PI;
  const legs = triangle(at, reach, turn);
  const levels = 3 + Math.round(random());
  const waist = height * 0.72;

  // Legs rise straight, then draw in to a point: a mast is a spire, not a box on end.
  for (const leg of legs) {
    segment(surface, [point(leg, y), point(leg, y + waist), point(at, y + height)], { profile: 'square', thickness: 0.09 });
  }

  // Bracing rings, each a closed triangle round the legs.
  for (let level = 1; level <= levels; level++) {
    const t = level / (levels + 1);
    const up = y + waist * t;
    for (let i = 0; i < legs.length; i++) {
      const a = legs[i]!;
      const b = legs[(i + 1) % legs.length]!;
      segment(surface, [point(a, up), point(b, up)], { profile: 'square', thickness: 0.05 });
      // And a diagonal to the next level, which is what makes a lattice read as a lattice.
      const next = y + (waist * (level + 1)) / (levels + 1);
      if (level < levels) segment(surface, [point(a, up), point(b, next)], { profile: 'square', thickness: 0.045 });
    }
  }

  // The tip, and guys down to the deck.
  segment(surface, [point(at, y + height), point(at, y + height + tip)], { profile: 'square', thickness: 0.05 });
  for (const leg of triangle(at, 1.6 + random() * 0.5, turn + 0.5)) {
    segment(surface, [point(at, y + waist), point(leg, y + 0.05)], { profile: 'square', thickness: 0.035 });
  }

  // And the beacon on top of it, which is the whole reason a mast is drawn at this height.
  segment(kit.get(TIP_LIGHT), [point(at, y + height + tip - 0.05), point(at, y + height + tip + TIP_RISE)], {
    profile: 'round',
    thickness: 0.2,
    sides: 8,
  });
}

/**
 * A dish on its mount: a short post, an arm out of it, and the drum of the dish itself tilted at
 * the sky. Drawn as a shallow round segment, which is what a dish is at this size.
 */
export function dish(kit: Surfaces, at: Corner, y: number, turn: number, random: () => number): void {
  const surface = kit.get(ANTENNA);
  const radius = 0.55 + random() * 0.35;
  const stand = 0.8 + random() * 0.7;
  const lean = 0.5 + random() * 0.35;
  const aim: Corner = [Math.sin(turn), Math.cos(turn)];

  const head = point(at, y + stand);
  segment(surface, [point(at, y), head], { profile: 'round', thickness: 0.16, sides: 8 });

  // The face of the dish, a shallow drum leaning back from the direction it points.
  const centre = point(at, y + stand + radius * 0.6, aim[0] * radius * 0.4, aim[1] * radius * 0.4);
  const back: Vec = [centre[0] - aim[0] * 0.12, centre[1] - lean * 0.12, centre[2] - aim[1] * 0.12];
  const front: Vec = [centre[0] + aim[0] * 0.1, centre[1] + lean * 0.1, centre[2] + aim[1] * 0.1];

  // The mount: the arm from the top of the post to the back of the dish. Without it the dish
  // hangs in front of its post with nothing holding it, which reads as floating.
  segment(surface, [head, back], { profile: 'square', thickness: 0.12 });
  segment(surface, [back, front], { profile: 'round', thickness: radius * 2, sides: 12 });

  // The feed on its arm, standing off the face.
  const feed: Vec = [centre[0] + aim[0] * radius * 0.9, centre[1] + lean * radius * 0.9, centre[2] + aim[1] * radius * 0.9];
  segment(surface, [front, feed], { profile: 'square', thickness: 0.07 });
}

/**
 * A sector array: the pole with three flat panels facing out at a third of a turn each, which is
 * what every cell site on every roof looks like.
 */
export function sector(kit: Surfaces, at: Corner, y: number, turn: number, random: () => number): void {
  const surface = kit.get(ANTENNA);
  const height = 2.6 + random() * 1.6;
  const reach = 0.42;
  const panel = 1.0 + random() * 0.5;

  segment(surface, [point(at, y), point(at, y + height)], { profile: 'round', thickness: 0.18, sides: 8 });

  for (let i = 0; i < 3; i++) {
    const angle = turn + (i / 3) * Math.PI * 2;
    const out: Corner = [Math.sin(angle), Math.cos(angle)];
    const hang: Corner = [at[0] + out[0] * reach, at[1] + out[1] * reach];
    const top = y + height - 0.3;

    // The arm holding it off the pole, then the panel itself as a flat upright slab.
    segment(surface, [point(at, top - panel / 2), point(hang, top - panel / 2)], { profile: 'square', thickness: 0.06 });
    segment(surface, [point(hang, top - panel), point(hang, top)], { profile: 'square', thickness: 0.26 });
  }
}

/** A cluster of whips of different heights, the cheap scatter that says somebody lives here. */
export function whips(kit: Surfaces, at: Corner, y: number, random: () => number): void {
  const surface = kit.get(ANTENNA);
  const count = 3 + Math.round(random() * 2);
  const base = 0.28;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + random();
    const foot: Corner = [at[0] + Math.sin(angle) * base, at[1] + Math.cos(angle) * base];
    const height = 1.2 + random() * 2;
    const lean = 0.12 + random() * 0.2;
    segment(
      surface,
      [point(foot, y), point(foot, y + height, Math.sin(angle) * lean, Math.cos(angle) * lean)],
      { profile: 'square', thickness: 0.05 },
    );
  }
}
