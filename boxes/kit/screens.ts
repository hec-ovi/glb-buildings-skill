/**
 * A screen standing off a face: the panel that spans many floors and carries a picture of its own.
 *
 * It is not composed on the face grid, because the grid repeats its design on every floor of a
 * section and a screen must not repeat. It is placed on the face instead: a side, how far along,
 * how wide, which floors it spans, and how far off the wall it stands.
 *
 * The panel carries its picture across its whole front, so one image is one screen whatever size
 * the screen is, and it hangs on brackets back to the wall so it is held rather than floating.
 */
import { BuildingError } from '#spec';
import type { Vec } from './geometry.ts';
import { METAL } from './names.ts';
import { edgeFacing, facePoint, type SectionShape } from './section.ts';
import { segment } from './segment.ts';
import type { Surfaces } from './surfaces.ts';
import type { Side } from './lines.ts';

export type ScreenStyle = {
  side: Side;
  /** Where the left edge sits along the face, 0 to 1 seen from outside. */
  along: number;
  /** How wide, as a share of the face. */
  wide: number;
  /** The floors it spans: the bottom of `from` to the top of `to`, both included. */
  from: number;
  to: number;
  /** How far off the wall its face stands, in metres. */
  stand: number;
  /** What it is drawn in: one material per screen, so each carries its own picture. */
  material: string;
};

/** How thick the panel is, and how far a bracket bites into the wall behind it. */
const DEPTH = 0.3;
const BITE = 0.05;

/** The whole picture across the front of the panel, however big the panel is. */
const FULL = { u0: 0, u1: 1, v0: 0, v1: 1 };

export function screen(kit: Surfaces, shape: SectionShape, style: ScreenStyle): void {
  const floors = Math.max(1, shape.floors);
  const from = Math.max(0, Math.min(floors - 1, Math.round(style.from)));
  const to = Math.max(from, Math.min(floors - 1, Math.round(style.to)));
  const left = Math.max(0, Math.min(1, style.along));
  const right = Math.max(left + 0.02, Math.min(1, left + style.wide));

  if (style.stand < DEPTH) {
    throw new BuildingError(
      'E_DOC_INVALID',
      `a screen standing ${style.stand} m off the wall is inside it: it is ${DEPTH} m thick, so give it at least that`,
      ['screen', 'stand'],
    );
  }

  const edge = edgeFacing(shape.bottom, style.side);
  const t0 = from / floors;
  const t1 = (to + 1) / floors;
  const face = kit.get(style.material);

  const at = (t: number, along: number, out: number): Vec => facePoint(shape, t, edge, along, out);
  const ring = (out: number): [Vec, Vec, Vec, Vec] => [at(t0, left, out), at(t0, right, out), at(t1, right, out), at(t1, left, out)];

  const back = ring(style.stand - DEPTH);
  const front = ring(style.stand);

  // The picture, then the rest of the box round it.
  face.quad(front[0], front[1], front[2], front[3], FULL);
  face.quad(back[3], back[2], back[1], back[0]);
  face.quad(back[0], back[1], front[1], front[0]);
  face.quad(back[1], back[2], front[2], front[1]);
  face.quad(back[2], back[3], front[3], front[2]);
  face.quad(back[3], back[0], front[0], front[3]);

  // Two brackets back to the wall, so the panel is held up by something.
  const arms = kit.get(METAL);
  const middle = (t0 + t1) / 2;
  const reach = right - left;
  for (const along of [left + reach * 0.2, left + reach * 0.8]) {
    for (const t of [t0 + (t1 - t0) * 0.15, t0 + (t1 - t0) * 0.85]) {
      segment(arms, [at(t, along, -BITE), at(t, along, style.stand - DEPTH + 0.02)], { profile: 'square', thickness: 0.12 });
    }
    // And a stiffener down the back between them.
    segment(arms, [at(middle - (t1 - t0) * 0.4, along, style.stand - DEPTH + 0.02), at(middle + (t1 - t0) * 0.4, along, style.stand - DEPTH + 0.02)], {
      profile: 'square',
      thickness: 0.1,
    });
  }
}
