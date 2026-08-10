/**
 * A section is the design unit: a run of floors that owns its shape. Its skin is the loft
 * between the footprint it starts on and the one it ends on, so a step, a slide, a turn, a
 * twist and a taper are all the same operation, and anything special stays inside the section.
 *
 * Everything here is metres, in the section's own frame: world X and Z, y=0 at its underside.
 */
import { FACADE_STYLE, gridded } from '#materials';
import { Surface, type Vec } from './geometry.ts';
import { baysOn, insetRing, lerp, outwardAt, type Corner } from './plan.ts';
import { windowRow, WINDOW, type WindowStyle } from './openings.ts';
import { segment } from './segment.ts';

export type { Corner };
export { insetRing, insideRing, middleOf, outwardAt } from './plan.ts';

export type SectionShape = {
  bottom: Corner[];
  top: Corner[];
  height: number;
  /** How many rows the walls are cut into, so a texture tiles once per floor. */
  floors: number;
  /** Bevel on the top and bottom edges, in metres. The chamfer of a chamfered box. */
  chamfer?: number;
  /** Real openings in every bay of every floor. Left out, the walls stay flat. */
  windows?: WindowStyle;
  /**
   * The storey the wall tile was drawn for, in metres. A floor taller than this shows more of the
   * tile instead of stretching one row of it over a two storey lobby. Left out, one row a floor.
   */
  storey?: number;
  /**
   * The grid each wall picture actually holds, by material. A generated picture holds whatever
   * grid the model drew, and laying UVs on the wrong one slices the windows at every floor. Left
   * out, the grid the kit draws its own tiles on.
   */
  tiles?: Record<string, { across: number; down: number }>;
  /**
   * What the skin is made of. A section somebody composes windows and doors onto wears the plain
   * wall instead of the one with windows drawn in it, or the two land in the same place.
   */
  skin?: string;
  /**
   * Metres a tile covers, by material, where the pack knows better than the library: 21 courses
   * of brick is 1.6 m of wall, and the same picture read at 3 m makes every brick a door.
   */
  scale?: Record<string, number>;
};

/** The footprint partway up the section. */
export function ringAt(shape: SectionShape, t: number): Corner[] {
  return shape.bottom.map((corner, i) => lerp(corner, shape.top[i]!, t));
}

const point = (corner: Corner, y: number): Vec => [corner[0], y, corner[1]];

/** The ring a cap sits on: the bevel pulls the very top and bottom in. */
export function capRing(shape: SectionShape, end: 0 | 1): Corner[] {
  return insetRing(ringAt(shape, end), shape.chamfer ?? 0);
}

/**
 * How many rows of the tile one floor shows. A storey the tile was drawn for shows one row; a
 * taller one, a 6 m lobby under 3.2 m floors, shows two rather than stretching one row over it.
 * A section that cuts real windows always shows one, because one pane is drawn per floor.
 */
export function rowsPerFloor(shape: SectionShape): number {
  const storey = shape.storey;
  if (shape.windows || !storey || storey <= 0) return 1;
  return Math.max(1, Math.round(shape.height / Math.max(1, shape.floors) / storey));
}

/**
 * One row of quads around the section. `floor` places the row on the wall tile: a whole number of
 * bays across the face, and the rows of the tile this floor covers going up. Left out, the row
 * takes the plain real-world scale, which is what a bevel wants.
 *
 * The tile runs up the building the way it was drawn, so its bottom row lands on the bottom
 * floor. Beyond the tile's own height it repeats, which is what the sampler does with a UV past 1.
 */
function band(surface: Surface, lower: Corner[], upper: Corner[], y0: number, y1: number, floor: number | undefined, rows: number, grid: { across: number; down: number }): void {
  const { across, down } = grid;

  for (let i = 0; i < lower.length; i++) {
    const next = (i + 1) % lower.length;
    const a = lower[i]!;
    const b = lower[next]!;
    const patch =
      floor === undefined
        ? undefined
        : {
            u0: 0,
            u1: baysOn(Math.hypot(b[0] - a[0], b[1] - a[1]), FACADE_STYLE.bay) / across,
            v0: 1 - ((floor + 1) * rows) / down,
            v1: 1 - (floor * rows) / down,
          };
    surface.quad(point(a, y0), point(b, y0), point(upper[next]!, y1), point(upper[i]!, y1), patch);
  }
}

/**
 * The outside of the section, one row of quads per floor, with a bevel at the top and bottom
 * when the section asks for one. That bevel is what a chamfered box has and a plain box does
 * not: an edge that catches the light instead of a hard line.
 */
