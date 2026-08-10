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
  /**
   * The shape of the picture it carries, width over height. The panel is fitted to it inside the
   * space it was given, centred, so a picture is never stretched to fill a span that is the wrong
   * shape. Floors are whole and pictures are not, which is why this cannot be left to the caller.
   */
  aspect?: number;
};

/**
 * How thick the panel is. A screen is a plane hanging in the air, not a crate: thin enough to read
 * as one, thick enough to still be a closed solid with every proof the kit makes about it intact.
 */
const DEPTH = 0.06;
const BITE = 0.05;

/** How far in front of the picture the dotted glass sits, and what it is made of. */
const GLASS_GAP = 0.03;
const GLASS = 'screen-glass';

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
  const face = kit.get(style.material);

  // The space it was given: whole floors up, and a share of the face across.
  const span = { t0: from / floors, t1: (to + 1) / floors, left, right };
  const ring = shape.bottom;
  const a = ring[edge]!;
  const b = ring[(edge + 1) % ring.length]!;
  const faceLength = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;

  // Fitted to the picture inside that space, centred. A span is whole floors and a picture is
  // whatever shape it is, so without this the picture is stretched to whatever the floors gave it.
  if (style.aspect && style.aspect > 0) {
    const wide = (span.right - span.left) * faceLength;
    const tall = (span.t1 - span.t0) * shape.height;
    if (wide / tall > style.aspect) {
      const want = (tall * style.aspect) / faceLength;
      const middle = (span.left + span.right) / 2;
      span.left = middle - want / 2;
      span.right = middle + want / 2;
    } else {
      const want = wide / style.aspect / shape.height;
      const middle = (span.t0 + span.t1) / 2;
      span.t0 = middle - want / 2;
      span.t1 = middle + want / 2;
    }
  }
  const { t0, t1 } = span;

  const at = (t: number, along: number, out: number): Vec => facePoint(shape, t, edge, along, out);
  const corners = (out: number): [Vec, Vec, Vec, Vec] => [at(t0, span.left, out), at(t0, span.right, out), at(t1, span.right, out), at(t1, span.left, out)];

  const back = corners(style.stand - DEPTH);
  const front = corners(style.stand);

  // The picture, then the rest of the box round it.
  face.quad(front[0], front[1], front[2], front[3], FULL);
  face.quad(back[3], back[2], back[1], back[0]);
  face.quad(back[0], back[1], front[1], front[0]);
  face.quad(back[1], back[2], front[2], front[1]);
  face.quad(back[2], back[3], front[3], front[2]);
  face.quad(back[3], back[0], front[0], front[3]);

  // The dotted glass in front of it. This is what makes a lit rectangle read as a screen: the
  // grid of lamps behind the glass, at the same size on a screen of any size. It carries no
  // picture of its own, so it tiles by the metre and the dots stay put.
  const lens = kit.get(GLASS);
  const outer = corners(style.stand + GLASS_GAP + DEPTH);
  const inner = corners(style.stand + GLASS_GAP);
  lens.quad(outer[0], outer[1], outer[2], outer[3]);
  lens.quad(inner[3], inner[2], inner[1], inner[0]);
  lens.quad(inner[0], inner[1], outer[1], outer[0]);
  lens.quad(inner[1], inner[2], outer[2], outer[1]);
  lens.quad(inner[2], inner[3], outer[3], outer[2]);
  lens.quad(inner[3], inner[0], outer[0], outer[3]);

  // Two brackets back to the wall, so the panel is held up by something.
  const arms = kit.get(METAL);
  const middle = (t0 + t1) / 2;
  const reach = span.right - span.left;
  for (const along of [span.left + reach * 0.2, span.right - reach * 0.2]) {
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
