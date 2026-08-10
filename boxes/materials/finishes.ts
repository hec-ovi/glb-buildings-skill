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
import { drawWall } from './templates/wall.ts';
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
export const FINISHES: string[] = [...PAINTS, 'facade', 'wall', 'base', 'glass', 'glass-band', 'screen-glass', 'beacon', 'roof'];

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
  /**
   * How much light it throws, where one is as bright as a surface can be without saying so. A
   * screen and a neon tube are sources, not surfaces catching the sun, and at one they sit level
   * with a white wall in daylight instead of lighting the air around them.
   */
  glow: number;
  /**
   * How much of its picture's brightness this surface keeps, 0 to 1. A dead material is dropped
   * back so the lit ones read; anything that is itself a light keeps all of it.
   */
  tint: number;
  /** One picture per element, instead of tiling by the metre. */
  fit: boolean;
  /**
   * Fills the height and repeats along the length. A balustrade is drawn once with its rail at
   * the top and its balusters under it: fitted to each face it comes out at a different baluster
   * pitch on a 4 m front and a 1.4 m side, and tiled both ways the rail lands anywhere.
   */
  band: boolean;
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
  /** Keeps all of its picture's brightness: it is a light, not a surface lit by one. */
  bright?: boolean;
  /** Past one, how much light it throws. */
  glow?: number;
  /**
   * Drawn as a grid of window bays, so a wall lays it one bay across and one floor up. Everything
   * else is a material and tiles by the metre: brick laid on a bay grid comes out with every
   * course a metre deep.
   */
  grid?: boolean;
  fit?: boolean;
  band?: boolean;
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
    grid: true,
    draws: facade,
  },

  wall: {
    colour: (style) => look(style).wall,
    metallic: 0,
    roughness: 0.9,
    tile: 3,
    draws: { key: 'wall', draw: (style, seed) => drawWall(look(style), seed) },
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
    grid: true,
    draws: facade,
  },
  'glass-band': {
    colour: (style) => look(style).glass,
    metallic: 0.2,
    roughness: 0.15,
    bright: true,
    emissive: () => WHITE,
    glow: 1.8,
    tile: 3,
    grid: true,
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
    band: true,
    tile: 2,
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
    // Just past one. An ad is a photograph that was already exposed to be looked at, and a wall in
    // this family sits at a third of that, so barely over one is already the brightest thing in
    // view. Push it further and the midtones of the picture clip: the face, the drink and the
    // lettering all go to the same white and one ad stops being distinguishable from the next.
    glow: 1.35,
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
    // A line is a thin tube read from the street, not a sign. Past this it stops being a line and
    // becomes a smear, and it starts competing with the screens, which are the loud thing.
    glow: 1.5,
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
    glow: 4,
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

/** Whether a wall lays this one out as bays and floors, rather than tiling it by the metre. */
export function gridded(name: string): boolean {
  return RECIPES[splitName(name).base]?.grid ?? false;
}

/** Whether it fills the height and repeats along the length, the way a balustrade does. */
export function bands(name: string): boolean {
  return RECIPES[splitName(name).base]?.band ?? false;
}

/**
 * Whether this finish carries a picture at all. A light does not: `neon` and `beacon` are a flat
 * colour emitting that colour, so a generated image of one sits in the folder and is never read.
 */
export function pictured(name: string): boolean {
  return RECIPES[splitName(name).base]?.draws !== undefined;
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

  // The flat colour drops with the same tint, so plain mode and textured mode read the same.
  const shade = recipe.bright || recipe.lit ? 1 : sheet(at.style).dim;
  const raw = colour ?? recipe.colour(at.style);
  const flat: Rgb = colour ? raw : [raw[0] * shade, raw[1] * shade, raw[2] * shade];
  const emissive = recipe.emissive ? unit(colour ?? recipe.emissive(at.style)) : undefined;
  const made: Finish = {
    colour: unit(flat),
    metallic: recipe.metallic,
    roughness: recipe.roughness,
    ...(emissive ? { emissive } : {}),
    lit: recipe.lit ?? false,
    alpha: recipe.alpha ?? 1,
    glow: recipe.glow ?? 1,
    tint: shade,
    fit: recipe.fit ?? false,
    band: recipe.band ?? false,
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
