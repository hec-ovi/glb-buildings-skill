/**
 * The top of the building. Where a bulk section is repetitive on purpose, the crown is where
 * the silhouette is made: a mast with harness rings around it, air conditioning units on the
 * deck, and a small tower standing off to one side.
 *
 * Seeded, like the greebles, so a crown keeps its arrangement between builds.
 */
import { Surface, type Vec } from './geometry.ts';
import { ringAt, type Corner, type SectionShape } from './section.ts';

export type RooftopOptions = {
  /** 0 to 1: how much stands on the deck. */
  density: number;
  seed: number;
};

function rng(seed: number): () => number {
  let state = (seed | 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const point = (corner: Corner, y: number): Vec => [corner[0], y, corner[1]];

/** An upright box on the deck, from `y0` up by `height`, `width` by `depth` in plan. */
function block(surface: Surface, centre: Corner, width: number, depth: number, y0: number, height: number, turn = 0): void {
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const at = (dx: number, dz: number): Corner => [centre[0] + dx * cos + dz * sin, centre[1] - dx * sin + dz * cos];
  const plan = [at(-width / 2, depth / 2), at(width / 2, depth / 2), at(width / 2, -depth / 2), at(-width / 2, -depth / 2)];
  const y1 = y0 + height;

  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    surface.quad(point(plan[i]!, y0), point(plan[j]!, y0), point(plan[j]!, y1), point(plan[i]!, y1));
  }
  surface.quad(point(plan[0]!, y1), point(plan[1]!, y1), point(plan[2]!, y1), point(plan[3]!, y1));
  surface.quad(point(plan[3]!, y0), point(plan[2]!, y0), point(plan[1]!, y0), point(plan[0]!, y0));
}

/** Is this point inside the deck? The footprint is convex, so one sign test per edge. */
function onDeck(ring: Corner[], p: Corner): boolean {
  let positive = 0;
  let negative = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const side = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (side > 0) positive += 1;
    if (side < 0) negative += 1;
  }
  return positive === 0 || negative === 0;
}

/** A spot on the deck, pulled in from the edge so nothing hangs over it. */
function spot(ring: Corner[], random: () => number, margin: number): Corner | undefined {
  const xs = ring.map((c) => c[0]);
  const zs = ring.map((c) => c[1]);
  const x0 = Math.min(...xs) + margin;
  const x1 = Math.max(...xs) - margin;
  const z0 = Math.min(...zs) + margin;
  const z1 = Math.max(...zs) - margin;

  for (let tries = 0; tries < 12; tries++) {
    const p: Corner = [x0 + random() * (x1 - x0), z0 + random() * (z1 - z0)];
    if (onDeck(ring, p)) return p;
  }
  return undefined;
}

export function rooftop(surface: Surface, shape: SectionShape, options: RooftopOptions): void {
  const density = Math.max(0, Math.min(1, options.density));
  if (density === 0) return;

  const random = rng(options.seed);
  const deck = ringAt(shape, 1);
  const y = shape.height;

  // A mast, with harness rings around it.
  const mastAt = spot(deck, random, 1.2);
  if (mastAt) {
    const mast = 8 + random() * 14 * density;
    block(surface, mastAt, 0.5, 0.5, y, mast);
    const rings = 2 + Math.round(random() * 2);
    for (let i = 1; i <= rings; i++) {
      const at = y + (mast * i) / (rings + 1);
      block(surface, mastAt, 1.5, 0.28, at, 0.22);
      block(surface, mastAt, 0.28, 1.5, at, 0.22);
    }
  }

  // A small tower off to one side: the skyscraper on the skyscraper.
  if (density > 0.45) {
    const towerAt = spot(deck, random, 2);
    if (towerAt) block(surface, towerAt, 2.4 + random() * 1.6, 2.4 + random() * 1.6, y, 4 + random() * 9, random() * Math.PI);
  }

  // Air conditioning units and vents, low and boxy.
  const units = Math.round(2 + density * 8);
  for (let i = 0; i < units; i++) {
    const at = spot(deck, random, 1);
    if (!at) continue;
    block(surface, at, 1.2 + random() * 1.1, 0.8 + random() * 0.9, y, 0.6 + random() * 0.7, random() * Math.PI);
  }
}
