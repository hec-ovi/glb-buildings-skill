/** Verbs about which building we are editing. */
import { assemble, describeSeam, seamsMatch } from '#assemble';
import { templates } from '#kit';
import { bandFloorHeight, newDocument, toMetres } from '#spec';
import type { Verb } from './verb.ts';
import { count, metres, need, parse } from './args.ts';

export const newProject: Verb = {
  name: 'new',
  summary: 'start a building and make it the current one',
  usage: 'new <name> [--width 18] [--depth 14] [--floors 14]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, {
      width: { type: 'string' },
      depth: { type: 'string' },
      floors: { type: 'string' },
    });
    const name = need(positionals, 0, 'project name');
    const project = await projects.create(name);
    const doc = newDocument(name, {
      width: values.width ? Number(values.width) : undefined,
      depth: values.depth ? Number(values.depth) : undefined,
      floors: count(values.floors, 'floors'),
    });
    await project.writeDocument(doc);
    await projects.use(name);
    return { project: name, path: project.dir, bands: doc.bands.map((b) => b.id) };
  },
};

export const listProjects: Verb = {
  name: 'list',
  summary: 'every building you have, and which one is current',
  usage: 'list',
  async run(_args, { projects }) {
    const names = await projects.list();
    const current = await projects.current();
    return { current, projects: names, home: projects.root };
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

export const show: Verb = {
  name: 'show',
  summary: 'what the current building is, band by band',
  usage: 'show [name]',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const { name, project } = await projects.open(positionals[0]);
    const doc = await project.readDocument();
    const placed = assemble(doc);

    const bands = placed.bands.map((band, i) => {
      const below = placed.bands[i - 1];
      return {
        id: band.id,
        kind: band.kind,
        tier: band.tier,
        template: band.template,
        floors: band.floors.length,
        floorHeight: toMetres(bandFloorHeight(doc, doc.bands[i]!)),
        inset: toMetres(band.inset),
        rotation: band.rotation,
        base: toMetres(band.y0),
        seam: describeSeam(band.seam),
        stacksOnBelow: below ? seamsMatch(below.seam, band.seam) : true,
      };
    });

    return {
      project: name,
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
