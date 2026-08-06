/**
 * The facade texture, written from code. A tile is one floor tall and one bay wide, filled with
 * a grid of window cells: most dark, some lit, in the few tints a city at night actually shows.
 * The same grid comes back as an emissive map, so the lit ones glow and the rest stay flat.
 *
 * Seeded per building, so two towers never carry the same windows and a rebuild never reshuffles
 * the one you have. One 256 by 256 tile covers a whole building, which keeps a city cheap.
 */
import { png, type Pixels } from './png.ts';

export type FacadeStyle = {
  /** Pixels on a side. A tile repeats, so this is the whole texture. */
  size: number;
  /** Window cells across and down one tile. */
  across: number;
  down: number;
  /** How many windows are lit, 0 to 1. */
  lit: number;
  seed: number;
};

export const FACADE_STYLE: FacadeStyle = { size: 256, across: 6, down: 4, lit: 0.34, seed: 1 };

/** Wall, mullion, and the tints a lit window comes in. */
const WALL: [number, number, number] = [26, 27, 30];
const FRAME: [number, number, number] = [17, 18, 21];
const DARK: [number, number, number] = [11, 12, 15];
const LIGHTS: [number, number, number][] = [
  [255, 244, 214],
  [255, 226, 170],
  [206, 240, 255],
  [255, 250, 240],
  [255, 176, 120],
  [186, 255, 226],
];

function rng(seed: number): () => number {
  let state = (seed | 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Cell = { x0: number; x1: number; y0: number; y1: number; colour: [number, number, number]; glow: boolean };

/** Where every window sits in the tile, and whether its light is on. */
function grid(style: FacadeStyle): Cell[] {
  const random = rng(style.seed);
  const cells: Cell[] = [];
  const cellW = style.size / style.across;
  const cellH = style.size / style.down;
  const insetX = cellW * 0.22;
  const insetY = cellH * 0.26;

  for (let row = 0; row < style.down; row++) {
    for (let column = 0; column < style.across; column++) {
      const on = random() < style.lit;
      const colour = on ? LIGHTS[Math.floor(random() * LIGHTS.length)]! : DARK;
      cells.push({
        x0: Math.round(column * cellW + insetX),
        x1: Math.round((column + 1) * cellW - insetX),
        y0: Math.round(row * cellH + insetY),
        y1: Math.round((row + 1) * cellH - insetY),
        colour,
        glow: on,
      });
    }
  }
  return cells;
}

function paint(style: FacadeStyle, cells: Cell[], emissive: boolean): Pixels {
  const { size } = style;
  const rgba = new Uint8Array(size * size * 4);

  // The wall, with a faint band at every floor line so the tile reads as storeys.
  for (let y = 0; y < size; y++) {
    const line = y % Math.round(size / style.down) < 2;
    for (let x = 0; x < size; x++) {
      const base = emissive ? [0, 0, 0] : line ? FRAME : WALL;
      const at = (y * size + x) * 4;
      rgba[at] = base[0]!;
      rgba[at + 1] = base[1]!;
      rgba[at + 2] = base[2]!;
      rgba[at + 3] = 255;
    }
  }

  for (const cell of cells) {
    const colour = emissive ? (cell.glow ? cell.colour : [0, 0, 0]) : cell.colour;
    for (let y = cell.y0; y < cell.y1; y++) {
      for (let x = cell.x0; x < cell.x1; x++) {
        const at = (y * size + x) * 4;
        rgba[at] = colour[0]!;
        rgba[at + 1] = colour[1]!;
        rgba[at + 2] = colour[2]!;
        rgba[at + 3] = 255;
      }
    }
  }

  return { width: size, height: size, rgba };
}

export type FacadeTexture = { colour: Uint8Array; emissive: Uint8Array; lit: number };

/** One tile of facade: what it looks like, and what glows. */
export function facadeTexture(style: Partial<FacadeStyle> = {}): FacadeTexture {
  const settings = { ...FACADE_STYLE, ...style };
  const cells = grid(settings);
  return {
    colour: png(paint(settings, cells, false)),
    emissive: png(paint(settings, cells, true)),
    lit: cells.filter((cell) => cell.glow).length,
  };
}
