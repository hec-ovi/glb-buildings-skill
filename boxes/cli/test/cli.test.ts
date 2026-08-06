import { existsSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Projects, run } from '#cli';

let projects: Projects;
const call = (...argv: string[]) => run(argv, projects);

beforeEach(async () => {
  projects = new Projects(await mkdtemp(join(tmpdir(), 'buildings-')));
});

describe('projects', () => {
  it('starts a building, makes it current, and lists it', async () => {
    expect(await call('new', 'tower-a', '--floors', '10')).toMatchObject({ ok: true, project: 'tower-a' });
    expect(await call('list')).toMatchObject({ ok: true, current: 'tower-a', projects: ['tower-a'] });
  });

  it('keeps editing the current building when no name is given', async () => {
    await call('new', 'tower-a');
    await call('new', 'tower-b');
    expect(await call('show')).toMatchObject({ project: 'tower-b' });
    await call('use', 'tower-a');
    expect(await call('show')).toMatchObject({ project: 'tower-a' });
  });

  it('says what to do when no project is chosen yet', async () => {
    expect(await call('show')).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });

  it('describes the stack band by band, with the seams that let them stack', async () => {
    await call('new', 'tower-a', '--width', '18', '--depth', '14', '--floors', '12');
    const shown = (await call('show')) as unknown as { size: { height: number }; floors: number; bands: { id: string; stacksOnBelow: boolean }[] };
    expect(shown.floors).toBe(12);
    expect(shown.size.height).toBeCloseTo(37.4, 3);
    expect(shown.bands.every((band) => band.stacksOnBelow)).toBe(true);
  });
});

describe('bands', () => {
  it('adds, changes and removes a band', async () => {
    await call('new', 'tower-a');
    expect(await call('add-band', 'sky', '--kind', 'custom', '--tier', 'light', '--template', 'bulk-flat', '--floors', '2', '--after', 'body')).toMatchObject({
      bands: ['ground', 'body', 'sky', 'crown'],
    });
    await call('set-band', 'sky', '--floors', '4', '--height', '4');
    const shown = (await call('show')) as unknown as { bands: { id: string; floors: number; floorHeight: number }[] };
    const sky = shown.bands.find((b) => b.id === 'sky')!;
    expect(sky).toMatchObject({ floors: 4, floorHeight: 4 });
    expect(await call('remove-band', 'sky')).toMatchObject({ bands: ['ground', 'body', 'crown'] });
  });

  it('refuses a template the kit does not have, and names the ones it does', async () => {
    await call('new', 'tower-a');
    const answer = (await call('add-band', 'x', '--template', 'glass-tower')) as unknown as { ok: boolean; code: string; message: string };
    expect(answer).toMatchObject({ ok: false, code: 'E_UNKNOWN_TEMPLATE' });
    expect(answer.message).toContain('bulk-flat');
  });
});

describe('build', () => {
  it('writes the file, reports what is in it, and passes the validator', async () => {
    await call('new', 'tower-a', '--floors', '12');
    const built = (await call('build')) as unknown as { ok: boolean; file: string; triangles: number; nodes: number; validator: { errors: number } };
    expect(built.ok).toBe(true);
    expect(existsSync(built.file)).toBe(true);
    expect(built.validator.errors).toBe(0);
    expect(built.nodes).toBe(12);
    expect(built.triangles).toBeLessThan(200);
  });

  it('reports nothing picked before the human uses the preview', async () => {
    await call('new', 'tower-a');
    expect(await call('selection')).toMatchObject({ ok: true, reads: 'nothing selected' });
  });
});

describe('help', () => {
  it('lists every verb with its usage', async () => {
    const answer = (await call('help')) as unknown as { verbs: { verb: string }[] };
    expect(answer.verbs.map((v) => v.verb)).toContain('build');
    expect(answer.verbs.length).toBeGreaterThan(8);
  });

  it('names the mistake when the verb is unknown', async () => {
    expect(await call('bulid')).toMatchObject({ ok: false, message: expect.stringContaining('no verb named bulid') });
  });
});
