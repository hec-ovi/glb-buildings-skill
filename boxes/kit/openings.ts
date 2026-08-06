/**
 * Real windows. A wall row on one face is cut into bays, and each bay gets a rectangular hole
 * with a reveal around it and a pane at the back. That is the whole trick: no frames, no
 * mullions, no sills modelled. About eighteen triangles a window, so a floor of them is cheap
 * enough to put on the sections that are actually seen.
 *
 * The hole's edges meet the reveal's, and the reveal's meet the pane's, so the section stays a
 * closed solid and nothing floats.
 */
import { Surface, type Vec } from './geometry.ts';
import type { Corner } from './section.ts';

export type WindowStyle = {
  /** How wide a bay is, in metres. The row is split into whole bays. */
  bay: number;
  /** Where the opening starts and ends across its bay, 0 to 1. */
  from: number;
  to: number;
  /** Sill and head as a share of the floor height. */
  sill: number;
  head: number;
  /** How deep the reveal goes. */
  depth: number;
};

export const WINDOW: WindowStyle = { bay: 3, from: 0.22, to: 0.78, sill: 0.28, head: 0.78, depth: 0.25 };

/**
 * One wall row on one edge, with a window per bay. The row is the quad between the lower ring
 * edge and the upper one, so a twisted or tapered section keeps its shape through the openings.
 */
export function windowedRow(
  wall: Surface,
  pane: Surface,
  lower: [Corner, Corner],
  upper: [Corner, Corner],
  y0: number,
  y1: number,
  style: WindowStyle = WINDOW,
): void {
  const [a0, a1] = lower;
  const [b0, b1] = upper;

  const run = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
  const bays = Math.max(1, Math.round(run / style.bay));

  // A point on the row: `t` across it, `v` up it, `into` the building.
  const inward: Corner = (() => {
    const dx = a1[0] - a0[0];
    const dz = a1[1] - a0[1];
    const length = Math.hypot(dx, dz) || 1;
    return [-dz / length, dx / length];
  })();

  const at = (t: number, v: number, into = 0): Vec => {
    const low: Corner = [a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t];
    const high: Corner = [b0[0] + (b1[0] - b0[0]) * t, b0[1] + (b1[1] - b0[1]) * t];
    return [
      low[0] + (high[0] - low[0]) * v + inward[0] * into,
      y0 + (y1 - y0) * v,
      low[1] + (high[1] - low[1]) * v + inward[1] * into,
    ];
  };

  const quad = (surface: Surface, t0: number, v0: number, t1: number, v1: number, into = 0) =>
    surface.quad(at(t0, v0, into), at(t1, v0, into), at(t1, v1, into), at(t0, v1, into));

  for (let bay = 0; bay < bays; bay++) {
    const left = bay / bays;
    const right = (bay + 1) / bays;
    const width = right - left;
    const holeL = left + width * style.from;
    const holeR = left + width * style.to;
    const { sill, head, depth: d } = style;

    // The wall around the hole: below, above, and a pier each side.
    quad(wall, left, 0, right, sill);
    quad(wall, left, head, right, 1);
    quad(wall, left, sill, holeL, head);
    quad(wall, holeR, sill, right, head);

    // The reveal, four faces turned inward.
    wall.quad(at(holeL, sill), at(holeL, head), at(holeL, head, d), at(holeL, sill, d));
    wall.quad(at(holeR, head), at(holeR, sill), at(holeR, sill, d), at(holeR, head, d));
    wall.quad(at(holeL, head), at(holeR, head), at(holeR, head, d), at(holeL, head, d));
    wall.quad(at(holeR, sill), at(holeL, sill), at(holeL, sill, d), at(holeR, sill, d));

    // The pane at the back of the reveal.
    quad(pane, holeL, sill, holeR, head, d);
  }
}
