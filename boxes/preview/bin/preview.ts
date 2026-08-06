#!/usr/bin/env node
/** Start the preview on a project folder: `node boxes/preview/bin/preview.ts [dir] [--port 4321]`. */
import { existsSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { newDocument } from '#spec';
import { PreviewServer } from '../server/server.ts';
import { Project } from '../server/project.ts';

const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const port = portFlag === -1 ? 4321 : Number(args[portFlag + 1]);
const dir = resolve(args.find((a) => !a.startsWith('--') && a !== String(port)) ?? '.');

const project = new Project(dir);
if (!existsSync(project.documentPath)) {
  await project.writeDocument(newDocument(basename(dir)));
  console.log(`seeded ${project.documentPath}`);
}

const server = new PreviewServer({ dir, port });
const url = await server.start();
console.log(`preview  ${url}`);
console.log(`project  ${dir}`);
console.log(`picks    ${project.selectionPath}`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void server.close().then(() => process.exit(0));
  });
}
