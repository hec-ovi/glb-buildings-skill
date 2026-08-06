import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newDocument } from '#spec';
import { PreviewServer, Project } from '#preview';

let server: PreviewServer;
let url: string;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'preview-'));
  await new Project(dir).writeDocument(newDocument('tower-a', { width: 18, depth: 14, floors: 6 }));
  server = new PreviewServer({ dir, port: 0 });
  url = await server.start();
}, 30_000);

afterAll(async () => {
  await server.close();
});

describe('preview server', () => {
  it('serves the placed scene with its document', async () => {
    const res = await fetch(new URL('/api/scene', url));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.document.name).toBe('tower-a');
    expect(body.scene.bands.map((band: { id: string }) => band.id)).toEqual(['ground', 'body', 'crown']);
    expect(body.hasModel).toBe(false);
  });

  it('serves the viewer page and its bundle', async () => {
    expect(await (await fetch(url)).text()).toContain('<div id="stage">');
    const bundle = await fetch(new URL('/viewer.js', url));
    expect(bundle.headers.get('content-type')).toContain('javascript');
    expect((await bundle.text()).length).toBeGreaterThan(1000);
  }, 60_000);

  it('answers 404 for the model until a build exists', async () => {
    expect((await fetch(new URL('/api/model.glb', url))).status).toBe(404);
  });

  it('stores a posted selection with the server timestamp, and reads it back', async () => {
    const posted = await fetch(new URL('/api/selection', url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'zone', at: 'whenever the client says', bayIds: ['body.f1.S0'], bandIds: ['body'], floorIds: ['body.f1'] }),
    });
    const stored = await posted.json();
    expect(stored.at).not.toBe('whenever the client says');
    expect(Date.parse(stored.at)).toBeGreaterThan(0);

    const onDisk = JSON.parse(await readFile(join(dir, 'selection.json'), 'utf8'));
    expect(onDisk.bayIds).toEqual(['body.f1.S0']);
    expect((await (await fetch(new URL('/api/selection', url))).json()).bayIds).toEqual(['body.f1.S0']);
  });

  it('answers the error shape when the document is unreadable', async () => {
    const broken = await mkdtemp(join(tmpdir(), 'preview-broken-'));
    const other = new PreviewServer({ dir: broken, port: 0 });
    const otherUrl = await other.start();
    const res = await fetch(new URL('/api/scene', otherUrl));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBeTruthy();
    await other.close();
  });
});
