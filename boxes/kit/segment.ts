/**
 * A run of tube along a path: ducts, pipes, cables, conduit.
 *
 * The caller gives points and nothing else. One ring is carried along the path and mitred at
 * every corner onto the plane that bisects the two runs meeting there, so the corner is the
 * same ring rather than two parts overlapping, and the run comes out as one closed solid with
 * a constant cross section. That is the whole point: nobody composing a building should ever
 * work out a joint.
 */
import { BuildingError } from '#spec';
import { Surface, type Vec } from './geometry.ts';

/** A square duct, or a round pipe drawn with `sides` corners. */
export type Profile = 'square' | 'round';

export type SegmentStyle = {
  profile?: Profile;
  /** Across the run, in metres: the side of a square, the width of a round. */
  thickness: number;
  /** Corners on a round profile. */
  sides?: number;
};

/**
 * How far a corner may stretch the ring before the run folds through itself. A turn of 141
 * degrees stretches it three times, and anything sharper is a doubling back rather than a bend.
 */
export const MAX_MITRE = 3;

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec): number => Math.hypot(a[0], a[1], a[2]);

function unit(a: Vec): Vec {
  const len = length(a) || 1;
  return [a[0] / len, a[1] / len, a[2] / len];
}

/** Turn `v` about `axis` by `angle`, the rotation that carries one run's frame onto the next. */
function turn(v: Vec, axis: Vec, angle: number): Vec {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return add(add(scale(v, cos), scale(cross(axis, v), sin)), scale(axis, dot(axis, v) * (1 - cos)));
}

/** Any vector across the run, to start the frame from. */
function across(direction: Vec): Vec {
  const away: Vec = Math.abs(direction[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  return unit(cross(away, direction));
}

/** The profile, as offsets in the frame's own two directions, counter-clockwise. */
function corners(style: SegmentStyle): [number, number][] {
  const half = style.thickness / 2;
  if ((style.profile ?? 'square') === 'square') {
    return [
      [half, half],
      [-half, half],
      [-half, -half],
      [half, -half],
    ];
  }
  const sides = Math.max(3, style.sides ?? 8);
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2;
    return [Math.cos(angle) * half, Math.sin(angle) * half] as [number, number];
  });
}

/**
 * The points that actually shape the run: repeats dropped, and a point that carries straight on
 * from the one before dropped too. A cable climbing twenty identical floors is one straight, not
 * twenty rings of it.
 */
function path(points: Vec[]): Vec[] {
  const kept: Vec[] = [];
  for (const point of points) {
    const last = kept.at(-1);
    if (last && length(sub(point, last)) < 1e-6) continue;
    kept.push(point);
  }

  const shaped: Vec[] = [];
  for (let i = 0; i < kept.length; i++) {
    const before = kept[i - 1];
    const after = kept[i + 1];
    if (before && after && dot(unit(sub(kept[i]!, before)), unit(sub(after, kept[i]!))) > 1 - 1e-9) continue;
    shaped.push(kept[i]!);
  }
  return shaped;
}

/**
 * Draw the run. Points are metres in whatever frame the caller works in; two are a straight,
 * more are a path that bends at every point between.
 */
export function segment(surface: Surface, points: Vec[], style: SegmentStyle): void {
  const line = path(points);
  if (line.length < 2) {
    throw new BuildingError('E_DOC_INVALID', 'a segment needs two points that are not the same place', ['segment']);
  }
  if (style.thickness <= 0) {
    throw new BuildingError('E_DOC_INVALID', 'a segment needs a thickness above zero', ['segment', 'thickness']);
  }

  const shape = corners(style);
  const runs = line.slice(1).map((point, i) => unit(sub(point, line[i]!)));

  // The frame is carried from one run to the next by the smallest rotation between them, so a
  // path that climbs and turns does not spin its profile on the way.
  let u = across(runs[0]!);
  let v = unit(cross(runs[0]!, u));

  const rings: Vec[][] = [];

  for (let i = 0; i < line.length; i++) {
    const point = line[i]!;
    const incoming = runs[i - 1];
    const outgoing = runs[i];

    if (incoming && outgoing) {
      const axis = cross(incoming, outgoing);
      const span = length(axis);
      if (span > 1e-9) {
        const angle = Math.atan2(span, dot(incoming, outgoing));
        const about = scale(axis, 1 / span);
        u = turn(u, about, angle);
        v = turn(v, about, angle);
      }
    }

    // A corner sits on the plane bisecting the two runs. Straight ends sit square to their own.
    const plane = incoming && outgoing ? unit(add(incoming, outgoing)) : (outgoing ?? incoming)!;
    const along = outgoing ?? incoming!;
    const lean = dot(along, plane);

    if (lean < 1 / MAX_MITRE) {
      throw new BuildingError(
        'E_DOC_INVALID',
        `a segment turns back on itself at point ${i + 1} of ${line.length}, which is a fold rather than a bend. Give the turn more room, or split it into two runs`,
        ['segment', String(i + 1)],
      );
    }

    rings.push(
      shape.map(([a, b]) => {
        const offset = add(scale(u, a), scale(v, b));
        const corner = add(point, offset);
        // Slide the corner along the run until it lands on the bisector, which is the mitre.
        return incoming && outgoing ? add(corner, scale(along, -dot(offset, plane) / lean)) : corner;
      }),
    );
  }

  const first = rings[0]!;
  const last = rings.at(-1)!;
  const sides = shape.length;

  // The run lays its own UVs: across the tile wraps once around the profile, down the tile is one
  // tile's worth of run. That is what puts a flange every metre on a pipe and keeps a neon line
  // the same width whatever it is drawn at, instead of sampling a thumbnail of the texture.
  const along: number[] = [0];
  for (let i = 1; i < line.length; i++) along.push(along[i - 1]! + length(sub(line[i]!, line[i - 1]!)));

  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i]!;
    const b = rings[i + 1]!;
    const v1 = along[i]! / surface.tile;
    const v0 = along[i + 1]! / surface.tile;
    for (let k = 0; k < sides; k++) {
      const next = (k + 1) % sides;
      surface.quad(a[k]!, a[next]!, b[next]!, b[k]!, { u0: k / sides, u1: (k + 1) / sides, v0, v1 });
    }
  }

  // Ends fan from the middle, so no edge crosses the mouth where another part could butt onto
  // exactly the same line. The start faces back down its run, the finish faces on up its own.
  const middleOf = (ring: Vec[]): Vec =>
    scale(ring.reduce((sum, corner) => add(sum, corner), [0, 0, 0] as Vec), 1 / ring.length);

  const startMiddle = middleOf(first);
  const endMiddle = middleOf(last);
  for (let k = 0; k < sides; k++) {
    const next = (k + 1) % sides;
    surface.quad(startMiddle, first[next]!, first[k]!, startMiddle);
    surface.quad(endMiddle, last[k]!, last[next]!, endMiddle);
  }
}
