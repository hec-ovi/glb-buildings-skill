/**
 * The loop the human actually works in: the page is open, the agent edits, the page catches up.
 * This drives the real CLI against a real server and waits on the real event stream.
 */
import { get } from 'node:http';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Projects, run } from '#cli';
import { PreviewServer } from '#preview';

let projects: Projects;
let server: PreviewServer;
let url: string;

/** Resolves on the next `changed` the server sends. */
function nextChange(timeout = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = get(new URL('/api/events', url), (response) => {
      const timer = setTimeout(() => {
        request.destroy();
        reject(new Error('no change arrived'));
      }, timeout);

      response.on('data', (chunk: Buffer) => {
        if (!chunk.toString().includes('event: changed')) return;
        clearTimeout(timer);
        request.destroy();
        resolve();
      });
    });
    request.on('error', reject);
  });
}

async function scene(): Promise<{ document: { name: string; bands: { id: string; floors: number }[] }; hasModel: boolean }> {
  const response = await fetch(new URL('/api/scene', url));
  return response.json() as never;
}

beforeAll(async () => {
  projects = new Projects(await mkdtemp(join(tmpdir(), 'live-')));
  await run(['new', 'tower-a', '--floors', '8'], projects);

  server = new PreviewServer({
    resolve: async () => (await projects.open()).project.dir,
    watchRoot: projects.root,
    port: 0,
    projects: {
      list: () => projects.list(),
      current: () => projects.current(),
      use: (name: string) => projects.use(name),
    },
  });
  url = await server.start();
}, 30_000);

afterAll(async () => {
  await server.close();
});

describe('editing while the page is open', () => {
  it('tells the page when a section changes, and serves the new stack', async () => {
    const changed = nextChange();
    await run(['set-band', 'body', '--floors', '12', '--height', '3.5'], projects);
    await changed;

    const body = (await scene()).document.bands.find((band) => band.id === 'body')!;
    expect(body.floors).toBe(12);
  });

  it('tells the page when a section is added, and again when it goes', async () => {
    const added = nextChange();
    await run(['add-band', 'pad', '--kind', 'custom', '--tier', 'light', '--template', 'bulk-flat', '--floors', '1', '--after', 'body'], projects);
    await added;
    expect((await scene()).document.bands.map((band) => band.id)).toEqual(['ground', 'body', 'pad', 'crown']);

    const removed = nextChange();
    await run(['remove-band', 'pad'], projects);
    await removed;
    expect((await scene()).document.bands.map((band) => band.id)).toEqual(['ground', 'body', 'crown']);
  });

  it('tells the page when a build lands, and then serves the model', async () => {
    expect((await scene()).hasModel).toBe(false);

    const built = nextChange(20_000);
    await run(['build'], projects);
    await built;

    expect((await scene()).hasModel).toBe(true);
    expect((await fetch(new URL('/api/model.glb', url))).status).toBe(200);
  }, 30_000);

  it('follows the human to another building', async () => {
    await run(['new', 'tower-b', '--floors', '4'], projects);
    expect((await scene()).document.name).toBe('tower-b');

    const switched = nextChange();
    await run(['use', 'tower-a'], projects);
    await switched;
    expect((await scene()).document.name).toBe('tower-a');
  });
});

describe('switching buildings from the page', () => {
  it('lists them and moves the page to the one that is picked', async () => {
    await run(['new', 'tower-c', '--floors', '5'], projects);

    const listed = (await (await fetch(new URL('/api/projects', url))).json()) as { projects: string[]; current: string };
    expect(listed.projects).toContain('tower-a');
    expect(listed.projects).toContain('tower-c');
    expect(listed.current).toBe('tower-c');

    const changed = nextChange();
    const answer = await fetch(new URL('/api/projects', url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'tower-a' }),
    });
    expect(answer.status).toBe(200);
    await changed;

    expect((await scene()).document.name).toBe('tower-a');
  });
});
