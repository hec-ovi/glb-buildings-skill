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

export type Bitmap = { bytes: Uint8Array; mime: string };
export type Maps = { colour: Bitmap; emissive?: Bitmap };

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
  /** One finish, picking between its pictures with the building's own seed. */
  get(finish: string, seed?: number): Maps | undefined;
};

export const EMPTY_PACK: Pack = { dir: '', finishes: [], variants: {}, get: () => undefined };

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

/** One picture supplied for one thing, like the image on one screen. */
export async function loadImage(path: string): Promise<Bitmap> {
  const mime = MIME[extname(path).toLowerCase()];
  if (!mime) {
    throw new Error(`${path} is not a PNG or a JPEG, and glTF carries nothing else without an extension`);
  }
  return { bytes: new Uint8Array(await readFile(path)), mime };
}
