/**
 * A section is the design unit: a run of floors that owns its shape. Its skin is the loft
 * between the footprint it starts on and the one it ends on, so a step, a slide, a turn, a
 * twist and a taper are all the same operation, and anything special stays inside the section.
 *
 * Everything here is metres, in the section's own frame: world X and Z, y=0 at its underside.
 */
import { FACADE_STYLE } from '#materials';
import { Surface, type Vec } from './geometry.ts';
import { insetRing, lerp, outwardAt, type Corner } from './plan.ts';
import { windowRow, WINDOW, type WindowStyle } from './openings.ts';

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
 * One row of quads around the section. `floor` places the row on the facade tile: the tile holds
 * a few floors of windows, so floor 5 shows the row of the tile that floor 5 lands on, and a
 * face as long as three bays shows three bays of it. Left out, the row takes the plain
 * real-world scale, which is what a bevel wants.
 */
function band(surface: Surface, lower: Corner[], upper: Corner[], y0: number, y1: number, floor?: number): void {
  for (let i = 0; i < lower.length; i++) {
    const next = (i + 1) % lower.length;
    const a = lower[i]!;
    const b = lower[next]!;
    const patch =
      floor === undefined
        ? undefined
        : {
            u0: 0,
            u1: Math.hypot(b[0] - a[0], b[1] - a[1]) / (FACADE_STYLE.across * FACADE_STYLE.bay),
            v0: (floor % FACADE_STYLE.down) / FACADE_STYLE.down,
            v1: ((floor % FACADE_STYLE.down) + 1) / FACADE_STYLE.down,
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
  const chamfer = Math.min(shape.chamfer ?? 0, shape.height / 3);
  const low = chamfer;
  const high = shape.height - chamfer;

  if (chamfer > 0) band(surface, capRing(shape, 0), ringAt(shape, chamfer / shape.height), 0, chamfer);

  for (let row = 0; row < rows; row++) {
    const t0 = row / rows;
    const t1 = (row + 1) / rows;
    const y0 = low + (high - low) * t0;
    const y1 = low + (high - low) * t1;
    const lower = ringAt(shape, y0 / shape.height);
    const upper = ringAt(shape, y1 / shape.height);

    band(surface, lower, upper, y0, y1, row);
    if (!shape.windows || !pane) continue;

    // A floor with windows: every face is cut into bays and each bay gets a pane.
    for (let i = 0; i < lower.length; i++) windowRow(pane, lower, upper, i, row, y0, y1, shape.windows);
  }

  if (chamfer > 0) band(surface, ringAt(shape, high / shape.height), capRing(shape, 1), high, shape.height);
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

/** Cables climbing one face: thin tubes standing proud of the wall, following its twist. */
export function wires(surface: Surface, shape: SectionShape, side: 'N' | 'E' | 'S' | 'W'): void {
  const edge = edgeFacing(shape.bottom, side);
  const runs = 4;
  const thickness = 0.12;
  const stand = 0.1;
  const rows = Math.max(1, shape.floors);

  for (let run = 0; run < runs; run++) {
    const along = 0.3 + run * 0.11;
    let previous = tubeRing(shape, 0, edge, along, thickness, stand);
    cap(surface, previous, 0, false);

    for (let row = 0; row < rows; row++) {
      const t = (row + 1) / rows;
      const ring = tubeRing(shape, t, edge, along, thickness, stand);
      const y0 = (shape.height * row) / rows;
      const y1 = shape.height * t;
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        surface.quad(point(previous[i]!, y0), point(previous[j]!, y0), point(ring[j]!, y1), point(ring[i]!, y1));
      }
      previous = ring;
    }
    cap(surface, previous, shape.height, true);
  }
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

/** Two footprints are the same when every corner matches, so no junction is needed. */
export function sameRing(a: Corner[], b: Corner[]): boolean {
  return a.length === b.length && a.every((corner, i) => corner[0] === b[i]![0] && corner[1] === b[i]![1]);
}
