/**
 * The lit parts: lines climbing a face, screens standing off one, and the crown round a roof.
 *
 * All three are section-level, not composed on the face grid, because the grid repeats its design
 * on every floor and these span floors. They are placed on a face instead: a side, how far along
 * it, and which floors.
 */
import { assemble } from '#assemble';
import { edgeFacing } from '#kit';
import { COLOUR_NAMES, loadImage } from '#materials';
import { BuildingError, SIDES, toMetres, toMm, type Band, type BandLine, type BandScreen, type BuildingDocument, type Side } from '#spec';
import type { Verb } from './verb.ts';
import { count, need, oneOf, parse, size, text } from './args.ts';

/** The section named, or the first one, so a verb always has something to work on. */
function sectionOf(doc: BuildingDocument, named: string | undefined): Band {
  const id = named ?? doc.bands[0]?.id;
  const band = doc.bands.find((one) => one.id === id);
  if (!band) throw new BuildingError('E_DOC_INVALID', `no section named ${String(named)}`, ['bands', String(named)]);
  return band;
}

/** How wide one face of a section is, in metres, so `--along` can be given in metres. */
function faceWidth(doc: BuildingDocument, band: Band, side: Side): number {
  const placed = assemble(doc).bands.find((one) => one.id === band.id)!;
  const ring = placed.bottom.map(([x, z]) => [toMetres(x), toMetres(z)] as [number, number]);
  const edge = edgeFacing(ring, side);
  const a = ring[edge]!;
  const b = ring[(edge + 1) % ring.length]!;
  return Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
}

/** Floors have to be inside the section, or a part lands somewhere nobody asked for. */
function floorsOf(band: Band, from: number | undefined, to: number | undefined): { from: number; to: number } {
  const first = from ?? 0;
  const last = to ?? band.floors - 1;
  if (first < 0 || last > band.floors - 1 || last < first) {
    throw new BuildingError(
      'E_DOC_INVALID',
      `${band.id} has ${band.floors} floors, numbered 0 to ${band.floors - 1}, and this asks for ${first} to ${last}`,
      ['bands', band.id, 'floors'],
    );
  }
  return { from: first, to: last };
}

function whole(value: string | boolean | undefined, what: string): number | undefined {
  const asked = text(value);
  if (asked === undefined) return undefined;
  const parsed = Number(asked);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new BuildingError('E_DOC_INVALID', `${what} is a floor number, counted from 0 at the bottom of the section`, [what]);
  }
  return parsed;
}

async function editBand(
  projects: Parameters<Verb['run']>[1]['projects'],
  named: string | undefined,
  change: (band: Band, doc: BuildingDocument) => Band,
): Promise<{ project: string; doc: BuildingDocument; band: Band }> {
  const { name, project } = await projects.open();
  const doc = await project.readDocument();
  const band = sectionOf(doc, named);
  const next = change(band, doc);
  await project.writeDocument({ ...doc, bands: doc.bands.map((one) => (one.id === band.id ? next : one)) });
  return { project: name, doc, band: next };
}

export const line: Verb = {
  name: 'line',
  summary: 'lit lines climbing one face across many floors',
  usage: 'line <section> --side S [--along 2] [--count 5] [--spacing 3] [--from 0] [--to 19] [--colour cyan] [--colours cyan,magenta] [--thickness 0.12]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, {
      side: { type: 'string' },
      along: { type: 'string' },
      count: { type: 'string' },
      spacing: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      colour: { type: 'string' },
      colours: { type: 'string' },
      thickness: { type: 'string' },
    });

    const side = oneOf(text(values.side), SIDES, 'side', 'S');
    const many = count(values.count, 'count') ?? 1;
    const spacing = size(values.spacing, 'spacing') ?? 3000;
    const thickness = size(values.thickness, 'thickness') ?? 120;
    const colours = (text(values.colours) ?? text(values.colour) ?? 'cyan').split(',').map((one) => one.trim()).filter(Boolean);

    const made: BandLine[] = [];
    const { project, band } = await editBand(projects, positionals[0], (found, doc) => {
      const floors = floorsOf(found, whole(values.from, 'from'), whole(values.to, 'to'));
      const width = faceWidth(doc, found, side);
      const start = size(values.along, 'along') ?? Math.round(spacing / 2);

      for (let i = 0; i < many; i++) {
        const along = start + i * spacing;
        if (toMetres(along) > width) {
          throw new BuildingError(
            'E_DOC_INVALID',
            `line ${i + 1} lands ${toMetres(along)} m along a face that is ${width.toFixed(2)} m wide. Use fewer, or a smaller --spacing`,
            ['line', 'along'],
          );
        }
        made.push({ side, along, from: floors.from, to: floors.to, thickness, colour: colours[i % colours.length]!, material: 'neon' });
      }
      return { ...found, lines: [...found.lines, ...made] };
    });

    return {
      project,
      section: band.id,
      side,
      put: made.length,
      lines: made.map((one) => ({ along: toMetres(one.along), colour: one.colour, floors: `${one.from} to ${one.to}` })),
      colours: COLOUR_NAMES,
      note: 'a line reads against a plain wall, so keep the face it climbs free of composed elements',
    };
  },
};

