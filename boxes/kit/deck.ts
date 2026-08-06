/**
 * The deck as a grid. A roof is not a place to model everything: it is a floor plan of cells,
 * and each cell holds one part. Two metres square is about one air conditioning unit, one
 * turbine, or one pipe going down to the level below; the bigger parts take a 2x2 block.
 *
 * Seeded, so the same deck lays out the same way every build.
 */
import { Surface, type Vec } from './geometry.ts';
import type { Corner } from './section.ts';

export const CELL = 2;

export type Cell = { name: string; centre: Corner; size: number; column: number; row: number };

/** A, B, ... Z, AA, AB: column names for the grid an agent reads. */
export function columnName(index: number): string {
  let name = '';
  let n = index;
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

const point = (corner: Corner, y: number): Vec => [corner[0], y, corner[1]];

export function rng(seed: number): () => number {
  let state = (seed | 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convex footprint, so one sign test per edge decides whether a point is on the deck. */
export function onDeck(ring: Corner[], p: Corner): boolean {
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

/** Every cell of the deck whose four corners are inside the footprint, in a stable order. */
export function cells(ring: Corner[], margin = 0.6): Cell[] {
  const xs = ring.map((c) => c[0]);
  const zs = ring.map((c) => c[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const z0 = Math.min(...zs);
  const z1 = Math.max(...zs);

  const found: Cell[] = [];
  let column = 0;
  for (let x = x0 + CELL / 2; x <= x1; x += CELL, column++) {
    let row = 0;
    for (let z = z0 + CELL / 2; z <= z1; z += CELL, row++) {
      const half = CELL / 2 + margin;
      const corners: Corner[] = [
        [x - half, z - half],
        [x + half, z - half],
        [x + half, z + half],
        [x - half, z + half],
      ];
      if (!corners.every((corner) => onDeck(ring, corner))) continue;
      found.push({ name: `${columnName(column)}${row + 1}`, centre: [x, z], size: CELL, column, row });
    }
  }
  return found;
}

/** A box on the deck, turned about its own middle. */
export function block(surface: Surface, centre: Corner, width: number, depth: number, y0: number, height: number, turn = 0): void {
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

/** An upright cylinder, drawn with `sides` faces. Closed at both ends. */
export function cylinder(surface: Surface, centre: Corner, radius: number, y0: number, height: number, sides = 10): void {
  const ring: Corner[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    ring.push([centre[0] + radius * Math.sin(angle), centre[1] + radius * Math.cos(angle)]);
  }
  const y1 = y0 + height;
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    surface.quad(point(ring[j]!, y0), point(ring[i]!, y0), point(ring[i]!, y1), point(ring[j]!, y1));
  }
  for (let i = 1; i < sides - 1; i++) {
    surface.quad(point(ring[0]!, y1), point(ring[i + 1]!, y1), point(ring[i]!, y1), point(ring[0]!, y1));
    surface.quad(point(ring[0]!, y0), point(ring[i]!, y0), point(ring[i + 1]!, y0), point(ring[0]!, y0));
  }
}

/** A turbine: a squat cylinder with a hub and three blades, flat on the deck. */
export function turbine(surface: Surface, centre: Corner, y: number, random: () => number): void {
  const radius = 0.75 + random() * 0.35;
  cylinder(surface, centre, radius, y, 0.55, 12);
  cylinder(surface, centre, radius * 0.28, y + 0.55, 0.35, 8);
  const turn = random() * Math.PI;
  for (let blade = 0; blade < 3; blade++) {
    const angle = turn + (blade / 3) * Math.PI * 2;
    const at: Corner = [centre[0] + Math.sin(angle) * radius * 0.5, centre[1] + Math.cos(angle) * radius * 0.5];
    block(surface, at, radius * 0.9, 0.14, y + 0.58, 0.1, -angle);
  }
}

/**
 * A pipe standing on the deck, bending over and dropping to the level below. The elbow is two
 * short straights rather than a real sweep: at this size nobody can tell, and it stays cheap.
 */
export function pipe(surface: Surface, centre: Corner, toward: Corner, y: number, random: () => number): void {
  const radius = 0.28 + random() * 0.22;
  const rise = 1.6 + random() * 2.4;
  const drop = 3 + random() * 5;

  cylinder(surface, centre, radius, y, rise, 8);

  const dx = toward[0] - centre[0];
  const dz = toward[1] - centre[1];
  const length = Math.hypot(dx, dz) || 1;
  const reach = 0.9 + random() * 0.8;
  const out: Corner = [centre[0] + (dx / length) * reach, centre[1] + (dz / length) * reach];

  // The bend across, then the run back down the outside.
  const turn = Math.atan2(dz, dx);
  block(surface, [(centre[0] + out[0]) / 2, (centre[1] + out[1]) / 2], reach, radius * 2, y + rise, radius * 2, -turn);
  cylinder(surface, out, radius, y + rise - drop, drop, 8);
}
