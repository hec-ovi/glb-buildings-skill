/**
 * The finish library: what every named surface looks like.
 *
 * A finish is a flat colour and, in `textured` mode, a picture. `plain` mode carries no images at
 * all, so the file is a set of named colour slots an engine drops its own materials onto, and the
 * same building can be built either way without touching its geometry.
 *
 * A name may carry a colour: `neon:cyan`, `beacon:red`, `neon:#ff2f88`. The picture stays the one
 * white tile and the colour tints it, so a tower can run six colours of line for one texture.
 */
import type { Drawing, Rgb } from './paint.ts';
import { sheet, type Style } from './styles.ts';
import { EMPTY_PACK, type Bitmap, type Maps, type Pack } from './pack.ts';
import { drawAntenna } from './templates/antenna.ts';
import { drawBalcony } from './templates/balcony.ts';
import { drawBase } from './templates/base.ts';
import { drawConcrete } from './templates/concrete.ts';
import { drawDoor } from './templates/door.ts';
import { drawFacade } from './templates/facade.ts';
import { drawGlassBand } from './templates/glassband.ts';
import { drawMetal } from './templates/metal.ts';
import { drawPipe } from './templates/pipe.ts';
import { drawRoof } from './templates/roof.ts';
import { drawScreen } from './templates/screen.ts';
import { drawScreenGlass } from './templates/screenglass.ts';
import { drawWindow } from './templates/window.ts';

export const MODES = ['textured', 'plain'] as const;
export type Mode = (typeof MODES)[number];

export const MODE_NOTES: Record<Mode, string> = {
  textured: 'the file carries its pictures: windows, concrete, neon, screens',
  plain: 'no pictures at all, every part a named flat colour an engine can replace',
};

/** The finishes a face element, a run or a line can be given by name. */
export const PAINTS = ['window', 'concrete', 'metal', 'screen', 'pipe', 'antenna', 'door', 'balcony', 'neon'] as const;
export type PaintName = (typeof PAINTS)[number];

export const PAINT_NOTES: Record<PaintName, string> = {
  window: 'glazing: a framed pane with a mullion, what a window is made of',
  concrete: 'a flat cast panel: cladding, a slab, a dead wall',
  metal: 'plate: shutters, louvres, housings',
  screen: 'a lit screen, for signs and video walls',
  pipe: 'painted service pipe, with a flange and a marking band',
  antenna: 'galvanised steel with an aviation band, for masts and dishes',
  door: 'a door leaf, glazed over a solid panel, lit from the lobby behind it',
  balcony: 'a balustrade: a rail and the balusters under it',
  neon: 'a lit tube in a housing. Give it a colour: neon:cyan, neon:#ff2f88',
};

/** The rest of the library, which geometry names for itself. */
export const FINISHES: string[] = [...PAINTS, 'facade', 'base', 'glass', 'glass-band', 'screen-glass', 'beacon', 'roof'];

/** Colours a finish can be tinted with, and anything else as #rrggbb. */
const COLOURS: Record<string, Rgb> = {
  white: [255, 255, 255],
  cyan: [110, 250, 240],
  teal: [60, 220, 200],
  green: [110, 245, 140],
  blue: [90, 150, 255],
  magenta: [255, 90, 220],
  pink: [255, 130, 190],
  red: [255, 70, 55],
  orange: [255, 140, 50],
  amber: [255, 190, 90],
  yellow: [255, 230, 110],
};

export const COLOUR_NAMES: string[] = Object.keys(COLOURS);

const unit = (colour: Rgb): [number, number, number] => [colour[0] / 255, colour[1] / 255, colour[2] / 255];

/** `neon:cyan` is the neon finish in cyan. Anything without a colon is just itself. */
export function splitName(name: string): { base: string; colour?: Rgb } {
  const at = name.indexOf(':');
  if (at < 0) return { base: name };

  const base = name.slice(0, at);
  const asked = name.slice(at + 1).toLowerCase();
  const named = COLOURS[asked];
  if (named) return { base, colour: named };

  const hex = /^#?([0-9a-f]{6})$/.exec(asked);
  if (!hex) return { base };
  const value = Number.parseInt(hex[1]!, 16);
  return { base, colour: [(value >> 16) & 255, (value >> 8) & 255, value & 255] };
}

