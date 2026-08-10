/**
 * The wall tile: a few floors tall and a few bays wide, repeated up and across a section.
 *
 * Each floor carries a band of glazing split into bays by the mullions between them, which is what
 * a curtain wall is, and what a punched window in a brick wall is with different colours in it.
 * Some windows are lit, most are not, and the lit ones come back in the emissive map so they glow.
 *
 * No two lit windows are the same: colour, brightness and how much of the pane is lit are all
 * drawn per window, so a wall reads as a hundred rooms rather than a pattern.
 */
import { Canvas, mix, rng, tint, type Drawing, type Rgb } from '../paint.ts';
import { lightColour, sheet, type StyleSheet } from '../styles.ts';

export type FacadeStyle = {
  /** Pixels on a side. A tile repeats, so this is the whole texture. */
  size: number;
  /** Bays across and floors down one tile. */
  across: number;
  down: number;
  /** How wide one bay is on the building, in metres. This is what maps the tile onto a wall. */
  bay: number;
  /**
   * Where the glazing sits in one cell of the tile: across the bay from `left` to `right`, and
   * down from the top of the floor from `top` to `bottom`. Geometry that gives a window real
   * depth is built to these same numbers, so drawn glass and cut glass are the same window.
   */
  pane: { left: number; right: number; top: number; bottom: number };
  /** How many windows are lit, 0 to 1. */
  lit: number;
  seed: number;
  /** The family this wall belongs to. */
  look: StyleSheet;
};

export const FACADE_STYLE: FacadeStyle = {
  size: 256,
  across: 8,
  down: 4,
  bay: 3,
  pane: { left: 0.09, right: 0.91, top: 0.2, bottom: 0.62 },
  lit: 0.12,
  seed: 1,
  look: sheet('modern'),
};

/**
 * A point of plain wall on the tile, above the first window. Anything that is not a window takes
 * its colour from here: a column, a panel, a balcony, the underside of a section. Sampled at
 * real-world scale instead, a solid part shows slices of somebody's windows.
 */
export const FACADE_WALL: { u: number; v: number } = {
  u: 0.5 / FACADE_STYLE.across,
  v: (FACADE_STYLE.pane.top / 2) / FACADE_STYLE.down,
};

/** How much of a pane is lit, when it is not all of it. A room with one lamp on in the corner. */
const PARTS: { x0: number; x1: number; y0: number; y1: number }[] = [
  { x0: 0, x1: 0.5, y0: 0, y1: 1 },
  { x0: 0.5, x1: 1, y0: 0, y1: 1 },
  { x0: 0, x1: 1, y0: 0, y1: 0.45 },
  { x0: 0, x1: 1, y0: 0.55, y1: 1 },
  { x0: 0.25, x1: 0.75, y0: 0, y1: 1 },
  { x0: 0, x1: 0.34, y0: 0, y1: 1 },
];

type Window = {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  colour: Rgb;
  glow: boolean;
  /** The lit part of the pane, in pixels. The rest of it stays dark glass. */
  on: { x0: number; x1: number; y0: number; y1: number };
};

/**
 * Where every window sits in the tile. One band of glazing per floor, cut into bays: wide, low,
 * and the same on every floor, so the tile reads as a wall rather than as dots.
 */
function windows(style: FacadeStyle): Window[] {
  const random = rng(style.seed);
  const found: Window[] = [];
  const bay = style.size / style.across;
  const floor = style.size / style.down;

  for (let row = 0; row < style.down; row++) {
    for (let column = 0; column < style.across; column++) {
      const glow = random() < style.lit;
      const x0 = Math.round((column + style.pane.left) * bay);
      const x1 = Math.round((column + style.pane.right) * bay);
      const y0 = Math.round((row + style.pane.top) * floor);
      const y1 = Math.round((row + style.pane.bottom) * floor);

      // Brightness varies by three stops between one room and the next, which is most of what
      // stops a lit wall reading as a printed pattern.
      const colour = glow ? tint(lightColour(style.look, random), 0.35 + random() * 0.65) : style.look.glass;
      const part = glow && random() < style.look.partial ? PARTS[Math.floor(random() * PARTS.length)]! : undefined;

      found.push({
        x0,
        x1,
        y0,
        y1,
        colour,
        glow,
        on: part
          ? {
              x0: Math.round(x0 + (x1 - x0) * part.x0),
              x1: Math.round(x0 + (x1 - x0) * part.x1),
              y0: Math.round(y0 + (y1 - y0) * part.y0),
              y1: Math.round(y0 + (y1 - y0) * part.y1),
            }
          : { x0, x1, y0, y1 },
      });
    }
  }
  return found;
}

function paint(style: FacadeStyle, panes: Window[], emissive: boolean): Canvas {
  const look = style.look;
  const canvas = new Canvas(style.size, style.size, emissive ? [0, 0, 0] : look.wall);
  const floor = style.size / style.down;
  const random = rng(style.seed ^ 0x5bd1);

  if (!emissive) {
    // The band under each row of windows, and the floor line over it.
    for (let row = 0; row < style.down; row++) {
      const top = Math.round((row + style.pane.bottom) * floor);
      canvas.band(top, Math.round(floor * (0.94 - style.pane.bottom)), look.spandrel);
    }
    canvas.grain(random, 0.06 + look.wear * 0.14);
    // Weather runs down a wall from whatever sticks out of it, and there is always something.
    const streaks = Math.round(look.wear * 10);
    for (let i = 0; i < streaks; i++) {
      canvas.streak(Math.floor(random() * style.size), 2 + Math.floor(random() * 5), look.grime, 0.25 + random() * 0.4, Math.floor(random() * style.size), style.size);
    }
  }

  for (const pane of panes) {
    const height = Math.max(1, pane.y1 - pane.y0);
    for (let y = pane.y0; y < pane.y1; y++) {
      for (let x = pane.x0; x < pane.x1; x++) {
        const inside = x >= pane.on.x0 && x < pane.on.x1 && y >= pane.on.y0 && y < pane.on.y1;
        if (emissive) {
          canvas.pixel(x, y, pane.glow && inside ? pane.colour : [0, 0, 0]);
          continue;
        }
        if (pane.glow && inside) {
          canvas.pixel(x, y, pane.colour);
          continue;
        }
        // Unlit glass catches a little sky at the top of the pane, which is what stops a dark
        // window reading as a hole cut in the wall.
        const sky = 1 - (y - pane.y0) / height;
        canvas.pixel(x, y, mix(look.glass, look.sheen, sky * sky));
      }
    }
  }

  return canvas;
}

export type FacadeTexture = { colour: Uint8Array; emissive: Uint8Array; lit: number };

/** One tile of wall: what it looks like, and what glows. */
export function facadeTexture(style: Partial<FacadeStyle> = {}): FacadeTexture {
  const settings = { ...FACADE_STYLE, ...style };
  const panes = windows(settings);
  return {
    colour: paint(settings, panes, false).bytes(),
    emissive: paint(settings, panes, true).bytes(),
    lit: panes.filter((pane) => pane.glow).length,
  };
}

/** The wall, for the finish library: the same tile, both maps. */
export function drawFacade(look: StyleSheet, seed: number): Drawing {
  const drawn = facadeTexture({ seed, look, lit: look.lit });
  return { colour: drawn.colour, emissive: drawn.emissive };
}
