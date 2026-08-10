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
  /** The grid each wall picture actually holds, where the pack says so. */
  grids: Record<string, Grid>;
  /** One finish, picking between its pictures with the building's own seed. */
  get(finish: string, seed?: number): Maps | undefined;
};

export const EMPTY_PACK: Pack = { dir: '', finishes: [], variants: {}, grids: {}, get: () => undefined };

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
  const grids = await readGrids(dir);

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

  return {
    dir,
    finishes: [...colour.keys()].sort(),
    variants: Object.fromEntries([...colour].map(([finish, set]) => [finish, set.size])),
    grids,
    get(finish, seed = 0) {
      const set = colour.get(finish);
      if (!set) return undefined;

      // Same seed, same picture, every build; different buildings spread across what is there.
      const numbers = [...set.keys()].sort((a, b) => a - b);
      const chosen = numbers[Math.abs(seed) % numbers.length]!;
      const base = set.get(chosen)!;
      const lit = glow.get(finish)?.get(chosen);
      return lit ? { colour: base, emissive: lit } : { colour: base };
    },
  };
}

/**
 * What the pack says about its own pictures. Missing, unreadable or nonsense is the same answer:
 * nothing, and the kit falls back to the grid it draws its own tiles on.
 */
async function readGrids(dir: string): Promise<Record<string, Grid>> {
  let text: string;
  try {
    text = await readFile(join(dir, 'pack.json'), 'utf8');
  } catch {
    return {};
  }

  try {
    const read = JSON.parse(text) as Record<string, Partial<Grid>>;
    const found: Record<string, Grid> = {};
    for (const [finish, grid] of Object.entries(read)) {
      const across = Math.round(Number(grid?.across));
      const down = Math.round(Number(grid?.down));
      if (across > 0 && down > 0) found[finish] = { across, down };
    }
    return found;
  } catch {
    return {};
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