export type Finish = {
  /** The flat colour. In plain mode it is the whole material. */
  colour: [number, number, number];
  metallic: number;
  roughness: number;
  /** What it gives off. A finish with an emissive map uses this as the tint on it. */
  emissive?: [number, number, number];
  /** The whole surface is the light, rather than the few places an emissive map names. */
  lit: boolean;
  /** How solid it is. Under 1 the file blends it, so what is behind shows through. */
  alpha: number;
  /** One picture per element, instead of tiling by the metre. */
  fit: boolean;
  /** Metres of surface one tile covers, when it tiles. */
  tile: number;
  /** The picture, in textured mode: what to call it, and how to get it. */
  image?: { key: string; load(): Maps };
};

type Recipe = {
  colour: (style: Style) => Rgb;
  metallic: number;
  roughness: number;
  emissive?: (style: Style) => Rgb;
  /**
   * The whole surface is the light: a neon tube, a screen, a beacon lens. Everything else glows
   * only where its emissive map says so, which is a few windows in a dark wall.
   */
  lit?: boolean;
  /** Under 1 makes it see-through: a screen, and the dotted glass over one. */
  alpha?: number;
  fit?: boolean;
  tile?: number;
  /** The tile this finish draws, and the name it is shared under. */
  draws?: { key: string; draw: (style: Style, seed: number) => Drawing };
};

const WHITE: Rgb = [255, 255, 255];
const look = (style: Style) => sheet(style);

/** Facade and glass are two materials over one picture, so a file carries it once. */
const facade = { key: 'facade', draw: (style: Style, seed: number) => drawFacade(look(style), seed) };

