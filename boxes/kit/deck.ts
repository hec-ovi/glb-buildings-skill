/**
 * The deck as a grid. A roof is not a place to model everything: it is a floor plan of cells,
 * and each cell holds one part. Two metres square is about one air conditioning unit, one
 * turbine, or one pipe going down to the level below; the bigger parts take a 2x2 block.
 *
 * Seeded, so the same deck lays out the same way every build.
 */
import { Surface, type Vec } from './geometry.ts';
import { insideRing, nearestOn, outwardAt, type Corner } from './plan.ts';
import { segment } from './segment.ts';

export const CELL = 2;

export type Cell = { name: string; centre: Corner; size: number; column: number; row: number };

/** A, B, ... Z, AA, AB: column names for the grid an agent reads. */
function columnName(index: number): string {
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

/**
 * Every cell of the deck whose four corners are inside the footprint, in a stable order. Cells
 * under the section above are left out: a roof only exists where the sky does, and a part
 * standing on a covered cell would be inside the building.
 */
export function cells(ring: Corner[], margin = 0.6, covered?: Corner[]): Cell[] {
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
      if (!corners.every((corner) => insideRing(ring, corner))) continue;
      if (covered && corners.some((corner) => insideRing(covered, corner))) continue;
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
  // Same direction as every other part: walls counter-clockwise seen from outside, top fan up,
  // bottom fan down. Wound the other way, a cylinder looks transparent and shows its inside.
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    surface.quad(point(ring[i]!, y0), point(ring[j]!, y0), point(ring[j]!, y1), point(ring[i]!, y1));
  }
  // The ends fan from the middle rather than from a vertex, so no edge crosses the inside of the
  // cylinder where another part butted against it could land on exactly the same line.
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    surface.quad(point(centre, y1), point(ring[i]!, y1), point(ring[j]!, y1), point(centre, y1));
    surface.quad(point(centre, y0), point(ring[j]!, y0), point(ring[i]!, y0), point(centre, y0));
  }
}

/**
 * A roof extractor: a wide flat housing, a narrower barrel on top of it, four blades across the
 * mouth and a hub in the middle. Stepping the two cylinders is what makes it read as a fan
 * rather than a lump, and it costs about ninety triangles.
 */
export function turbine(surface: Surface, centre: Corner, y: number, random: () => number): void {
  const radius = 0.85 + random() * 0.35;

  cylinder(surface, centre, radius, y, 0.28, 12); // the housing on the deck
  cylinder(surface, centre, radius * 0.78, y + 0.28, 0.5, 12); // the barrel it sits in
  cylinder(surface, centre, radius * 0.22, y + 0.78, 0.22, 8); // the hub

  // Blades reach from the hub to the rim, thick enough to read from a distance.
  const turn = random() * Math.PI;
  for (let blade = 0; blade < 4; blade++) {
    const angle = turn + (blade / 4) * Math.PI * 2;
    const reach = radius * 0.72;
    const at: Corner = [centre[0] + Math.sin(angle) * reach * 0.5, centre[1] + Math.cos(angle) * reach * 0.5];
    block(surface, at, reach, radius * 0.3, y + 0.66, 0.14, -angle);
  }
}

/** The nearest point on a footprint's edge, which way is out from there, and how far away it is. */
function nearestEdge(ring: Corner[], from: Corner): { at: Corner; away: Corner; distance: number } {
  const { at, edge, distance } = nearestOn(ring, from);
  return { at, away: outwardAt(ring, edge), distance };
}

/**
 * A pipe standing on the deck, running across to the nearest edge and dropping down the outside
 * of the building. The run finds the edge itself, so a pipe placed in the middle of a deck still
 * comes down where a pipe should rather than through the wall.
 *
 * Four points and one call: the elbows are the segment's, mitred, so the pipe is round the whole
 * way instead of changing into a box at the corner.
 */
export function pipe(surface: Surface, centre: Corner, ring: Corner[], y: number, random: () => number): void {
  const radius = 0.24 + random() * 0.18;
  const rise = 1.4 + random() * 1.8;
  const drop = 3 + random() * 5;

  const edge = nearestEdge(ring, centre);
  const out: Corner = [
    edge.at[0] + edge.away[0] * (radius + 0.12),
    edge.at[1] + edge.away[1] * (radius + 0.12),
  ];

  segment(
    surface,
    [
      [centre[0], y, centre[1]],
      [centre[0], y + rise, centre[1]],
      [out[0], y + rise, out[1]],
      [out[0], y + rise - drop, out[1]],
    ],
    { profile: 'round', thickness: radius * 2, sides: 8 },
  );
}
