/**
 * A pack: a folder of generated images that stands in for the drawn tiles, one folder per style.
 *
 * Nothing is required. A pack with one file in it overrides that one finish and everything else
 * falls back to the drawing, so a set can be generated a texture at a time and the build never
 * stops working. Where the folder is comes from the caller, never from a path baked in here.
 *
 * A finish can carry several pictures, `facade_1.png` to `facade_4.png`, and a building picks one
 * of them from its own seed. That is what stops a street of towers wearing one wall.
 */
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { sizeOf, type Size } from './size.ts';

export type Bitmap = { bytes: Uint8Array; mime: string };
export type Maps = { colour: Bitmap; emissive?: Bitmap };

/**
 * How many bays across and floors down a wall picture actually holds.
 *
 * The kit draws its own tiles on an 8 by 4 grid, but a picture from an image model holds whatever
 * grid it felt like drawing. Declared here, the wall lays its UVs on the real one, so the windows
 * land on the floors instead of being sliced by them. `pack.json` beside the images:
 *
 *     { "facade": { "across": 10, "down": 3 }, "glass-band": { "across": 6, "down": 4 } }
 */
export type Grid = { across: number; down: number };

/**
 * How many metres of building one tile of a picture covers, where the picture is not a bay grid.
 * A wall of brick and a wall of three metre panels are both `wall`, and the only way to know
 * which is which is to be told: 21 courses of brick is 1.6 m, the same picture read as panels is
 * 3 m, and at the wrong one every brick comes out the size of a door.
 */
export type Scale = { metres: number };

/**
 * How far down to drop one picture, past what its family already does.
 *
 * Every dead surface drops to the family's own tint, because a photograph was exposed to be looked
 * at and a wall at night is not. One picture in a set can still come back two stops brighter than
 * the rest of it, and then one building in the street glows for no reason anybody can see. Rather
 * than regenerate it, the pack says what that picture needs: `{ "wall_2": { "dim": 0.45 } }`.
 */
export type Dim = { dim: number };

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/** `facade.png` is the colour map, `facade-emissive.png` is what glows. */
const EMISSIVE = '-emissive';

/** `facade_2` is the second picture of the facade. Without a number there is only the one. */
function split(stem: string): { finish: string; variant: number } {
  const found = /^(.+)_(\d+)$/.exec(stem);
  return found ? { finish: found[1]!, variant: Number(found[2]) } : { finish: stem, variant: 0 };
}

export type Pack = {
  /** Where it was read from, so a verb can say where to put files. */
  dir: string;
  /** What it carries, and how many pictures each one has. */
  finishes: string[];
  variants: Record<string, number>;
  /** How many of those pictures carry an emissive map, so a wall with no lights is countable. */
  lit: Record<string, number>;
  /**
   * What the pack says about its own pictures, under whatever key it said it: `facade` for every
   * picture of the facade, `facade_2` for that one alone. Two pictures of one finish need not hold
   * the same grid, so the picture's own key wins over the finish's.
   */
  grids: Record<string, Grid>;
  metres: Record<string, number>;
  dims: Record<string, number>;
  /**
   * The pictures in the folder's `ads/`, in name order. They are not finishes: one is given to one
   * screen, by path, so a tower carries an advertisement rather than a repeated tile.
   */
  ads: string[];
  /** One finish, picking between its pictures with the building's own seed. */
  get(finish: string, seed?: number): Maps | undefined;
  /** The grid the picture this seed picks actually holds, where the pack says so. */
  gridOf(finish: string, seed?: number): Grid | undefined;
  /** How many metres of building that picture covers, where the pack says so. */
  metresOf(finish: string, seed?: number): number | undefined;
  /** How far down that picture asks to be dropped, where the pack says so. */
  dimOf(finish: string, seed?: number): number | undefined;
};

export const EMPTY_PACK: Pack = {
  dir: '',
  finishes: [],
  variants: {},
  lit: {},
  grids: {},
  metres: {},
  dims: {},
  ads: [],
  get: () => undefined,
  gridOf: () => undefined,
  metresOf: () => undefined,
  dimOf: () => undefined,
};

/** The pictures in `<style>/ads/`, which are given to screens one at a time rather than tiled. */
async function readAds(dir: string): Promise<string[]> {
  try {
    const names = await readdir(join(dir, 'ads'));
    return names
      .filter((name) => MIME[extname(name).toLowerCase()] !== undefined)
      .sort()
      .map((name) => join(dir, 'ads', name));
  } catch {
    return [];
  }
}

