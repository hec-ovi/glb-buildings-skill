/** Verbs that change the stack: add a band, change one, take one out. */
import { BAND_KINDS, BuildingError, TIERS, parseDocument, type Band, type BuildingDocument } from '#spec';

const WIRE_SIDES = ['none', 'N', 'E', 'S', 'W'] as const;
import { TEMPLATE_IDS } from '#kit';
import type { Verb } from './verb.ts';
import { count, degrees, metres, need, parse, size, text, type FlagSpec } from './args.ts';

const FLAGS: FlagSpec = {
  kind: { type: 'string' },
  tier: { type: 'string' },
  template: { type: 'string' },
  floors: { type: 'string' },
  height: { type: 'string' },
  inset: { type: 'string' },
  rotation: { type: 'string' },
  'shift-x': { type: 'string' },
  'shift-z': { type: 'string' },
  width: { type: 'string' },
  depth: { type: 'string' },
  twist: { type: 'string' },
  taper: { type: 'string' },
  wires: { type: 'string' },
  before: { type: 'string' },
  after: { type: 'string' },
};

function oneOf<T extends readonly string[]>(value: string | undefined, allowed: T, what: string): T[number] | undefined {
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) {
    throw new BuildingError('E_DOC_INVALID', `${what} must be one of ${allowed.join(', ')}`, [what]);
  }
  return value;
}

function checkTemplate(id: string | undefined): string | undefined {
  if (id === undefined) return undefined;
  if (!TEMPLATE_IDS.includes(id)) {
    throw new BuildingError('E_UNKNOWN_TEMPLATE', `no template named ${id}, the kit has ${TEMPLATE_IDS.join(', ')}`, [id]);
  }
  return id;
}

async function edit(
  ctx: Parameters<Verb['run']>[1],
  name: string | undefined,
  change: (doc: BuildingDocument) => BuildingDocument,
): Promise<{ project: string; bands: string[] }> {
  const { name: project, project: folder } = await ctx.projects.open(name);
  const next = parseDocument(change(await folder.readDocument()));
  await folder.writeDocument(next);
  return { project, bands: next.bands.map((b) => b.id) };
}

export const addBand: Verb = {
  name: 'add-band',
  summary: 'put a band of floors into the stack',
  usage: 'add-band <id> --kind bulk --tier flat --template bulk-flat --floors 6 [--height 3.2] [--width 12] [--depth 10] [--inset 0] [--shift-x 0] [--shift-z 0] [--rotation 0] [--twist 0] [--taper 0] [--wires S] [--after <id> | --before <id>]',
  async run(args, ctx) {
    const { positionals, values } = parse(args, FLAGS);
    const id = need(positionals, 0, 'band id');

    const band: Band = {
      id,
      kind: oneOf(text(values.kind), BAND_KINDS, 'kind') ?? 'bulk',
      tier: oneOf(text(values.tier), TIERS, 'tier') ?? 'flat',
      template: checkTemplate(text(values.template)) ?? 'bulk-flat',
      floors: count(values.floors, 'floors') ?? 1,
      inset: metres(values.inset, 'inset') ?? 0,
      shiftX: metres(values['shift-x'], 'shift-x') ?? 0,
      shiftZ: metres(values['shift-z'], 'shift-z') ?? 0,
      rotation: degrees(values.rotation) ?? 0,
      twist: degrees(values.twist) ?? 0,
      taper: size(values.taper, 'taper') ?? 0,
      wires: oneOf(text(values.wires), WIRE_SIDES, 'wires') ?? 'none',
      ...(values.width ? { width: size(values.width, 'width') } : {}),
      ...(values.depth ? { depth: size(values.depth, 'depth') } : {}),
      ...(values.height ? { floorHeight: size(values.height, 'height') } : {}),
    };

    return edit(ctx, undefined, (doc) => {
      if (doc.bands.some((b) => b.id === id)) {
        throw new BuildingError('E_BAND_ID_DUPLICATE', `band ${id} already exists`, ['bands', id]);
      }
      const bands = [...doc.bands];
      const anchor = text(values.after) ?? text(values.before);
      const at = anchor ? bands.findIndex((b) => b.id === anchor) : -1;
      if (anchor && at === -1) throw new BuildingError('E_DOC_INVALID', `no band named ${anchor}`, ['bands', anchor]);

      if (at === -1) bands.push(band);
      else bands.splice(text(values.after) ? at + 1 : at, 0, band);
      return { ...doc, bands };
    });
  },
};

export const setBand: Verb = {
  name: 'set-band',
  summary: 'change a band that is already in the stack',
  usage: 'set-band <id> [--kind] [--tier] [--template] [--floors] [--height] [--width] [--depth] [--inset] [--shift-x] [--shift-z] [--rotation] [--twist] [--taper] [--wires]',
  async run(args, ctx) {
    const { positionals, values } = parse(args, FLAGS);
    const id = need(positionals, 0, 'band id');

    return edit(ctx, undefined, (doc) => {
      const at = doc.bands.findIndex((b) => b.id === id);
      if (at === -1) throw new BuildingError('E_DOC_INVALID', `no band named ${id}`, ['bands', id]);
      const band = doc.bands[at]!;
      const height = size(values.height, 'height');

      const bands = [...doc.bands];
      bands[at] = {
        ...band,
        kind: oneOf(text(values.kind), BAND_KINDS, 'kind') ?? band.kind,
        tier: oneOf(text(values.tier), TIERS, 'tier') ?? band.tier,
        template: checkTemplate(text(values.template)) ?? band.template,
        floors: count(values.floors, 'floors') ?? band.floors,
        inset: metres(values.inset, 'inset') ?? band.inset,
        shiftX: metres(values['shift-x'], 'shift-x') ?? band.shiftX,
        shiftZ: metres(values['shift-z'], 'shift-z') ?? band.shiftZ,
        rotation: degrees(values.rotation) ?? band.rotation,
        twist: degrees(values.twist) ?? band.twist,
        taper: size(values.taper, 'taper') ?? band.taper,
        wires: oneOf(text(values.wires), WIRE_SIDES, 'wires') ?? band.wires,
        ...(values.width ? { width: size(values.width, 'width') } : {}),
        ...(values.depth ? { depth: size(values.depth, 'depth') } : {}),
        ...(height ? { floorHeight: height } : {}),
      };
      return { ...doc, bands };
    });
  },
};

export const removeBand: Verb = {
  name: 'remove-band',
  summary: 'take a band out of the stack',
  usage: 'remove-band <id>',
  async run(args, ctx) {
    const { positionals } = parse(args, {});
    const id = need(positionals, 0, 'band id');

    return edit(ctx, undefined, (doc) => {
      const bands = doc.bands.filter((b) => b.id !== id);
      if (bands.length === doc.bands.length) throw new BuildingError('E_DOC_INVALID', `no band named ${id}`, ['bands', id]);
      if (bands.length === 0) throw new BuildingError('E_DOC_INVALID', 'a building needs at least one band', ['bands']);
      return { ...doc, bands };
    });
  },
};

export const bandVerbs = [addBand, setBand, removeBand];
