/**
 * How a building is dressed: which family of finishes it wears, and whether the file carries its
 * pictures at all. Both are one setting on the document, read back by `show`.
 */
import { MODES, MODE_NOTES, STYLES, STYLE_NOTES, loadPack } from '#materials';
import type { Verb } from './verb.ts';
import { oneOf, parse } from './args.ts';

/** What the pack for a style holds right now, so nobody wonders whether the images are in play. */
async function packOf(root: string, style: string) {
  const pack = await loadPack(root, style);
  return {
    dir: pack.dir,
    has: pack.finishes,
    note:
      pack.finishes.length === 0
        ? `no generated images here yet, so every finish is drawn from code. Put PNGs or JPEGs named after the finish in ${pack.dir} to override them`
        : `${pack.finishes.length} finishes come from images, the rest are drawn from code`,
  };
}

export const style: Verb = {
  name: 'style',
  summary: 'which family of finishes this building is dressed in',
  usage: 'style [modern|fifties|cyber]',
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