export function walls(surface: Surface, shape: SectionShape, pane?: Surface): void {
  const rows = Math.max(1, shape.floors);
  const perFloor = rowsPerFloor(shape);
  // The grid this wall's own picture holds, which is not always the one the kit draws.
  const grid = shape.tiles?.[surface.material] ?? { across: FACADE_STYLE.across, down: FACADE_STYLE.down };
  // Only a picture drawn as bays and floors is laid out as bays and floors. A plain wall is a
  // material: it tiles by the metre like concrete does, or every course of brick comes out a
  // metre deep.
  const asBays = gridded(surface.material);
  const chamfer = Math.min(shape.chamfer ?? 0, shape.height / 3);
  const low = chamfer;
  const high = shape.height - chamfer;

  if (chamfer > 0) band(surface, capRing(shape, 0), ringAt(shape, chamfer / shape.height), 0, chamfer, undefined, 1, grid);

  for (let row = 0; row < rows; row++) {
    const t0 = row / rows;
    const t1 = (row + 1) / rows;
    const y0 = low + (high - low) * t0;
    const y1 = low + (high - low) * t1;
    const lower = ringAt(shape, y0 / shape.height);
    const upper = ringAt(shape, y1 / shape.height);

    band(surface, lower, upper, y0, y1, asBays ? row : undefined, perFloor, grid);
    if (!shape.windows || !pane) continue;

    // A floor with windows: every face is cut into bays and each bay gets a pane.
    for (let i = 0; i < lower.length; i++) windowRow(pane, lower, upper, i, row, y0, y1, shape.windows, grid);
  }

  if (chamfer > 0) band(surface, ringAt(shape, high / shape.height), capRing(shape, 1), high, shape.height, undefined, 1, grid);
}

/** The deck on top, or the underside at the bottom. A fan, so any footprint closes. */
export { WINDOW, type WindowStyle };

export function cap(surface: Surface, ring: Corner[], y: number, up: boolean): void {
  for (let i = 1; i < ring.length - 1; i++) {
    if (up) surface.quad(point(ring[0]!, y), point(ring[i]!, y), point(ring[i + 1]!, y), point(ring[0]!, y));
    else surface.quad(point(ring[0]!, y), point(ring[i + 1]!, y), point(ring[i]!, y), point(ring[0]!, y));
  }
}

/** The edge of a footprint that faces a given side, whatever the footprint is. */
export function edgeFacing(ring: Corner[], side: 'N' | 'E' | 'S' | 'W'): number {
  const want: Record<string, [number, number]> = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] };
  const [wx, wz] = want[side]!;
  let best = 0;
  let score = -Infinity;
  for (let i = 0; i < ring.length; i++) {
    const out = outwardAt(ring, i);
    const dot = out[0] * wx + out[1] * wz;
    if (dot > score) {
      score = dot;
      best = i;
    }
  }
  return best;
}

/**
 * Cables climbing one face: thin runs standing proud of the wall, following its twist.
 *
 * One point per floor, handed to a segment. A straight face drops the points in between and
 * comes out as one length of cable; a twisting one keeps them and bends at each floor.
 */
export const WIRE_RUNS: { along: number; width: number }[] = [0, 1, 2, 3].map((run) => ({
  along: 0.3 + run * 0.11,
  width: 0.12,
}));

export function wires(surface: Surface, shape: SectionShape, side: 'N' | 'E' | 'S' | 'W'): void {
  const edge = edgeFacing(shape.bottom, side);
  const stand = 0.05;
  const rows = Math.max(1, shape.floors);

  for (const { along, width } of WIRE_RUNS) {
    const points = Array.from({ length: rows + 1 }, (_, row) => facePoint(shape, row / rows, edge, along, stand));
    segment(surface, points, { profile: 'square', thickness: width });
  }
}

/** A point on a face at height t: `along` across the edge, `stand` metres out of the wall. */
export function facePoint(shape: SectionShape, t: number, edge: number, along: number, stand: number): Vec {
  const ring = ringAt(shape, t);
  const a = ring[edge]!;
  const b = ring[(edge + 1) % ring.length]!;
  const outward = outwardAt(ring, edge);
  return [
    a[0] + (b[0] - a[0]) * along + outward[0] * stand,
    shape.height * t,
    a[1] + (b[1] - a[1]) * along + outward[1] * stand,
  ];
}

/** How far a part sunk into a wall reaches, so its back face never shares the wall's plane. */
export const BITE = 0.04;

/** The four corners of one upright, at height t of the section, hugging the given face. */
export function tubeRing(shape: SectionShape, t: number, edge: number, along: number, thickness: number, stand: number): Corner[] {
  const ring = ringAt(shape, t);
  const a = ring[edge]!;
  const b = ring[(edge + 1) % ring.length]!;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length = Math.hypot(dx, dz) || 1;
  const tangent: Corner = [dx / length, dz / length];
  const outward = outwardAt(ring, edge);
  const centre: Corner = [a[0] + dx * along, a[1] + dz * along];
  const half = thickness / 2;

  const at = (side: number, out: number): Corner => [
    centre[0] + tangent[0] * side + outward[0] * out,
    centre[1] + tangent[1] * side + outward[1] * out,
  ];
  // Outer face first, then the back inside the wall: the same way round a footprint goes, so
  // the upright built from it comes out facing out.
  return [at(-half, stand), at(half, stand), at(half, -BITE), at(-half, -BITE)];
}

