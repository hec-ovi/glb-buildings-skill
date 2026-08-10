/**
 * Putting a picture into a style's pack.
 *
 * A pack is a folder of images named after the finishes, and anything it carries stands in for the
 * tile the kit draws. Generating one is the easy half; the half that goes wrong is the naming, the
 * emissive pairing and saying what grid the picture actually holds. This verb does those three, so
 * whoever made the image only has to say which finish it is for.
 */
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { gridded, known, loadImage, loadPack, pictured, STYLES } from '#materials';
import { BuildingError } from '#spec';
import type { Verb } from './verb.ts';
import { count, maybeOneOf, need, parse, text } from './args.ts';

/** `facade_2.jpg` is the second picture of the facade. The next free number after the ones there. */
async function nextVariant(dir: string, finish: string): Promise<number> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return 1;
  }
  const taken = names
    .map((name) => new RegExp(`^${finish}_(\\d+)(-emissive)?\\.(png|jpe?g)$`, 'i').exec(name))
    .map((found) => (found ? Number(found[1]) : 0));
  return Math.max(0, ...taken) + 1;
}

/**
 * Merge what this picture holds into `pack.json`, keeping what every other picture said.
 *
 * Declared under the picture's own key, `facade_2` rather than `facade`, because two pictures of
 * one finish need not hold the same grid. A key naming the finish alone still covers the ones that
 * say nothing for themselves, which is how a hand written pack works.
 */
async function declare(dir: string, key: string, said: { across: number; down: number } | { metres: number }): Promise<void> {
  const file = join(dir, 'pack.json');
  let all: Record<string, unknown> = {};
  try {
    all = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
  } catch {
    all = {};
  }
  all[key] = said;
  await writeFile(file, `${JSON.stringify(all, undefined, 2)}\n`);
}

export const addTexture: Verb = {
  name: 'add-texture',
  summary: 'put a generated picture into a style pack, named and declared so the build reads it',
  usage: 'add-texture <finish> [file] [--emissive file] [--across 8 --down 4] [--metres 1.6] [--style cyber] [--as 2]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, {
      emissive: { type: 'string' },
      across: { type: 'string' },
      down: { type: 'string' },
      metres: { type: 'string' },
      style: { type: 'string' },
      as: { type: 'string' },
    });

    const finish = need(positionals, 0, 'finish name');
    // No file is the other job this verb does: say what a picture already in the pack holds,
    // which is what you want once you have counted its bays, or when it was dropped in by hand.
    const picture = positionals[1];

    if (!known(finish)) {
      throw new BuildingError('E_DOC_INVALID', `no finish named ${finish}. Run \`buildings face <section>\` to see the ones a part can be given`, ['finish', finish]);
    }
    // A light is a flat colour emitting that colour. A picture of a tube would sit in the folder
    // and never be read, so say that here rather than let it look installed.
    if (!pictured(finish)) {
      throw new BuildingError('E_DOC_INVALID', `${finish} is a light: a flat colour emitting that colour, so no picture of one is ever read. Give a line its colour instead, \`--colour cyan\``, ['finish', finish]);
    }

    // The style comes from the building being edited, so filling its pack is one word.
    let style = maybeOneOf(text(values.style), STYLES, 'style');
    if (!style) {
      const { project } = await projects.open();
      style = (await project.readDocument()).style;
    }

    const dir = join(projects.textures, style);
    await mkdir(dir, { recursive: true });

    const asked = count(values.as, 'as');
    const across = count(values.across, 'across');
    const down = count(values.down, 'down');
    const metres = text(values.metres) ? Number(text(values.metres)) : undefined;
    let declared: { across: number; down: number } | { metres: number } | undefined;
    if (across && down) declared = { across, down };
    else if (metres && metres > 0) declared = { metres };

    if (!picture && (asked === undefined || !declared)) {
      throw new BuildingError(
        'E_DOC_INVALID',
        'give an image file to install, or say which picture you are declaring and what it holds: `--as 5 --across 8 --down 4`',
        ['add-texture'],
      );
    }

    const variant = asked ?? (await nextVariant(dir, finish));
    const already = await loadPack(projects.textures, style);
    if (!picture && !already.finishes.includes(finish)) {
      throw new BuildingError('E_DOC_INVALID', `${style} carries no ${finish} picture to declare. Install one first`, ['finish', finish]);
    }

    let name: string | undefined;
    let glow: string | undefined;
    let pixels: string | undefined;
    if (picture) {
      const image = await loadImage(picture);
      pixels = image.size ? `${image.size.width} x ${image.size.height}` : undefined;
      name = `${finish}_${variant}${extname(picture).toLowerCase()}`;
      if (resolve(picture) !== resolve(join(dir, name))) await copyFile(picture, join(dir, name));

      const lit = text(values.emissive);
      if (lit) {
        await loadImage(lit);
        glow = `${finish}_${variant}-emissive${extname(lit).toLowerCase()}`;
        if (resolve(lit) !== resolve(join(dir, glow))) await copyFile(lit, join(dir, glow));
      }
    }

    if (declared) await declare(dir, `${finish}_${variant}`, declared);

    // A wall picture that never says what grid it holds is stretched over the one the kit draws,
    // which slices its windows by the floors. It is the one thing worth refusing to guess.
    const pack = await loadPack(projects.textures, style);
    const undeclared = gridded(finish) && !pack.grids[`${finish}_${variant}`] && !pack.grids[finish];

    return {
      style,
      finish,
      variant,
      ...(name ? { file: join(dir, name) } : { declaredOnly: `${finish}_${variant}`, dir }),
      ...(glow ? { emissive: join(dir, glow) } : {}),
      ...(pixels ? { pixels } : {}),
      ...(declared ? { declared } : {}),
      pack: pack.variants[finish] ?? 1,
      note: undeclared
        ? `count the window bays across and the floors down in the picture and say so: \`buildings add-texture ${finish} --as ${variant} --across 8 --down 4\`. Until then it is laid out on the grid the kit draws, and its windows will not land on the floors`
        : 'build the building again to see it',
    };
  },
};

export const packVerbs = [addTexture];
