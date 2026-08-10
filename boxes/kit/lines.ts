/**
 * A line: a lit run climbing a face across many floors. Several of them at different places along
 * a face, over a wall that carries nothing but its windows, is most of what makes a tower read as
 * a tower at night.
 *
 * It is a segment like any other, so it mitres its own corners and follows a face that twists or
 * tapers. What is new is that it is placed on the face rather than in the building's coordinates:
 * a side, how far along it, and which floors it spans.
 */
import { BuildingError } from '#spec';
import type { Surface } from './geometry.ts';
import { edgeFacing, facePoint, type SectionShape } from './section.ts';
import { segment } from './segment.ts';

export type Side = 'N' | 'E' | 'S' | 'W';

export type LineStyle = {
  side: Side;
  /** Where along the face, 0 at the left end seen from outside, 1 at the right. */
  along: number;
  /** The floors it spans: the bottom of `from` to the top of `to`, both included. */
  from: number;
  to: number;
  /** Across the run, in metres. */
  thickness: number;
  /** A round tube or a square one. */
  profile?: 'round' | 'square';
};

/** How far a line stands out of the wall. Enough to catch light down one side of it. */
export const LINE_STAND = 0.09;

/**
 * Draw one line. A point per floor, so a straight face comes out as one length and a twisting one
 * bends at each floor, which is the same trick the cable runs use.
 */
export function line(surface: Surface, shape: SectionShape, style: LineStyle): void {
  const floors = Math.max(1, shape.floors);
  const from = Math.max(0, Math.min(floors - 1, Math.round(style.from)));
  const to = Math.max(from, Math.min(floors - 1, Math.round(style.to)));

  if (style.thickness <= 0) {
    throw new BuildingError('E_DOC_INVALID', 'a line needs a thickness above zero', ['line', 'thickness']);
  }

  const edge = edgeFacing(shape.bottom, style.side);
  const points = [];
  for (let floor = from; floor <= to + 1; floor++) {
    points.push(facePoint(shape, floor / floors, edge, style.along, LINE_STAND));
  }

  segment(surface, points, { profile: style.profile ?? 'round', thickness: style.thickness, sides: 8 });
}

/**
 * A run of neon round the top of a section: the crown. Drawn edge by edge rather than as one
 * closed loop, each run reaching a little past both corners, so consecutive runs overlap instead
 * of butting onto the same plane.
 */
export function crown(surface: Surface, shape: SectionShape, thickness: number): void {
  const ring = shape.top;
  const y = shape.height + thickness * 0.4;

  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (run < thickness) continue;

    const over = Math.min(thickness * 0.5, run / 4) / run;
    const at = (t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t];
    segment(surface, [at(-over), at(1 + over)], { profile: 'round', thickness, sides: 8 });
  }
}
