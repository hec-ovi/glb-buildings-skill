/** Verbs that produce something: the file, the viewer, the last pick. */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildGlb, validateGlb } from '#glb';
import { PreviewServer } from '#preview';
import { BuildingError, describeSelection, toMetres } from '#spec';
import type { Verb } from './verb.ts';
import { parse } from './args.ts';

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
    const { name, project } = await projects.open(positionals[0]);
    const server = new PreviewServer({ dir: project.dir, port: values.port ? Number(values.port) : 4321 });
    const url = await server.start();

    process.on('SIGINT', () => void server.close().then(() => process.exit(0)));
    process.on('SIGTERM', () => void server.close().then(() => process.exit(0)));

    return { project: name, url, picks: project.selectionPath, note: 'running until you stop it' };
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
