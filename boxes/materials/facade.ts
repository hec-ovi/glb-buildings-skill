/**
 * The facade texture, written from code. A tile is a few floors tall and a few bays wide. Each
 * floor carries a band of glazing split into bays by the mullions between them, which is what a
 * curtain wall is, and the wall around it is near black so a tower reads as a silhouette with
 * lights in it rather than as a grey box.
 *
 * A few windows are lit, most are not, and the lit ones come back in the emissive map so they
 * glow. Seeded per building, so two towers never carry the same lights and a rebuild never
 * reshuffles the one you have. One 256 by 256 tile covers a whole building.
 */
import { png, type Pixels } from './png.ts';

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
};

export const FACADE_STYLE: FacadeStyle = {
  size: 256,
  across: 8,
  down: 4,
  bay: 3,
  pane: { left: 0.09, right: 0.91, top: 0.2, bottom: 0.62 },
  lit: 0.12,
  seed: 1,
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

/** Wall, the band under each window, the glass, and the few colours a lit window comes in. */
const WALL: Rgb = [13, 14, 17];
const SPANDREL: Rgb = [18, 19, 23];
const GLASS: Rgb = [7, 8, 11];
const SHEEN: Rgb = [21, 26, 34];
const LIGHTS: { colour: Rgb; weight: number }[] = [
  { colour: [255, 240, 212], weight: 9 },
  { colour: [255, 231, 186], weight: 4 },
  { colour: [226, 235, 255], weight: 1 },
];

type Rgb = [number, number, number];

function rng(seed: number): () => number {
  let state = (seed | 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One lit colour, mostly the warm white a room actually is. */
function lightColour(random: () => number): Rgb {
  const total = LIGHTS.reduce((sum, light) => sum + light.weight, 0);
  let roll = random() * total;
  for (const light of LIGHTS) {
    roll -= light.weight;
    if (roll <= 0) return light.colour;
  }
  return LIGHTS[0]!.colour;
}

type Window = { x0: number; x1: number; y0: number; y1: number; colour: Rgb; glow: boolean };

/**
 * Where every window sits in the tile. One band of glazing per floor, cut into bays: wide, low,
 * and the same on every floor, so the tile reads as a curtain wall rather than as dots.
 */
function windows(style: FacadeStyle): Window[] {
  const random = rng(style.seed);
  const found: Window[] = [];
  const bay = style.size / style.across;
  const floor = style.size / style.down;

  for (let row = 0; row < style.down; row++) {
    for (let column = 0; column < style.across; column++) {
      const on = random() < style.lit;
      found.push({
        x0: Math.round((column + style.pane.left) * bay),
        x1: Math.round((column + style.pane.right) * bay),
        y0: Math.round((row + style.pane.top) * floor),
        y1: Math.round((row + style.pane.bottom) * floor),
        colour: on ? lightColour(random) : GLASS,
        glow: on,
      });
    }
  }
  return found;
}

function paint(style: FacadeStyle, panes: Window[], emissive: boolean): Pixels {
  const { size } = style;
  const floor = size / style.down;
  const rgba = new Uint8Array(size * size * 4);

  const put = (x: number, y: number, colour: Rgb) => {
    const at = (y * size + x) * 4;
    rgba[at] = colour[0]!;
    rgba[at + 1] = colour[1]!;
    rgba[at + 2] = colour[2]!;
    rgba[at + 3] = 255;
  };

  for (let y = 0; y < size; y++) {
    // The wall, with the spandrel band that runs under each row of windows.
    const down = (y % floor) / floor;
    const base: Rgb = emissive ? [0, 0, 0] : down > style.pane.bottom && down < 0.94 ? SPANDREL : WALL;
    for (let x = 0; x < size; x++) put(x, y, base);
  }

  for (const pane of panes) {
    const height = Math.max(1, pane.y1 - pane.y0);
    for (let y = pane.y0; y < pane.y1; y++) {
      // Unlit glass catches a little sky at the top of the pane, which is what stops a dark
      // window reading as a hole cut in the wall.
      const sky = 1 - (y - pane.y0) / height;
      const colour: Rgb = emissive
        ? pane.glow
          ? pane.colour
          : [0, 0, 0]
        : pane.glow
          ? pane.colour
          : [
              Math.round(GLASS[0] + (SHEEN[0] - GLASS[0]) * sky * sky),
              Math.round(GLASS[1] + (SHEEN[1] - GLASS[1]) * sky * sky),
              Math.round(GLASS[2] + (SHEEN[2] - GLASS[2]) * sky * sky),
            ];
      for (let x = pane.x0; x < pane.x1; x++) put(x, y, colour);
    }
  }

  return { width: size, height: size, rgba };
}

export type FacadeTexture = { colour: Uint8Array; emissive: Uint8Array; lit: number };

/** One tile of facade: what it looks like, and what glows. */
export function facadeTexture(style: Partial<FacadeStyle> = {}): FacadeTexture {
  const settings = { ...FACADE_STYLE, ...style };
  const panes = windows(settings);
  return {
    colour: png(paint(settings, panes, false)),
    emissive: png(paint(settings, panes, true)),
    lit: panes.filter((pane) => pane.glow).length,
  };
}