/**
 * Read every image in a style's folder. glTF carries PNG and JPEG and nothing else without an
 * extension, so anything else in the folder is ignored rather than half supported.
 */
export async function loadPack(root: string, style: string): Promise<Pack> {
  const dir = join(root, style);

  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return { ...EMPTY_PACK, dir };
  }

  const colour = new Map<string, Map<number, Bitmap>>();
  const glow = new Map<string, Map<number, Bitmap>>();
  const declared = await readDeclared(dir);
  const ads = await readAds(dir);

  const keep = (into: Map<string, Map<number, Bitmap>>, stem: string, bitmap: Bitmap) => {
    const { finish, variant } = split(stem);
    const set = into.get(finish) ?? new Map<number, Bitmap>();
    set.set(variant, bitmap);
    into.set(finish, set);
  };

  for (const name of names) {
    const ext = extname(name).toLowerCase();
    const mime = MIME[ext];
    if (!mime) continue;

    const stem = name.slice(0, -ext.length);
    const bytes = new Uint8Array(await readFile(join(dir, name)));
    if (stem.endsWith(EMISSIVE)) keep(glow, stem.slice(0, -EMISSIVE.length), { bytes, mime });
    else keep(colour, stem, { bytes, mime });
  }

  // Same seed, same picture, every build; different buildings spread across what is there.
  const pickedBy = (finish: string, seed: number): number | undefined => {
    const set = colour.get(finish);
    if (!set) return undefined;
    const numbers = [...set.keys()].sort((a, b) => a - b);
    return numbers[Math.abs(seed) % numbers.length];
  };

  /** The picture's own key first, then the finish's, so a variant may hold its own grid. */
  const said = <T,>(from: Record<string, T>, finish: string, seed: number): T | undefined => {
    const variant = pickedBy(finish, seed);
    return (variant === undefined ? undefined : from[`${finish}_${variant}`]) ?? from[finish];
  };

  return {
    dir,
    finishes: [...colour.keys()].sort(),
    ads,
    variants: Object.fromEntries([...colour].map(([finish, set]) => [finish, set.size])),
    lit: Object.fromEntries([...colour].map(([finish, set]) => [finish, [...set.keys()].filter((n) => glow.get(finish)?.has(n)).length])),
    grids: declared.grids,
    metres: declared.metres,
    dims: declared.dims,
    get(finish, seed = 0) {
      const chosen = pickedBy(finish, seed);
      if (chosen === undefined) return undefined;
      const base = colour.get(finish)!.get(chosen)!;
      const lit = glow.get(finish)?.get(chosen);
      return lit ? { colour: base, emissive: lit } : { colour: base };
    },
    gridOf: (finish, seed = 0) => said(declared.grids, finish, seed),
    metresOf: (finish, seed = 0) => said(declared.metres, finish, seed),
    dimOf: (finish, seed = 0) => said(declared.dims, finish, seed),
  };
}

/**
 * What the pack says about its own pictures. Missing, unreadable or nonsense is the same answer:
 * nothing, and the kit falls back to the grid it draws its own tiles on.
 */
async function readDeclared(dir: string): Promise<{ grids: Record<string, Grid>; metres: Record<string, number>; dims: Record<string, number> }> {
  const nothing = { grids: {}, metres: {}, dims: {} };

  let text: string;
  try {
    text = await readFile(join(dir, 'pack.json'), 'utf8');
  } catch {
    return nothing;
  }

  try {
    const read = JSON.parse(text) as Record<string, Partial<Grid & Scale & Dim>>;
    const grids: Record<string, Grid> = {};
    const metres: Record<string, number> = {};
    const dims: Record<string, number> = {};
    for (const [finish, said] of Object.entries(read)) {
      const across = Math.round(Number(said?.across));
      const down = Math.round(Number(said?.down));
      if (across > 0 && down > 0) grids[finish] = { across, down };
      const covers = Number(said?.metres);
      if (covers > 0) metres[finish] = covers;
      const dim = Number(said?.dim);
      if (dim > 0 && dim <= 1) dims[finish] = dim;
    }
    return { grids, metres, dims };
  } catch {
    return nothing;
  }
}

/** One picture supplied for one thing, like the image on one screen, and how big it is. */
export async function loadImage(path: string): Promise<Bitmap & { size?: Size }> {
  const mime = MIME[extname(path).toLowerCase()];
  if (!mime) {
    throw new Error(`${path} is not a PNG or a JPEG, and glTF carries nothing else without an extension`);
  }
  const bytes = new Uint8Array(await readFile(path));
  const size = sizeOf(bytes);
  return { bytes, mime, ...(size ? { size } : {}) };
}
