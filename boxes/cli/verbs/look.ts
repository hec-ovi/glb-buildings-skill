/**
 * How a building is dressed: which family of finishes it wears, and whether the file carries its
 * pictures at all. Both are one setting on the document, read back by `show`.
 */
import { MODES, MODE_NOTES, STYLES, STYLE_NOTES, loadPack, pictured } from '#materials';
import type { Verb } from './verb.ts';
import { oneOf, parse } from './args.ts';

/** What the pack for a style holds right now, so nobody wonders whether the images are in play. */
async function packOf(root: string, style: string) {
  const pack = await loadPack(root, style);
  // A picture of a light is never read, so listing one as in play would be a lie.
  const used = pack.finishes.filter((finish) => pictured(finish));
  const ignored = pack.finishes.filter((finish) => !pictured(finish));
  // Which pictures would leave a building unlit, named, because it is the least obvious thing a
  // pack can be wrong about: every file is there and the tower still comes out dead.
  const dark = used
    .filter((finish) => pack.lit[finish]! < pack.variants[finish]! && pack.lit[finish]! >= 0 && ['facade', 'glass-band', 'door', 'screen'].includes(finish))
    .map((finish) => `${finish}: ${pack.variants[finish]! - pack.lit[finish]!} of ${pack.variants[finish]} carry no lights`);
  return {
    dir: pack.dir,
    has: used.map((finish) => {
      const many = pack.variants[finish]!;
      const lit = pack.lit[finish]!;
      const count = many > 1 ? `${finish} x${many}` : finish;
      // A wall with no emissive map is a building with every light off. How many of a finish's
      // pictures are like that decides how much of a street comes out dark, so it is said here.
      return lit === 0 || lit === many ? count : `${count} (${lit} lit)`;
    }),
    ...(ignored.length === 0 ? {} : { ignored, why: 'a light is a flat colour emitting that colour, so no picture of one is read' }),
    ...(dark.length === 0 ? {} : { dark, why_dark: 'these have no emissive map, so a building that picks one comes out with every window off. Generate more lit pictures, or emissive maps for these, to change the balance' }),
    note:
      used.length === 0
        ? `no generated images here yet, so every finish is drawn from code. Put JPEGs named after the finish in ${pack.dir} to override them: facade_1.jpg to facade_4.jpg for a building to pick between, and facade_1-emissive.png for what glows`
        : `${used.length} finishes come from images, the rest are drawn from code. A finish with several pictures is picked between per building`,
  };
}

export const style: Verb = {
  name: 'style',
  summary: 'which family of finishes this building is dressed in',
  usage: 'style [modern|cyber]',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const { name, project } = await projects.open();
    const doc = await project.readDocument();

    const chosen = positionals.length === 0 ? doc.style : oneOf(positionals[0], STYLES, 'style');
    if (chosen !== doc.style) await project.writeDocument({ ...doc, style: chosen });

    return {
      project: name,
      style: chosen,
      is: STYLE_NOTES[chosen],
      styles: STYLES.map((one) => ({ style: one, is: STYLE_NOTES[one] })),
      pack: await packOf(projects.textures, chosen),
    };
  },
};

export const textures: Verb = {
  name: 'textures',
  summary: 'whether the file carries its pictures, or flat colours an engine can replace',
  usage: 'textures [on|off]',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const { name, project } = await projects.open();
    const doc = await project.readDocument();

    const asked = positionals.length === 0 ? undefined : oneOf(positionals[0], ['on', 'off'] as const, 'textures');
    const on = asked === undefined ? doc.textures : asked === 'on';
    if (on !== doc.textures) await project.writeDocument({ ...doc, textures: on });

    const mode = on ? 'textured' : 'plain';
    return {
      project: name,
      textures: on ? 'on' : 'off',
      mode,
      is: MODE_NOTES[mode],
      modes: MODES.map((one) => ({ mode: one, is: MODE_NOTES[one] })),
      ...(on ? { pack: await packOf(projects.textures, doc.style) } : {}),
      note: on
        ? 'windows, concrete, neon and screens are carried in the file'
        : 'no pictures at all: every part is a named flat colour, so a section with no cut windows reads as a plain mass',
    };
  },
};

export const lookVerbs = [style, textures];
