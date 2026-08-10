/**
 * Windows with real depth. The facade texture already draws the glazing; this gives the same
 * window a body, so the glass sits in a reveal and catches the light from an angle instead of
 * lying flat on the wall.
 *
 * A pane is a shallow box on the wall, and its front face samples the very window it covers, so
 * a lit window is still lit and there is one window system on the building rather than two.
 * Twelve triangles each, and it cannot break the shell.
 */
import { FACADE_STYLE } from '#materials';
import { Surface, type Vec } from './geometry.ts';
import { baysOn, outwardAt, type Corner } from './plan.ts';

export type WindowStyle = {
  /** How wide a bay is, in metres. The row is split into whole bays. */
  bay: number;
  /** How far the pane stands off the wall. Small, so it reads as glass in a reveal. */
  depth: number;
  /** How far its back sits inside the wall, so the two never share a plane. */
  back: number;
};

export const WINDOW: WindowStyle = { bay: FACADE_STYLE.bay, depth: 0.09, back: 0.05 };

const point = (corner: Corner, y: number): Vec => [corner[0], y, corner[1]];

function lerp(a: Corner, b: Corner, t: number): Corner {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** One row of panes along one edge of one floor, `edge` being the edge of the lower ring. */
export function windowRow(
  pane: Surface,
  lowerRing: Corner[],
  upperRing: Corner[],
  edge: number,
  floor: number,
  y0: number,
  y1: number,
  style: WindowStyle = WINDOW,
): void {
  const next = (edge + 1) % lowerRing.length;
  const lower: [Corner, Corner] = [lowerRing[edge]!, lowerRing[next]!];
  const upper: [Corner, Corner] = [upperRing[edge]!, upperRing[next]!];
  const run = Math.hypot(lower[1][0] - lower[0][0], lower[1][1] - lower[0][1]);
  const outward = outwardAt(lowerRing, edge);

  const { across, down, pane: glass } = FACADE_STYLE;
  // The same whole number of bays the wall lays its tile on, so the pane covers the window the
  // wall draws under it rather than a slice of the one next door.
  const bays = baysOn(run, style.bay);
  const rise = y1 - y0;
  // The drawn window, read as the wall reads it: across the bay, and down from the floor's top.
  const sill = y0 + rise * (1 - glass.bottom);
  const head = y0 + rise * (1 - glass.top);

  for (let bay = 0; bay < bays; bay++) {
    const left = (bay + glass.left) / bays;
    const right = (bay + glass.right) / bays;

    const at = (t: number, ring: [Corner, Corner], out: number): Corner => {
      const on = lerp(ring[0], ring[1], t);
      return [on[0] + outward[0] * out, on[1] + outward[1] * out];
    };

    // Glass first, then the back inside the reveal: the same way round a footprint goes.
    const bottom = [at(left, lower, style.depth), at(right, lower, style.depth), at(right, lower, -style.back), at(left, lower, -style.back)];
    const top = [at(left, upper, style.depth), at(right, upper, style.depth), at(right, upper, -style.back), at(left, upper, -style.back)];

    // The front face carries the window it stands on, read off the tile exactly where the wall
    // behind it reads: the same bay across, and the same row up.
    const patch = {
      u0: (bay + glass.left) / across,
      u1: (bay + glass.right) / across,
      v0: 1 - (floor + 1 - glass.top) / down,
      v1: 1 - (floor + 1 - glass.bottom) / down,
    };

    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      pane.quad(point(bottom[i]!, sill), point(bottom[j]!, sill), point(top[j]!, head), point(top[i]!, head), i === 0 ? patch : undefined);
    }
    pane.quad(point(top[0]!, head), point(top[1]!, head), point(top[2]!, head), point(top[3]!, head));
    pane.quad(point(bottom[3]!, sill), point(bottom[2]!, sill), point(bottom[1]!, sill), point(bottom[0]!, sill));
  }
}
