/**
 * Is this machine able to build a building? Everything that goes wrong before anything is
 * composed is environmental: the wrong Node, a home that cannot be written, a port already
 * held, a bundler that is not installed. Each check answers what is wrong and the one command
 * that fixes it, so nobody has to infer an environment from a geometry error.
 */
import { existsSync } from 'node:fs';
import { access, constants, mkdtemp, rm } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { join } from 'node:path';
import { LOCAL } from '../projects.ts';
import type { Verb } from './verb.ts';
import { parse, text } from './args.ts';

export type Check = { check: string; ok: boolean; is: string; fix?: string };

const NEEDS_NODE = 24;

/** Whether something is already listening there, and whether it answers as this preview. */
async function portHeld(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.setTimeout(400);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

async function ours(port: number): Promise<boolean> {
  try {
    const answer = await fetch(`http://127.0.0.1:${port}/api/ping`, { signal: AbortSignal.timeout(600) });
    return (await answer.text()).includes('preview is serving');
  } catch {
    return false;
  }
}

async function writable(dir: string): Promise<boolean> {
  try {
    if (existsSync(dir)) {
      await access(dir, constants.W_OK);
      return true;
    }
    // Not there yet: the question is whether it could be made.
    const probe = await mkdtemp(join(dir, '..', 'buildings-probe-'));
    await rm(probe, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export const doctor: Verb = {
  name: 'doctor',
  summary: 'is this machine able to build and preview a building',
  usage: 'doctor [--port 4321]',
  async run(args, { projects }) {
    const { values } = parse(args, { port: { type: 'string' } });
    const port = text(values.port) ? Number(text(values.port)) : 4321;
    const checks: Check[] = [];

    const major = Number(process.versions.node.split('.')[0]);
    checks.push({
      check: 'node',
      ok: major >= NEEDS_NODE,
      is: `node ${process.versions.node}`,
      ...(major >= NEEDS_NODE ? {} : { fix: `this CLI runs TypeScript directly, which needs Node ${NEEDS_NODE} or newer. Install it and run again` }),
    });

    // Where projects live, and whether the answer is the one being used.
    const root = projects.root;
    const canWrite = await writable(root);
    const env = process.env.BUILDINGS_HOME;
    checks.push({
      check: 'home',
      ok: canWrite,
      is: `${root}${env ? ' (from BUILDINGS_HOME)' : existsSync(join(process.cwd(), LOCAL)) ? ` (the ${LOCAL} folder here)` : ' (your home)'}`,
      ...(canWrite ? {} : { fix: `nothing can be written there. Run \`buildings new <name> --here\` to keep projects in ${LOCAL} beside your work, or set BUILDINGS_HOME to somewhere you own` }),
    });

    if (env && existsSync(join(process.cwd(), LOCAL))) {
      checks.push({
        check: 'home conflict',
        ok: false,
        is: `BUILDINGS_HOME is set to ${env}, and there is also a ${LOCAL} folder here`,
        fix: `BUILDINGS_HOME wins, so the ${LOCAL} folder here is ignored. Unset it, or delete the folder, so there is one answer`,
      });
    }

    const names = await projects.list();
    const current = await projects.current();
    const built = await Promise.all(names.map(async (name) => (await projects.open(name)).project.hasModel()));
    checks.push({
      check: 'projects',
      ok: true,
      is: names.length === 0 ? 'none yet' : `${names.length}, ${built.filter(Boolean).length} built, current is ${current ?? 'none'}`,
      ...(names.length > 0 && !current ? { fix: 'no building is current. Run `buildings use <name>`' } : {}),
    });

    // The viewer is bundled on demand, so the bundler has to be installed.
    let bundler = false;
    try {
      await import('esbuild');
      bundler = true;
    } catch {
      bundler = false;
    }
    checks.push({
      check: 'viewer bundler',
      ok: bundler,
      is: bundler ? 'esbuild is installed' : 'esbuild is missing',
      ...(bundler ? {} : { fix: 'run `npm install` in the repo, or the preview page will load and stay empty' }),
    });

    // The preview is a service: it either answers or it has to be started, and if something
    // else holds the port the answer is a different port, not a different machine.
    const held = await portHeld(port);
    const mine = held ? await ours(port) : false;
    checks.push({
      check: 'preview',
      ok: mine,
      is: mine ? `serving on ${port}` : held ? `${port} is held by something that is not this preview` : `nothing is serving ${port}`,
      ...(mine
        ? {}
        : held
          ? { fix: `start it on another port: \`buildings preview --port <other>\`, or stop whatever holds ${port}` }
          : { fix: `start it: \`buildings preview${port === 4321 ? '' : ` --port ${port}`}\` (or \`npm run serve\` in the repo)` }),
    });

    const bad = checks.filter((one) => !one.ok);
    return {
      ok: bad.length === 0,
      checks,
      reads: bad.length === 0 ? 'everything this needs is here' : `${bad.length} to fix: ${bad.map((one) => one.check).join(', ')}`,
    };
  },
};

export const link: Verb = {
  name: 'link',
  summary: 'the address that opens one building in the preview, for sharing',
  usage: 'link [name] [--port 4321]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { port: { type: 'string' } });
    const port = text(values.port) ? Number(text(values.port)) : 4321;
    const { name } = await projects.open(positionals[0]);
    const serving = await portHeld(port);

    return {
      project: name,
      link: `http://127.0.0.1:${port}/?building=${name}`,
      serving,
      ...(serving ? {} : { note: `nothing is serving ${port} yet. Run \`buildings preview\` first, or the link will not open` }),
    };
  },
};

export const doctorVerbs = [doctor, link];
