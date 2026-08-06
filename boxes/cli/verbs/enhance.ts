/**
 * Breaking the rhythm. A section repeats one floor, which is what makes a tower cheap and also
 * what makes it monotonous. `enhance` lifts one floor out of its section into a section of its
 * own and gives it a shape: a ledge that hangs out, a notch that pulls in, a slight turn, a
 * taper, a run of cables.
 */
import { BuildingError, parseDocument, toMm, type Band, type BuildingDocument } from '#spec';
import type { Verb } from './verb.ts';
import { parse, text } from './args.ts';

export const STYLES = ['ledge', 'notch', 'twist', 'taper', 'cables', 'greebles', 'columns'] as const;
export type Style = (typeof STYLES)[number];

export const STYLE_NOTES: Record<Style, string> = {
  ledge: 'hangs out 0.35 m, so the facade gets a shadow line',
  notch: 'pulls in 0.4 m, reading as a service or plant floor',
  twist: 'turns 6 degrees off the section it came from',
  taper: 'pulls in toward its own top, 0.5 m',
  cables: 'cables climb one face of it',
  greebles: 'fake parts stand off its faces',
  columns: 'uprights stand in its gaps',
};

function shaped(band: Band, style: Style, side: 'N' | 'E' | 'S' | 'W'): Band {
  switch (style) {
    case 'ledge':
      return { ...band, inset: band.inset - toMm(0.35) };
    case 'notch':
      return { ...band, inset: band.inset + toMm(0.4) };
    case 'twist':
      return { ...band, rotation: band.rotation + 6 };
    case 'taper':
      return { ...band, taper: band.taper + toMm(0.5) };
    case 'cables':
      return { ...band, wires: side };
    case 'greebles':
      return { ...band, greebles: Math.max(band.greebles, 0.5) };
    case 'columns':
      return { ...band, columns: 'partial' };
  }
}

/** `body.f3` means floor 3 of section `body`, counting from that section's own bottom. */
function readFloorId(id: string): { bandId: string; index: number } {
  const match = /^(.+)\.f(\d+)$/.exec(id);
  if (!match) {
    throw new BuildingError('E_DOC_INVALID', `${id} is not a floor id; they look like body.f3`, [id]);
  }
  return { bandId: match[1]!, index: Number(match[2]) };
}

/** Split one floor out of its section, keeping the floors below and above as their own. */
function split(doc: BuildingDocument, floorId: string, style: Style, side: 'N' | 'E' | 'S' | 'W'): { doc: BuildingDocument; band: string } {
  const { bandId, index } = readFloorId(floorId);
  const at = doc.bands.findIndex((band) => band.id === bandId);
  if (at === -1) throw new BuildingError('E_DOC_INVALID', `no section named ${bandId}`, ['bands', bandId]);

  const band = doc.bands[at]!;
  if (index >= band.floors) {
    throw new BuildingError('E_DOC_INVALID', `section ${bandId} has ${band.floors} floors, so there is no f${index}`, [floorId]);
  }

  const name = `${bandId}-e${index}`;
  if (doc.bands.some((other) => other.id === name)) {
    throw new BuildingError('E_BAND_ID_DUPLICATE', `${name} exists already, so that floor is enhanced`, ['bands', name]);
  }

  const one = shaped({ ...band, id: name, floors: 1, kind: 'custom', tier: 'light' }, style, side);
  const pieces: Band[] = [];
  if (index > 0) pieces.push({ ...band, floors: index });
  pieces.push(one);
  if (index < band.floors - 1) pieces.push({ ...band, id: `${bandId}-a${index}`, floors: band.floors - index - 1 });

  const bands = [...doc.bands.slice(0, at), ...pieces, ...doc.bands.slice(at + 1)];
  return { doc: parseDocument({ ...doc, bands }), band: name };
}

export const enhance: Verb = {
  name: 'enhance',
  summary: 'give one floor a shape of its own, so a section stops being uniform',
  usage: 'enhance [floorId ...] [--style ledge|notch|twist|taper|cables] [--side S]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { style: { type: 'string' }, side: { type: 'string' } });
    const { name, project } = await projects.open();

    const style = (text(values.style) ?? 'ledge') as Style;
    if (!STYLES.includes(style)) {
      throw new BuildingError('E_DOC_INVALID', `style must be one of ${STYLES.join(', ')}`, ['style']);
    }
    const side = (text(values.side) ?? 'S') as 'N' | 'E' | 'S' | 'W';

    // No floors named: take what the human picked in the preview.
    const picked = positionals.length > 0 ? positionals : (await project.readSelection()).floorIds;
    if (picked.length === 0) {
      throw new BuildingError('E_DOC_INVALID', 'name a floor like body.f3, or pick one in the preview first', ['floors']);
    }

    let doc = await project.readDocument();
    const made: string[] = [];
    // Highest floor first, so splitting one does not renumber the next.
    for (const floorId of [...picked].sort().reverse()) {
      const result = split(doc, floorId, style, side);
      doc = result.doc;
      made.push(result.band);
    }
    await project.writeDocument(doc);

    return {
      project: name,
      style,
      note: STYLE_NOTES[style],
      enhanced: made.reverse(),
      bands: doc.bands.map((band) => band.id),
    };
  },
};

export const enhanceVerbs = [enhance];
