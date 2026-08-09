/** Verbs about which building we are editing. */
import { assemble } from '#assemble';
import { supports } from '#check';
import { templates } from '#kit';
import { BuildingError, bandFloorHeight, newDocument, toMetres, type Band } from '#spec';
import { join } from 'node:path';
import { LOCAL, Projects } from '../projects.ts';
import type { Verb } from './verb.ts';
import { count, need, parse, text } from './args.ts';

export const newProject: Verb = {
  name: 'new',
  summary: 'start a building and make it the current one',
  usage: 'new <name> [--width 18] [--depth 14] [--floors 14] [--here]',
  async run(args, ctx) {
    const { positionals, values } = parse(args, {
      width: { type: 'string' },
      depth: { type: 'string' },
      floors: { type: 'string' },
      here: { type: 'boolean' },
    });
    const name = need(positionals, 0, 'project name');

    // --here keeps projects beside the work, which is the answer when the home is not writable.
    // With BUILDINGS_HOME set, the two disagree about where to look, and the project would be
    // written somewhere no later verb reads. Say so instead of stranding it.
    if (values.here === true && process.env.BUILDINGS_HOME) {
      throw new BuildingError(
        'E_DOC_INVALID',
        `BUILDINGS_HOME is set to ${process.env.BUILDINGS_HOME}, so every verb looks there, and --here would put this project in ${join(process.cwd(), LOCAL)} where none of them would find it. Drop --here, or unset BUILDINGS_HOME`,
        ['here'],
      );
    }
    const projects = values.here === true ? new Projects(join(process.cwd(), LOCAL)) : ctx.projects;
    const project = await projects.create(name);
    const width = text(values.width);
    const depth = text(values.depth);
    const doc = newDocument(name, {
      width: width ? Number(width) : undefined,
      depth: depth ? Number(depth) : undefined,
      floors: count(values.floors, 'floors'),
    });
    await project.writeDocument(doc);
    await projects.use(name);
    return { project: name, path: project.dir, home: projects.root, bands: doc.bands.map((b) => b.id) };
  },
};

export const listProjects: Verb = {
  name: 'list',
  summary: 'every building you have, and which one is current',
  usage: 'list',
  async run(_args, { projects }) {
    const names = await projects.list();
    const current = await projects.current();
    const built = await Promise.all(
      names.map(async (name) => ({ project: name, built: (await projects.open(name)).project.hasModel() })),
    );
    return { current, projects: built, home: projects.root };
  },
};

export const useProject: Verb = {
  name: 'use',
  summary: 'make a building the current one',
  usage: 'use <name>',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const name = need(positionals, 0, 'project name');
    await projects.use(name);
    return { current: name };
  },
};

/** The plan a section is drawn on, in one line: shape first, then whatever rounds it. */
function planOf(band: Band): string {
  const parts = [band.shape === 'round' ? `round in ${band.segments} segments` : 'box'];
  if (band.arc !== 360) parts.push(`${band.arc}° of it`);
  if (band.bow !== '') parts.push(`${band.bow} bowed`);
  if (band.corner > 0) parts.push(`corners filleted ${toMetres(band.corner)} m`);
  if (band.chamfer > 0) parts.push(`edges chamfered ${toMetres(band.chamfer)} m`);
  return parts.join(', ');
}

/** What a section wears, so every flag that can be set can be read back. */
function wornBy(band: Band): string[] {
  const worn: string[] = [];
  const detail = band.windows || band.faces.some((face) => face.elements.length > 0) || band.runs.length > 0;

  if (band.windows) worn.push('windows cut into every bay');
  for (const face of band.faces) {
    if (face.elements.length > 0) worn.push(`${face.elements.length} on the ${face.side} face`);
  }
  if (band.runs.length > 0) worn.push(`${band.runs.length} runs`);
  // Greebles are only built on a section that carries nothing else, so say which it is.
  if (band.greebles > 0) worn.push(detail ? `greebles ${band.greebles}, off: this section has detail of its own` : `greebles ${band.greebles}`);
  if (band.columns !== 'none') worn.push(`columns ${band.columns}`);
  if (band.wires !== 'none') worn.push(`wires up ${band.wires}`);
  if (band.clutter > 0) worn.push(`deck clutter ${band.clutter}`);
  if (band.deck.length > 0) worn.push(`${band.deck.length} parts placed on the deck`);
  return worn;
}

export const show: Verb = {
  name: 'show',
  summary: 'what the current building is, band by band',
  usage: 'show [name]',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const { name, project } = await projects.open(positionals[0]);
    const doc = await project.readDocument();
    const placed = assemble(doc);

    const resting = supports(placed);

    const bands = placed.bands.map((band, i) => {
      const written = doc.bands[i]!;
      const support = resting.find((entry) => entry.band === band.id);
      return {
        id: band.id,
        kind: band.kind,
        tier: band.tier,
        template: band.template,
        floors: band.floors.length,
        floorHeight: toMetres(bandFloorHeight(doc, written)),
        base: toMetres(band.y0),
        width: toMetres(band.rect.x1 - band.rect.x0),
        depth: toMetres(band.rect.z1 - band.rect.z0),
        inset: toMetres(written.inset),
        shiftX: toMetres(written.shiftX),
        shiftZ: toMetres(written.shiftZ),
        rotation: written.rotation,
        twist: written.twist,
        taper: toMetres(written.taper),
        wires: written.wires,
        plan: planOf(written),
        wears: wornBy(written),
        restsOn: support?.reads ?? 'the ground',
      };
    });

    return {
      project: name,
      home: projects.root,
      size: {
        width: toMetres(placed.size.width),
        depth: toMetres(placed.size.depth),
        height: toMetres(placed.size.height),
      },
      floors: placed.bands.reduce((n, b) => n + b.floors.length, 0),
      bay: toMetres(doc.grid.bay),
      bands,
      hasBuild: project.hasModel(),
    };
  },
};

export const listTemplates: Verb = {
  name: 'templates',
  summary: 'the floor templates the kit can build',
  usage: 'templates',
  async run() {
    return { templates: templates().map((t) => ({ id: t.id, tier: t.tier, purpose: t.purpose })) };
  },
};

export const projectVerbs = [newProject, listProjects, useProject, show, listTemplates];
