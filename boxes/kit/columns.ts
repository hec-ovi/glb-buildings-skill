/**
 * Columns. Uprights standing off a section, either one at each corner of the footprint or a
 * rib every few metres along every face. They give a bulk section vertical structure, which is
 * what makes a tall run read as built rather than extruded.
 */
import { Surface, type Vec } from './geometry.ts';
import { BITE, cap, ringAt, tubeRing, type Corner, type SectionShape } from './section.ts';

export type ColumnStyle = 'none' | 'corners' | 'ribs' | 'partial';

/** How often a rib stands along a face, in metres. */
export const RIB_PITCH = 3.5;

/** Where an upright stands on a face: how far along it, and how wide it is, in metres. */
export type Upright = { along: number; width: number };

/**
 * Every upright a style puts on one face of this length. `partial` leaves some of them out at
 * random, so this is the full set of places one could stand: whatever reads a face has to keep
 * all of them clear, or a composed element lands on the one that did get built.
 */
export function uprightsOn(run: number, style: ColumnStyle): Upright[] {
  if (style === 'none') return [];
  if (style === 'corners') {
    // A corner column sits on the vertex, so it eats into both faces that meet there.
    return [
      { along: 0, width: 0.6 },
      { along: 1, width: 0.6 },
    ];
  }

  const ribs = Math.max(1, Math.round(run / RIB_PITCH));
  const width = style === 'ribs' ? 0.38 : 0.42;
  return Array.from({ length: ribs }, (_, rib) => ({ along: (rib + 0.5) / ribs, width }));
}

const point = (corner: Corner, y: number): Vec => [corner[0], y, corner[1]];

/** One upright, following the section's twist, closed at both ends. Rows `from` to `to`. */
function upright(
  surface: Surface,
  shape: SectionShape,
  edge: number,
  along: number,
  width: number,
  stand: number,
  from = 0,
  to = Math.max(1, shape.floors),
): void {
  const rows = Math.max(1, shape.floors);
  let previous = tubeRing(shape, from / rows, edge, along, width, stand);
  cap(surface, previous, (shape.height * from) / rows, false);

  for (let row = from; row < to; row++) {
    const t = (row + 1) / rows;
    const ring = tubeRing(shape, t, edge, along, width, stand);
    const y0 = (shape.height * row) / rows;
    const y1 = shape.height * t;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      surface.quad(point(previous[i]!, y0), point(previous[j]!, y0), point(ring[j]!, y1), point(ring[i]!, y1));
    }
    previous = ring;
  }
  cap(surface, previous, (shape.height * to) / rows, true);
}

/**
 * A column on a footprint corner: a box centred on the vertex, following the section up. It
 * reaches into the wall on both sides so the corner reads as one piece of structure.
 */
function corner(surface: Surface, shape: SectionShape, vertex: number, size: number, stand: number): void {
  const rows = Math.max(1, shape.floors);
  const half = size / 2;

  const ringAtCorner = (t: number): Corner[] => {
    const ring = ringAt(shape, t);
    const here = ring[vertex]!;
    const before = ring[(vertex + ring.length - 1) % ring.length]!;
    const after = ring[(vertex + 1) % ring.length]!;

    const away = (from: Corner, to: Corner): Corner => {
      const dx = to[0] - from[0];
      const dz = to[1] - from[1];
      const length = Math.hypot(dx, dz) || 1;
      return [dx / length, dz / length];
    };
    const a = away(here, before);
    const b = away(here, after);
    // The corner's outward direction is the way neither edge goes.
    const out: Corner = [-(a[0] + b[0]), -(a[1] + b[1])];
    const length = Math.hypot(out[0], out[1]) || 1;

    // Anchored to the corner: the column reaches `stand` past it and the rest of it sits inside
    // the section. Centred on the corner instead, most of the column hangs in the air, which is
    // what makes it read as a second box stuck on the side.
    const reach = stand - half;
    const push: Corner = [(out[0] / length) * reach, (out[1] / length) * reach];
    const centre: Corner = [here[0] + push[0], here[1] + push[1]];

    // Same direction round as a footprint, or the column comes out inside out.
    return [
      [centre[0] - half, centre[1] + half],
      [centre[0] + half, centre[1] + half],
      [centre[0] + half, centre[1] - half],
      [centre[0] - half, centre[1] - half],
    ];
  };

  let previous = ringAtCorner(0);
  cap(surface, previous, 0, false);
  for (let row = 0; row < rows; row++) {
    const t = (row + 1) / rows;
    const ring = ringAtCorner(t);
    const y0 = (shape.height * row) / rows;
    const y1 = shape.height * t;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      surface.quad(
        [previous[i]![0], y0, previous[i]![1]],
        [previous[j]![0], y0, previous[j]![1]],
        [ring[j]![0], y1, ring[j]![1]],
        [ring[i]![0], y1, ring[i]![1]],
      );
    }
    previous = ring;
  }
  cap(surface, previous, shape.height, true);
}

/** Deterministic, so the same section keeps the same uprights between builds. */
function rng(seed: number): () => number {
  let state = (seed | 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function columns(surface: Surface, shape: SectionShape, style: ColumnStyle, seed = 1): void {
  if (style === 'none') return;
  const ring = ringAt(shape, 0);
  const rows = Math.max(1, shape.floors);
  const random = rng(seed);

  for (let edge = 0; edge < ring.length; edge++) {
    const a = ring[edge]!;
    const b = ring[(edge + 1) % ring.length]!;
    const run = Math.hypot(b[0] - a[0], b[1] - a[1]);

    if (style === 'corners') {
      // One column per corner, standing on the corner itself. Put one near the corner on each
      // edge instead and the two of them fight over the same space.
      corner(surface, shape, edge, 0.6, 0.22);
      continue;
    }

    for (const { along, width } of uprightsOn(run, style)) {
      if (style === 'ribs') {
        upright(surface, shape, edge, along, width, 0.16);
        continue;
      }
      // partial: uprights stand in the gaps, over a few floors, not the whole height
      if (random() < 0.45) continue;
      const span = Math.max(1, Math.round(1 + random() * Math.min(3, rows - 1)));
      const from = Math.floor(random() * (rows - span + 1));
      upright(surface, shape, edge, along, width, 0.2, from, from + span);
    }
  }
}
