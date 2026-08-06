/**
 * Windows, the cheap way. Cutting a real hole means the wall, the reveal and the caps have to
 * agree on where every edge is split, and one missed split leaves the section open. Instead a
 * window is a dark panel set into the face: a thin box that stands a little proud, so the frame
 * around it is the wall itself.
 *
 * Twelve triangles each, and it cannot break the shell.
 */
import { FACADE_STYLE } from '#materials';
import { Surface, type Vec } from './geometry.ts';
import { outwardAt, type Corner } from './plan.ts';

export type WindowStyle = {
  /** How wide a bay is, in metres. The row is split into whole bays. */
  bay: number;
  /** Where the pane starts and ends across its bay, 0 to 1. */
  from: number;
  to: number;
  /** Sill and head as a share of the floor height. */
  sill: number;
  head: number;
  /** How far the pane stands off the wall. Small, so it reads as glass in a reveal. */
  depth: number;
};

/** Panes sit in the bays the facade texture is drawn for, so cut glass lands where drawn glass is. */
export const WINDOW: WindowStyle = { bay: FACADE_STYLE.bay, from: 0.12, to: 0.88, sill: 0.28, head: 0.68, depth: 0.09 };

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
  y0: number,
  y1: number,
  style: WindowStyle = WINDOW,
): void {
  const next = (edge + 1) % lowerRing.length;
  const lower: [Corner, Corner] = [lowerRing[edge]!, lowerRing[next]!];
  const upper: [Corner, Corner] = [upperRing[edge]!, upperRing[next]!];
  const [a0, a1] = lower;
  const run = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
  const bays = Math.max(1, Math.round(run / style.bay));
  const outward = outwardAt(lowerRing, edge);

  const rise = y1 - y0;
  const sill = y0 + rise * style.sill;
  const head = y0 + rise * style.head;
  const back = -0.05;

  for (let bay = 0; bay < bays; bay++) {
    const left = (bay + style.from) / bays;
    const right = (bay + style.to) / bays;

    const at = (t: number, ring: [Corner, Corner], out: number): Corner => {
      const on = lerp(ring[0], ring[1], t);
      return [on[0] + outward[0] * out, on[1] + outward[1] * out];
    };

    // Glass first, then the back inside the reveal: the same way round a footprint goes.
    const bottom = [at(left, lower, style.depth), at(right, lower, style.depth), at(right, lower, back), at(left, lower, back)];
    const top = [at(left, upper, style.depth), at(right, upper, style.depth), at(right, upper, back), at(left, upper, back)];

    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      pane.quad(point(bottom[i]!, sill), point(bottom[j]!, sill), point(top[j]!, head), point(top[i]!, head));
    }
    pane.quad(point(top[0]!, head), point(top[1]!, head), point(top[2]!, head), point(top[3]!, head));
    pane.quad(point(bottom[3]!, sill), point(bottom[2]!, sill), point(bottom[1]!, sill), point(bottom[0]!, sill));
  }
}