const RECIPES: Record<string, Recipe> = {
  facade: {
    colour: (style) => look(style).wall,
    metallic: 0,
    roughness: 0.85,
    emissive: () => WHITE,
    tile: 3,
    draws: facade,
  },
  base: {
    colour: (style) => look(style).concrete,
    metallic: 0,
    roughness: 0.9,
    tile: 3,
    draws: { key: 'base', draw: (style, seed) => drawBase(look(style), seed) },
  },
  glass: {
    colour: (style) => look(style).glass,
    metallic: 0.25,
    roughness: 0.12,
    emissive: () => WHITE,
    tile: 3,
    draws: facade,
  },
  'glass-band': {
    colour: (style) => look(style).glass,
    metallic: 0.2,
    roughness: 0.15,
    emissive: () => WHITE,
    tile: 3,
    draws: { key: 'glass-band', draw: (style, seed) => drawGlassBand(look(style), seed) },
  },
  window: {
    colour: (style) => look(style).glass,
    metallic: 0.25,
    roughness: 0.12,
    fit: true,
    draws: { key: 'window', draw: (style, seed) => drawWindow(look(style), seed) },
  },
  door: {
    colour: (style) => look(style).door,
    metallic: 0.1,
    roughness: 0.6,
    emissive: () => WHITE,
    fit: true,
    draws: { key: 'door', draw: (style, seed) => drawDoor(look(style), seed) },
  },
  balcony: {
    colour: (style) => look(style).rail,
    metallic: 0.25,
    roughness: 0.55,
    fit: true,
    draws: { key: 'balcony', draw: (style, seed) => drawBalcony(look(style), seed) },
  },
  concrete: {
    colour: (style) => look(style).concrete,
    metallic: 0,
    roughness: 0.9,
    tile: 3,
    draws: { key: 'concrete', draw: (style, seed) => drawConcrete(look(style), seed) },
  },
  metal: {
    colour: (style) => look(style).metal,
    metallic: 0.6,
    roughness: 0.45,
    tile: 1.5,
    draws: { key: 'metal', draw: (style, seed) => drawMetal(look(style), seed) },
  },
  pipe: {
    colour: (style) => look(style).pipe,
    metallic: 0.5,
    roughness: 0.5,
    tile: 1,
    draws: { key: 'pipe', draw: (style, seed) => drawPipe(look(style), seed) },
  },
  antenna: {
    colour: (style) => look(style).antenna,
    metallic: 0.7,
    roughness: 0.35,
    tile: 0.6,
    draws: { key: 'antenna', draw: (style, seed) => drawAntenna(look(style), seed) },
  },
  roof: {
    colour: (style) => look(style).roof,
    metallic: 0,
    roughness: 0.95,
    tile: 3,
    draws: { key: 'roof', draw: (style, seed) => drawRoof(look(style), seed) },
  },
  screen: {
    colour: () => [10, 10, 12],
    metallic: 0,
    roughness: 0.35,
    emissive: (style) => look(style).screen,
    lit: true,
    // A screen on a tower is a light hanging in the air, and the city shows through it a little.
    alpha: 0.88,
    fit: true,
    draws: { key: 'screen', draw: (style, seed) => drawScreen(look(style), seed) },
  },
  // A neon run and a beacon lens are lights, not surfaces. A picture of a tube only dulls them:
  // flat colour, emitting the same colour, is brighter and reads better at every distance.
  neon: {
    colour: (style) => look(style).neon,
    metallic: 0,
    roughness: 0.3,
    emissive: (style) => look(style).neon,
    lit: true,
    tile: 1,
  },
  'screen-glass': {
    colour: () => [0, 0, 0],
    metallic: 0,
    roughness: 0.25,
    alpha: 1,
    tile: 1,
    draws: { key: 'screen-glass', draw: () => drawScreenGlass() },
  },
  beacon: {
    colour: () => [255, 70, 55],
    metallic: 0,
    roughness: 0.3,
    emissive: () => [255, 70, 55],
    lit: true,
    fit: true,
  },
};

export function known(name: string): boolean {
  return RECIPES[splitName(name).base] !== undefined;
}

/** How many metres of surface one tile of this finish covers. */
export function tileOf(name: string): number {
  return RECIPES[splitName(name).base]?.tile ?? 3;
}

/** Whether one picture covers one whole element, rather than tiling by the metre. */
export function fits(name: string): boolean {
  return RECIPES[splitName(name).base]?.fit ?? false;
}

export type Look = {
  mode: Mode;
  style: Style;
  seed: number;
  /** Generated images that stand in for the drawn tiles. */
  pack?: Pack;
};

const asBitmap = (bytes: Uint8Array): Bitmap => ({ bytes, mime: 'image/png' });

/** What one named surface is, under one look. */
export function finish(name: string, at: Look): Finish | undefined {
  const { base, colour } = splitName(name);
  const recipe = RECIPES[base];
  if (!recipe) return undefined;

  const flat = colour ?? recipe.colour(at.style);
  const emissive = recipe.emissive ? unit(colour ?? recipe.emissive(at.style)) : undefined;
  const made: Finish = {
    colour: unit(flat),
    metallic: recipe.metallic,
    roughness: recipe.roughness,
    ...(emissive ? { emissive } : {}),
    lit: recipe.lit ?? false,
    alpha: recipe.alpha ?? 1,
    fit: recipe.fit ?? false,
    tile: recipe.tile ?? 3,
  };

  if (at.mode === 'plain' || !recipe.draws) return made;

  const { key, draw } = recipe.draws;
  const pack = at.pack ?? EMPTY_PACK;
  made.image = {
    key,
    load: () => {
      const supplied = pack.get(key, at.seed);
      if (supplied) return supplied;
      const drawn = draw(at.style, at.seed);
      return { colour: asBitmap(drawn.colour), ...(drawn.emissive ? { emissive: asBitmap(drawn.emissive) } : {}) };
    },
  };
  return made;
}
