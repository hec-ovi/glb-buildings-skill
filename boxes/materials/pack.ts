/**
 * A pack: a folder of generated images that stands in for the drawn tiles, one folder per style.
 *
 * Nothing is required. A pack with one file in it overrides that one finish and everything else
 * falls back to the drawing, so a set can be generated a texture at a time and the build never
 * stops working. Where the folder is comes from the caller, never from a path baked in here.
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

export type Pack = {
  /** Where it was read from, so a verb can say where to put files. */
  dir: string;
  /** What it carries, for reporting. */
  finishes: string[];
  get(finish: string): Maps | undefined;
};

export const EMPTY_PACK: Pack = { dir: '', finishes: [], get: () => undefined };

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

  const colour = new Map<string, Bitmap>();
  const glow = new Map<string, Bitmap>();

  for (const name of names) {
    const ext = extname(name).toLowerCase();
    const mime = MIME[ext];
    if (!mime) continue;

    const stem = name.slice(0, -ext.length);
    const bytes = new Uint8Array(await readFile(join(dir, name)));
    if (stem.endsWith(EMISSIVE)) glow.set(stem.slice(0, -EMISSIVE.length), { bytes, mime });
    else colour.set(stem, { bytes, mime });
  }

  return {
    dir,
    finishes: [...colour.keys()].sort(),
    get(finish) {
      const base = colour.get(finish);
      if (!base) return undefined;
      const lit = glow.get(finish);
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
