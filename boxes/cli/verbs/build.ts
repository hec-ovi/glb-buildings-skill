/** Verbs that produce something: the file, the viewer, the last pick. */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildGlb, validateGlb } from '#glb';
import { PreviewServer } from '#preview';
import { BuildingError, describeSelection, toMetres } from '#spec';
import type { Verb } from './verb.ts';
import { parse, text } from './args.ts';

export const build: Verb = {
  name: 'build',
  summary: 'write the GLB and prove it before anyone opens it',
  usage: 'build [name]',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const { name, project } = await projects.open(positionals[0]);
    const doc = await project.readDocument();

    const result = await buildGlb(doc);
    const report = await validateGlb(result.glb);
    if (report.errors.length > 0) {
      const first = report.errors[0]!;
      throw new BuildingError('E_GLB_INVALID', `${first.code} at ${first.pointer ?? 'the file'}: ${first.message}`, [name]);
    }

    await mkdir(dirname(project.modelPath), { recursive: true });
    await writeFile(project.modelPath, result.glb);

    return {
      project: name,
      file: project.modelPath,
      size: {
        width: toMetres(result.scene.size.width),
        depth: toMetres(result.scene.size.depth),
        height: toMetres(result.scene.size.height),
      },
      ...result.stats,
      supports: result.supports,
      validator: { errors: 0, warnings: report.warnings.length, infos: report.infos.length },
    };
  },
};

export const preview: Verb = {
  name: 'preview',
  summary: 'open the blueprint editor on the current building, and stay up',
  usage: 'preview [name] [--port 4321]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { port: { type: 'string' } });
    const pinned = positionals[0];
    const { name, project } = await projects.open(pinned);
    const port = text(values.port) ? Number(text(values.port)) : 4321;

    // With no name the preview follows the current project, so one server keeps up with the work.
    const server = new PreviewServer(
      pinned
        ? { dir: project.dir, port, log: true }
        : { resolve: async () => (await projects.open()).project.dir, watchRoot: projects.root, port, log: true },
    );

    let url: string;
    try {
      url = await server.start();
    } catch (error) {
      // A preview left running on this port keeps serving its own build, which looks like a
      // page that will not update. Say so instead of failing quietly.
      if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw error;
      throw new BuildingError('E_DOC_INVALID', `something is already serving port ${port}. Stop it, or pass --port with another number`, ['port']);
    }

    process.on('SIGINT', () => void server.close().then(() => process.exit(0)));
    process.on('SIGTERM', () => void server.close().then(() => process.exit(0)));

    return {
      project: name,
      url,
      follows: pinned ? 'this project only' : 'whichever project is current',
      picks: project.selectionPath,
      note: 'running until you stop it',
    };
  },
};

export const selection: Verb = {
  name: 'selection',
  summary: 'what the human last picked in the preview',
  usage: 'selection [name]',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const { name, project } = await projects.open(positionals[0]);
    const picked = await project.readSelection();
    return { project: name, ...picked, reads: describeSelection(picked) };
  },
};

export const outputVerbs = [build, preview, selection];