export const screen: Verb = {
  name: 'screen',
  summary: 'a screen standing off one face, spanning many floors',
  usage: 'screen <section> --side S --along 3 --width 6 [--from 0] [--to 8] [--stand 1] [--image path/to/screen.png]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, {
      side: { type: 'string' },
      along: { type: 'string' },
      width: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      stand: { type: 'string' },
      image: { type: 'string' },
    });

    const side = oneOf(text(values.side), SIDES, 'side', 'S');
    const picture = text(values.image) ?? '';
    // Read it now: a path that is wrong is worth saying here, not three verbs later at the build.
    if (picture !== '') {
      try {
        await loadImage(picture);
      } catch (error) {
        throw new BuildingError('E_DOC_INVALID', `--image ${picture} cannot be read: ${(error as Error).message}`, ['screen', 'image']);
      }
    }

    let made: BandScreen | undefined;
    const { project, band } = await editBand(projects, positionals[0], (found, doc) => {
      const floors = floorsOf(found, whole(values.from, 'from'), whole(values.to, 'to'));
      const width = faceWidth(doc, found, side);
      const along = size(values.along, 'along') ?? 1000;
      const wide = size(values.width, 'width') ?? Math.round(toMm(width * 0.4));

      if (toMetres(along + wide) > width) {
        throw new BuildingError(
          'E_DOC_INVALID',
          `a screen ${toMetres(wide)} m wide starting ${toMetres(along)} m along runs off a face that is ${width.toFixed(2)} m wide`,
          ['screen', 'width'],
        );
      }

      made = { side, along, width: wide, from: floors.from, to: floors.to, stand: size(values.stand, 'stand') ?? 1000, image: picture };
      return { ...found, screens: [...found.screens, made] };
    });

    return {
      project,
      section: band.id,
      side,
      screen: band.screens.length,
      spans: `floors ${made!.from} to ${made!.to}`,
      size: { width: toMetres(made!.width), stand: toMetres(made!.stand) },
      image: picture === '' ? 'the generated screen' : picture,
      note: 'it carries its own picture across its whole front, and hangs on brackets back to the wall',
    };
  },
};

export const crown: Verb = {
  name: 'crown',
  summary: 'a lit run round the top of a section',
  usage: 'crown [section] [--colour red] [--off]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { colour: { type: 'string' }, off: { type: 'boolean' } });

    const { project, band } = await editBand(projects, positionals[0], (found) => ({
      ...found,
      crown: values.off === true ? '' : (text(values.colour) ?? 'red'),
    }));

    return {
      project,
      section: band.id,
      crown: band.crown === '' ? 'off' : band.crown,
      colours: COLOUR_NAMES,
      note: 'it runs round the top edge of this section, so put it on the roof or on a setback',
    };
  },
};

export const unlight: Verb = {
  name: 'unlight',
  summary: 'take lines or screens off a section',
  usage: 'unlight <section> [--lines] [--screens] [--all]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { lines: { type: 'boolean' }, screens: { type: 'boolean' }, all: { type: 'boolean' } });
    const all = values.all === true || (values.lines !== true && values.screens !== true);

    const { project, band } = await editBand(projects, positionals[0], (found) => ({
      ...found,
      lines: all || values.lines === true ? [] : found.lines,
      screens: all || values.screens === true ? [] : found.screens,
      ...(all ? { crown: '' } : {}),
    }));

    return { project, section: band.id, lines: band.lines.length, screens: band.screens.length, crown: band.crown === '' ? 'off' : band.crown };
  },
};

export const litVerbs = [line, screen, crown, unlight];
