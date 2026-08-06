/**
 * The top of the building. Where a bulk section is repetitive on purpose, the crown is where
 * the silhouette is made: a mast with harness rings around it, air conditioning units on the
 * deck, and a small tower standing off to one side.
 *
 * Seeded, like the greebles, so a crown keeps its arrangement between builds.
 */
import { Surface, type Vec } from './geometry.ts';
import { ringAt, type Corner, type SectionShape } from './section.ts';
import { prism } from './balcony.ts';

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

/** A round tank: a many sided prism, so it reads as a cylinder without costing much. */
function tank(surface: Surface, centre: Corner, radius: number, y0: number, height: number): void {
  const sides = 10;
  const plan: Corner[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    plan.push([centre[0] + radius * Math.sin(angle), centre[1] + radius * Math.cos(angle)]);
  }
  prism(surface, plan.reverse(), y0, y0 + height);
}

/** A water tank standing on four legs, the way every rooftop carries one. */
function waterTower(surface: Surface, centre: Corner, random: () => number, y: number): void {
  const legs = 3.5 + random() * 3;
  const radius = 1.1 + random() * 0.5;
  const spread = radius * 0.75;

  for (const [dx, dz] of [
    [-spread, -spread],
    [spread, -spread],
    [spread, spread],
    [-spread, spread],
  ] as const) {
    block(surface, [centre[0] + dx, centre[1] + dz], 0.22, 0.22, y, legs);
  }
  tank(surface, centre, radius, y + legs, 1.8 + random() * 1.2);
  block(surface, centre, 0.3, 0.3, y + legs + 3.2, 0.9);
}

/** A flat panel on short legs, tilted by standing one edge higher than the other. */
function solarPanel(surface: Surface, centre: Corner, random: () => number, y: number): void {
  const width = 1.6 + random() * 1.4;
  const depth = 1 + random() * 0.6;
  block(surface, centre, 0.12, 0.12, y, 0.5);
  block(surface, [centre[0] + width / 3, centre[1]], 0.12, 0.12, y, 0.9);
  block(surface, centre, width, depth, y + 0.75, 0.1, random() * Math.PI);
}

/** A run of thin bars around the deck edge, with a rail across the top. */
function railing(surface: Surface, ring: Corner[], y: number, height: number): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const posts = Math.max(2, Math.round(run / 1.2));

    // Stops one short: the next edge starts where this one ends, and two boxes in the same
    // place would double every edge between them.
    for (let post = 0; post < posts; post++) {
      const t = post / posts;
      block(surface, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], 0.08, 0.08, y, height);
    }
    // The rail itself: one long thin box lying along the edge.
    const mid: Corner = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const turn = Math.atan2(b[1] - a[1], b[0] - a[0]);
    block(surface, mid, run, 0.06, y + height - 0.1, 0.08, -turn);
  }
}

/** One cable, sagging between two points, as a chain of thin boxes. */
function cable(surface: Surface, from: [Corner, number], to: [Corner, number], sag: number, random: () => number): void {
  const steps = 5;
  let previous = from;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const at: Corner = [from[0][0] + (to[0][0] - from[0][0]) * t, from[0][1] + (to[0][1] - from[0][1]) * t];
    const straight = from[1] + (to[1] - from[1]) * t;
    const height = straight - Math.sin(Math.PI * t) * sag;
    const mid: Corner = [(previous[0][0] + at[0]) / 2, (previous[0][1] + at[1]) / 2];
    const span = Math.hypot(at[0] - previous[0][0], at[1] - previous[0][1], height - previous[1]);
    const turn = Math.atan2(at[1] - previous[0][1], at[0] - previous[0][0]);
    block(surface, mid, span, 0.06 + random() * 0.04, Math.min(previous[1], height), Math.abs(height - previous[1]) + 0.06, -turn);
    previous = [at, height];
  }
}

/** A utility pole with crossarms, and a harness of cables drooping off it. */
function pole(surface: Surface, at: Corner, deck: Corner[], y: number, random: () => number): void {
  const height = 9 + random() * 5;
  block(surface, at, 0.55, 0.55, y, height);

  for (const level of [0.72, 0.86]) {
    const arm = y + height * level;
    block(surface, at, 4.2, 0.22, arm, 0.22);
    block(surface, at, 0.22, 3.2, arm, 0.22);

    const cables = 4 + Math.round(random() * 4);
    for (let i = 0; i < cables; i++) {
      const from: Corner = [at[0] + (random() - 0.5) * 4, at[1] + (random() - 0.5) * 3];
      const landing = deck[Math.floor(random() * deck.length)]!;
      const to: Corner = [landing[0] * 0.6 + at[0] * 0.4, landing[1] * 0.6 + at[1] * 0.4];
      cable(surface, [from, arm], [to, y + 0.4 + random() * 2], 1 + random() * 2.5, random);
    }
  }
}

export function rooftop(surface: Surface, shape: SectionShape, options: RooftopOptions): void {
  const density = Math.max(0, Math.min(1, options.density));
  if (density === 0) return;

  const random = rng(options.seed);
  const deck = ringAt(shape, 1);
  const y = shape.height;

  // A mast, with harness rings around it and spikes off the top.
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
    for (const dx of [-0.35, 0.35]) {
      block(surface, [mastAt[0] + dx, mastAt[1]], 0.1, 0.1, y + mast, 2 + random() * 3);
    }
  }

  // A water tank on legs: the thing every rooftop in a city carries.
  const tankAt = spot(deck, random, 2.5);
  if (tankAt && density > 0.25) waterTower(surface, tankAt, random, y);

  // Solar panels, flat and tilted, in a loose row.
  if (density > 0.5) {
    const panels = Math.round(density * 5);
    for (let i = 0; i < panels; i++) {
      const at = spot(deck, random, 1.5);
      if (at) solarPanel(surface, at, random, y);
    }
  }

  // A small tower off to one side: the skyscraper on the skyscraper.
  if (density > 0.45) {
    const towerAt = spot(deck, random, 2);
    if (towerAt) block(surface, towerAt, 2.4 + random() * 1.6, 2.4 + random() * 1.6, y, 4 + random() * 9, random() * Math.PI);
  }

  // A railing around the edge, and a pole with its harness of cables.
  if (density > 0.2) railing(surface, deck, y, 1.1);
  if (density > 0.35) {
    const poleAt = spot(deck, random, 2);
    if (poleAt) pole(surface, poleAt, deck, y, random);
  }

  // Air conditioning units and vents, low and boxy.
  const units = Math.round(2 + density * 8);
  for (let i = 0; i < units; i++) {
    const at = spot(deck, random, 1);
    if (!at) continue;
    block(surface, at, 1.2 + random() * 1.1, 0.8 + random() * 0.9, y, 0.6 + random() * 0.7, random() * Math.PI);
  }
}
