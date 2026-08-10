import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Projects, run } from '#cli';
import { png } from '#materials';

let projects: Projects;
const call = (...argv: string[]) => run(argv, projects);

beforeEach(async () => {
  projects = new Projects(await mkdtemp(join(tmpdir(), 'buildings-')));
});

describe('projects', () => {
  it('starts a building, makes it current, and lists it', async () => {
    expect(await call('new', 'tower-a', '--floors', '10')).toMatchObject({ ok: true, project: 'tower-a' });
    expect(await call('list')).toMatchObject({ ok: true, current: 'tower-a', projects: [{ project: 'tower-a', built: false }] });
  });

  it('keeps editing the current building when no name is given', async () => {
    await call('new', 'tower-a');
    await call('new', 'tower-b');
    expect(await call('show')).toMatchObject({ project: 'tower-b' });
    await call('use', 'tower-a');
    expect(await call('show')).toMatchObject({ project: 'tower-a' });
  });

  it('takes a building away with everything in it, and leaves nothing current', async () => {
    await call('new', 'tower-a');
    await call('new', 'tower-b');
    await call('build', 'tower-b');
    expect(await call('remove', 'tower-b')).toMatchObject({ ok: true, removed: 'tower-b', left: ['tower-a'] });
    // Nothing is current afterwards: the next verb has to say which building it means.
    expect(await call('list')).toMatchObject({ current: undefined, projects: [{ project: 'tower-a' }] });
    expect(await call('remove', 'tower-b')).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });

  it('says what to do when no project is chosen yet', async () => {
    expect(await call('show')).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });

  it('describes every section with the shape it was given and what it rests on', async () => {
    await call('new', 'tower-a', '--width', '18', '--depth', '14', '--floors', '12');
    await call('set-band', 'body', '--inset', '1.5', '--twist', '20', '--wires', 'S');
    const shown = (await call('show')) as unknown as {
      size: { height: number };
      floors: number;
      bands: { id: string; width: number; inset: number; twist: number; wires: string; restsOn: string }[];
    };
    expect(shown.floors).toBe(12);
    expect(shown.size.height).toBeCloseTo(37.4, 3);

    const body = shown.bands.find((band) => band.id === 'body')!;
    expect(body).toMatchObject({ inset: 1.5, twist: 20, wires: 'S', width: 15 });
    expect(body.restsOn).toContain('rests on 100% of ground');
    expect(shown.bands[0]!.restsOn).toBe('the ground');
  });

  it('reads back the plan and the dressing, so nothing an agent sets is write only', async () => {
    await call('new', 'tower-a');
    await call('set-band', 'body', '--shape', 'round', '--arc', '240', '--greebles', '0.4', '--windows', '--columns', 'ribs');
    const shown = (await call('show')) as unknown as { bands: { id: string; plan: string; wears: string[] }[] };

    const body = shown.bands.find((band) => band.id === 'body')!;
    expect(body.plan).toContain('round');
    expect(body.plan).toContain('240');
    // Greebles are only built where a section carries nothing else, and show says which it is.
    expect(body.wears).toEqual([
      'windows cut into every bay',
      'greebles 0.4, off: this section has detail of its own',
      'columns ribs',
    ]);
  });
});

describe('a sandboxed agent', () => {
  it('keeps projects beside the work with --here, and finds them again without a flag', async () => {
    const work = await mkdtemp(join(tmpdir(), 'work-'));
    const previous = process.cwd();
    process.chdir(work);
    try {
      const made = (await run(['new', 'tower-a', '--here'])) as unknown as { ok: boolean; home: string };
      expect(made.ok).toBe(true);
      expect(made.home).toBe(join(work, '.buildings'));
      expect(existsSync(join(work, '.buildings', 'projects', 'tower-a'))).toBe(true);
      expect(await run(['show'])).toMatchObject({ project: 'tower-a', home: join(work, '.buildings') });
    } finally {
      process.chdir(previous);
    }
  });

  it('refuses --here when BUILDINGS_HOME is set, rather than stranding the project', async () => {
    const work = await mkdtemp(join(tmpdir(), 'work-'));
    const previous = process.cwd();
    process.chdir(work);
    process.env.BUILDINGS_HOME = join(work, 'elsewhere');
    try {
      const answer = (await run(['new', 'tower-a', '--here'])) as unknown as { ok: boolean; message: string };
      expect(answer.ok).toBe(false);
      expect(answer.message).toContain('BUILDINGS_HOME');
      // And nothing was written where no later verb would look for it.
      expect(existsSync(join(work, '.buildings'))).toBe(false);
    } finally {
      delete process.env.BUILDINGS_HOME;
      process.chdir(previous);
    }
  });

  it('says what to do when the home cannot be written', async () => {
    const locked = await mkdtemp(join(tmpdir(), 'locked-'));
    await mkdir(join(locked, 'projects'));
    await chmod(join(locked, 'projects'), 0o500);
    try {
      const answer = (await run(['new', 'tower-a'], new Projects(locked))) as unknown as { ok: boolean; message: string };
      expect(answer.ok).toBe(false);
      expect(answer.message).toContain('--here');
    } finally {
      await chmod(join(locked, 'projects'), 0o700);
    }
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

  it('turns windows off again, so a switch is not one way', async () => {
    await call('new', 'tower-a');
    await call('set-band', 'body', '--windows');
    const on = (await call('show')) as unknown as { bands: { id: string; wears: string[] }[] };
    expect(on.bands.find((b) => b.id === 'body')!.wears).toContain('windows cut into every bay');

    await call('set-band', 'body', '--no-windows');
    const off = (await call('show')) as unknown as { bands: { id: string; wears: string[] }[] };
    expect(off.bands.find((b) => b.id === 'body')!.wears).toEqual([]);
  });

  it('refuses a template the kit does not have, and names the ones it does', async () => {
    await call('new', 'tower-a');
    const answer = (await call('add-band', 'x', '--template', 'glass-tower')) as unknown as { ok: boolean; code: string; message: string };
    expect(answer).toMatchObject({ ok: false, code: 'E_UNKNOWN_TEMPLATE' });
    expect(answer.message).toContain('bulk-flat');
  });
});

describe('two sessions in one store', () => {
  it('pins every verb to one building with --project, whatever is current', async () => {
    await call('new', 'tower-a');
    await call('new', 'tower-b');
    expect(await call('list')).toMatchObject({ current: 'tower-b' });

    // The other session names its building outright, and never touches the current one.
    await call('--project', 'tower-a', 'set-band', 'body', '--floors', '9');
    expect(await call('list')).toMatchObject({ current: 'tower-b' });

    const a = (await call('show', 'tower-a')) as unknown as { bands: { id: string; floors: number }[] };
    const b = (await call('show', 'tower-b')) as unknown as { bands: { id: string; floors: number }[] };
    expect(a.bands.find((one) => one.id === 'body')!.floors).toBe(9);
    expect(b.bands.find((one) => one.id === 'body')!.floors).not.toBe(9);
  });

  it('pins the face verbs too, which have no name of their own', async () => {
    await call('new', 'tower-a', '--width', '12', '--depth', '9');
    await call('new', 'tower-b', '--width', '12', '--depth', '9');

    await call('--project', 'tower-a', 'put', 'window', '12,9', '19,23', '--section', 'body');
    const a = (await call('--project', 'tower-a', 'face', 'body')) as unknown as { elements: unknown[] };
    const b = (await call('--project', 'tower-b', 'face', 'body')) as unknown as { elements: unknown[] };
    expect(a.elements).toHaveLength(1);
    expect(b.elements).toHaveLength(0);
  });
});

describe('faces', () => {
  it('reads a grid, places on it in cells, and refuses a second thing on the same cell', async () => {
    await call('new', 'tower-a', '--width', '12', '--depth', '9');
    const grid = (await call('face', 'body')) as unknown as {
      grid: { cols: number; rows: number; cell: number; margin: number };
      repeats: string;
    };
    expect(grid.grid).toMatchObject({ cols: 120, rows: 32, cell: 0.1, margin: 1 });
    expect(grid.repeats).toContain('built on each of its');

    const put = (await call('put', 'window', '12,9', '19,23', '--section', 'body')) as unknown as { put: number };
    expect(put.put).toBe(1);

    const clash = (await call('put', 'panel', '15,12', '25,20', '--section', 'body')) as unknown as { ok: boolean; code: string; message: string };
    expect(clash).toMatchObject({ ok: false, code: 'E_OVERLAP' });
    expect(clash.message).toContain('window 1 on S');
  });

  it('repeats an element across the face on a pitch, so a rhythm needs no counting', async () => {
    await call('new', 'tower-a', '--width', '12', '--depth', '9');
    const put = (await call('put', 'window', '2,9', '9,23', '--section', 'body', '--every', '3')) as unknown as { put: number; on: number[][] };
    expect(put.put).toBe(4);
    expect(put.on.map((cell) => cell[0])).toEqual([2, 32, 62, 92]);
  });

  it('places a rhythm from a shape, working out the columns and stepping over what is taken', async () => {
    await call('new', 'tower-a', '--width', '30', '--depth', '20');
    await call('set-band', 'ground', '--tier', 'light', '--columns', 'ribs');

    // No column is named: a row to stand on, a size in metres, and a pitch.
    const put = (await call('put', 'window', '--row', '9', '--wide', '1.4', '--tall', '1.5', '--every', '3', '--section', 'ground')) as unknown as {
      put: number;
      skipped: number;
      on: number[][];
    };
    expect(put.put).toBeGreaterThan(0);
    // The section wears ribs, so some places were taken and were stepped over rather than failing.
    expect(put.skipped).toBeGreaterThan(0);
    expect(await call('build', 'tower-a')).toMatchObject({ ok: true });
  });

  it('centres a rhythm on the bay the wall texture draws, so a composed floor lines up with the plain ones', async () => {
    await call('new', 'tower-a', '--width', '24', '--depth', '12');
    const put = (await call('put', 'window', '--row', '9', '--wide', '1.4', '--every', '3', '--section', 'body')) as unknown as {
      on: number[][];
    };
    // A bay is 3 m and the texture puts its window in the middle of one, so a 1.4 m window on a
    // 3 m pitch starts at 0.8 m and is centred at 1.5, 4.5, 7.5 m: the same places.
    expect(put.on.map((cell) => cell[0]! + 7)).toEqual([15, 45, 75, 105, 135, 165, 195, 225]);
  });

  it('works the rhythm out on its own when no pitch is given', async () => {
    // A 28 m face carries nine whole bays of 3.11 m, not nine of 3 m and a slice. The face knows
    // that, so nobody types a pitch and nothing drifts across the face.
    await call('new', 'tower-a', '--width', '28', '--depth', '16');
    const read = (await call('face', 'body')) as unknown as { grid: { bays: number; bayCells: number }; rhythm: string };
    expect(read.grid).toMatchObject({ bays: 9, bayCells: 31 });
    expect(read.rhythm).toContain('9 bays');

    const put = (await call('put', 'window', '--row', '9', '--wide', '1.4', '--section', 'body')) as unknown as { put: number; on: number[][] };
    expect(put.put).toBe(9);
    // Nine windows, one to a bay, each centred in its own bay across the whole face.
    const centres = put.on.map((cell) => cell[0]! + 7);
    for (const [i, centre] of centres.entries()) expect(Math.abs(centre - (i + 0.5) * 280 / 9)).toBeLessThan(1);
  });

  it('says where to look when a shape fits nowhere on the face', async () => {
    await call('new', 'tower-a', '--width', '12', '--depth', '9');
    const tooBig = (await call('put', 'window', '--row', '9', '--wide', '40', '--tall', '1.5', '--section', 'body')) as unknown as {
      ok: boolean;
      code: string;
      message: string;
    };
    expect(tooBig).toMatchObject({ ok: false, code: 'E_OVERLAP' });
    expect(tooBig.message).toContain('--draw');
  });

  it('says what a face costs against its tier, before the build has to refuse it', async () => {
    await call('new', 'tower-a', '--width', '24', '--depth', '12');
    const put = (await call('put', 'balcony', '4,2', '30,15', '--section', 'body', '--every', '3')) as unknown as {
      costs: { faces: number; allowed: number; tier: string };
      note: string;
    };
    expect(put.costs.tier).toBe('flat');
    expect(put.costs.faces).toBeGreaterThan(put.costs.allowed);
    expect(put.note).toContain('richer tier');
    // And the build agrees with the warning.
    expect(await call('build')).toMatchObject({ ok: false, code: 'E_BUDGET' });
  });

  it('lays a run down the outside of a section, and refuses one that folds back on itself', async () => {
    await call('new', 'tower-a', '--width', '18', '--depth', '14');
    // The south face of an 18 by 14 building stands at z = 7, so the run clears it.
    expect(await call('run', '5,20,7.3', '5,6,7.3', '3,6,7.3', '--section', 'body')).toMatchObject({ ok: true, points: 3 });

    const fold = (await call('run', '0,10,7.3', '0,20,7.3', '0,10.5,7.3', '--section', 'body')) as unknown as { ok: boolean; message: string };
    expect(fold.ok).toBe(false);
    expect(fold.message).toContain('turns back on itself');
  });

  it('refuses a run buried in the building, and says where the section actually stands', async () => {
    await call('new', 'tower-a', '--width', '18', '--depth', '14');
    const inside = (await call('run', '0,20,0', '0,6,0', '--section', 'body')) as unknown as { ok: boolean; code: string; message: string };
    expect(inside).toMatchObject({ ok: false, code: 'E_OVERLAP' });
    expect(inside.message).toContain('spans x -9 to 9 and z -7 to 7');
  });
});

describe('build', () => {
  it('writes the file, reports what is in it, and passes the validator', async () => {
    await call('new', 'tower-a', '--floors', '12');
    const built = (await call('build')) as unknown as { ok: boolean; file: string; triangles: number; nodes: number; validator: { errors: number } };
    expect(built.ok).toBe(true);
    expect(existsSync(built.file)).toBe(true);
    expect(built.validator.errors).toBe(0);
    expect(built.nodes).toBe(3);
    expect(built.triangles).toBeLessThan(200);
  });

  it('says when a building has no way into it, without refusing to write one', async () => {
    await call('new', 'tower-a', '--floors', '8');
    // A background block is meant to have nothing composed on it, so this is said, not refused.
    const bare = (await call('build')) as unknown as { ok: boolean; missing?: string[] };
    expect(bare.ok).toBe(true);
    expect(bare.missing!.join(' ')).toContain('no door');

    await call('put', 'door', '--row', '1', '--wide', '1.8', '--tall', '2.6', '--section', 'ground', '--side', 'S');
    expect(await call('build')).not.toHaveProperty('missing');
  });

  it('builds a setback, and reports what each section rests on', async () => {
    await call('new', 'tower-a');
    await call('set-band', 'body', '--inset', '1.5');
    const built = (await call('build')) as unknown as { ok: boolean; supports: { band: string; reads: string }[] };
    expect(built.ok).toBe(true);
    expect(built.supports.map((s) => s.band)).toEqual(['body', 'crown']);
    expect(built.supports[0]!.reads).toContain('rests on');
  });

  it('refuses a section slid off the edge, and says how to bring it back', async () => {
    await call('new', 'tower-a');
    await call('set-band', 'body', '--width', '8', '--depth', '8', '--shift-x', '14');
    const answer = (await call('build')) as unknown as { ok: boolean; code: string; message: string };
    expect(answer).toMatchObject({ ok: false, code: 'E_FLOATING_PART' });
    expect(answer.message).toContain('shift-x');
  });

  it('says which band is missing when the stack has no roof on top', async () => {
    await call('new', 'tower-a');
    await call('remove-band', 'crown');
    expect(await call('build')).toMatchObject({ ok: false, code: 'E_STACK_ENDS' });
  });

  it('builds every building in one pass', async () => {
    await call('new', 'tower-a', '--floors', '6');
    await call('new', 'tower-b', '--floors', '8');
    const all = (await call('build', '--all')) as unknown as { buildings: number; failed: unknown[]; built: { project: string }[] };
    expect(all.buildings).toBe(2);
    expect(all.failed).toEqual([]);
    expect(all.built.map((one) => one.project).sort()).toEqual(['tower-a', 'tower-b']);
    expect((await call('list')) as unknown as { projects: { built: boolean }[] }).toMatchObject({
      projects: [{ built: true }, { built: true }],
    });
  }, 30_000);

  it('reports nothing picked before the human uses the preview', async () => {
    await call('new', 'tower-a');
    expect(await call('selection')).toMatchObject({ ok: true, reads: 'nothing selected' });
  });
});

describe('how a building is dressed', () => {
  it('starts modern and textured, and says so', async () => {
    await call('new', 'tower-a');
    expect(await call('show')).toMatchObject({ style: 'modern', textures: 'on' });
  });

  it('switches family and mode, and reads them back', async () => {
    await call('new', 'tower-a', '--style', 'cyber', '--textures', 'off');
    expect(await call('show')).toMatchObject({ style: 'cyber', textures: 'off' });

    expect(await call('style', 'modern')).toMatchObject({ ok: true, style: 'modern' });
    expect(await call('textures', 'on')).toMatchObject({ ok: true, textures: 'on' });
    expect(await call('show')).toMatchObject({ style: 'modern', textures: 'on' });
  });

  it('says where generated images would go, and that there are none yet', async () => {
    await call('new', 'tower-a');
    const answer = (await call('style')) as unknown as { pack: { dir: string; has: string[] } };
    expect(answer.pack.dir).toContain('textures');
    expect(answer.pack.has).toEqual([]);
  });

  it('names the families it knows and refuses one it does not', async () => {
    await call('new', 'tower-a');
    expect(await call('style', 'baroque')).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });
});

describe('a picture generated for a pack', () => {
  it('names it, pairs its emissive map, and says what grid it holds', async () => {
    await call('new', 'tower-a', '--style', 'cyber');
    const made = await mkdtemp(join(tmpdir(), 'made-'));
    const wall = join(made, 'wall.png');
    const lit = join(made, 'lit.png');
    await writeFile(wall, png({ width: 8, height: 4, rgba: new Uint8Array(8 * 4 * 4) }));
    await writeFile(lit, png({ width: 8, height: 4, rgba: new Uint8Array(8 * 4 * 4) }));

    const answer = (await call('add-texture', 'facade', wall, '--emissive', lit, '--across', '10', '--down', '3')) as unknown as {
      file: string;
      emissive: string;
      declared: unknown;
    };
    expect(answer).toMatchObject({ ok: true, style: 'cyber', finish: 'facade', variant: 1, declared: { across: 10, down: 3 } });
    expect(answer.file.endsWith('cyber/facade_1.png')).toBe(true);
    expect(answer.emissive.endsWith('cyber/facade_1-emissive.png')).toBe(true);

    // A second picture of the same finish is the next variant, and the build picks between them.
    // It holds its own grid, so one wall picture never forces the shape of another.
    expect(await call('add-texture', 'facade', wall, '--across', '6', '--down', '5')).toMatchObject({ variant: 2, pack: 2 });
    // One of the two carries an emissive map, and the pack says so: a wall with none is a
    // building with every light off, which is the least obvious way a pack can be wrong.
    expect(await call('style')).toMatchObject({
      pack: { has: ['facade x2 (1 lit)'], dark: ['facade: 1 of 2 carry no lights'] },
    });

    const declared = JSON.parse(await readFile(join(projects.textures, 'cyber', 'pack.json'), 'utf8')) as Record<string, unknown>;
    expect(declared).toEqual({ facade_1: { across: 10, down: 3 }, facade_2: { across: 6, down: 5 } });
  });

  it('declares a picture that is already there, without a file, once its bays have been counted', async () => {
    await call('new', 'tower-a', '--style', 'cyber');
    const wall = join(await mkdtemp(join(tmpdir(), 'made-')), 'wall.png');
    await writeFile(wall, png({ width: 8, height: 4, rgba: new Uint8Array(8 * 4 * 4) }));
    await call('add-texture', 'facade', wall);

    expect(await call('add-texture', 'facade', '--as', '1', '--across', '8', '--down', '4')).toMatchObject({
      declaredOnly: 'facade_1',
      declared: { across: 8, down: 4 },
    });
    // Nothing to install and nothing to say is the one thing it cannot do anything with.
    expect(await call('add-texture', 'facade', '--as', '1')).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });

  it('refuses a finish it does not have, and one that is a light rather than a surface', async () => {
    await call('new', 'tower-a');
    const wall = join(await mkdtemp(join(tmpdir(), 'made-')), 'wall.png');
    await writeFile(wall, png({ width: 8, height: 4, rgba: new Uint8Array(8 * 4 * 4) }));

    expect(await call('add-texture', 'marzipan', wall)).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
    expect(await call('add-texture', 'neon', wall)).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });
});

describe('the lit parts', () => {
  it('runs several lines up a face at different places, cycling their colours', async () => {
    await call('new', 'tower-a', '--style', 'cyber', '--floors', '14');
    const answer = (await call('line', 'body', '--side', 'S', '--count', '4', '--spacing', '3', '--colours', 'cyan,magenta')) as unknown as {
      put: number;
      lines: { along: number; colour: string }[];
    };
    expect(answer.put).toBe(4);
    expect(answer.lines.map((one) => one.colour)).toEqual(['cyan', 'magenta', 'cyan', 'magenta']);
    expect(answer.lines.map((one) => one.along)).toEqual([1.5, 4.5, 7.5, 10.5]);

    // A second face, so what is read back is per face rather than everything on the first one's side.
    await call('line', 'body', '--side', 'W', '--count', '2', '--spacing', '3');
    const shown = (await call('show')) as unknown as { bands: { id: string; wears: string[] }[] };
    const wears = shown.bands.find((one) => one.id === 'body')!.wears.join(' ');
    expect(wears).toContain('4 lit lines up the S face');
    expect(wears).toContain('2 lit lines up the W face');
  });

  it('refuses lines that would run off the end of the face', async () => {
    await call('new', 'tower-a', '--width', '12');
    expect(await call('line', 'body', '--side', 'S', '--count', '20', '--spacing', '3')).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });

  it('refuses floors the section does not have', async () => {
    await call('new', 'tower-a', '--floors', '8');
    const answer = (await call('line', 'body', '--from', '0', '--to', '40')) as unknown as { ok: boolean; message: string };
    expect(answer.ok).toBe(false);
    expect(answer.message).toContain('floors');
  });

  it('stands a screen off a face, spanning floors, and builds it', async () => {
    await call('new', 'tower-a', '--style', 'cyber', '--floors', '14', '--width', '20');
    expect(await call('screen', 'body', '--side', 'E', '--along', '2', '--width', '5', '--from', '2', '--to', '8')).toMatchObject({
      ok: true,
      spans: 'floors 2 to 8',
    });
    expect(await call('build')).toMatchObject({ ok: true, validator: { errors: 0 } });
  });

  it('fits the panel to the picture it carries, so an ad is never squashed', async () => {
    // A 1:2 portrait ad over ten 3.2 m floors has to be 16 m wide, and the verb works that out
    // rather than leaving a picture stretched across whatever width somebody typed.
    const tall = join(await mkdtemp(join(tmpdir(), 'ads-')), 'tall.png');
    await writeFile(tall, png({ width: 64, height: 128, rgba: new Uint8Array(64 * 128 * 4).fill(120) }));

    await call('new', 'tower-a', '--style', 'cyber', '--floors', '24', '--width', '30');
    const put = (await call('screen', 'body', '--side', 'S', '--along', '4', '--from', '4', '--to', '13', '--image', tall)) as unknown as {
      size: { width: number };
      fitted: string;
      picture: string;
    };

    expect(put.size.width).toBe(16);
    expect(put.fitted).toContain('comes from the picture');
    expect(put.picture).toContain('0.5');
    expect(await call('build')).toMatchObject({ ok: true, validator: { errors: 0 } });
  });

  it('wears one of the family ads when no picture is named, so no two screens are the same tile', async () => {
    const ads = join(projects.textures, 'cyber', 'ads');
    await mkdir(ads, { recursive: true });
    // Two ads of different shapes, so which one a screen took is visible in the panel it built.
    await writeFile(join(ads, 'a.png'), png({ width: 64, height: 128, rgba: new Uint8Array(64 * 128 * 4) }));
    await writeFile(join(ads, 'b.png'), png({ width: 128, height: 64, rgba: new Uint8Array(128 * 64 * 4) }));

    await call('new', 'tower-a', '--style', 'cyber', '--floors', '24', '--width', '30');
    const first = (await call('screen', 'body', '--side', 'S', '--along', '2', '--from', '2', '--to', '7')) as unknown as { image: string };
    const second = (await call('screen', 'body', '--side', 'E', '--along', '2', '--from', '2', '--to', '7')) as unknown as { image: string };

    expect(first.image.startsWith(ads)).toBe(true);
    expect(second.image).not.toBe(first.image);
    expect(await call('build')).toMatchObject({ ok: true, validator: { errors: 0 } });
  });

  it('says so when the picture a screen was given cannot be read', async () => {
    await call('new', 'tower-a');
    const answer = (await call('screen', 'body', '--width', '4', '--image', 'nowhere/screen.png')) as unknown as { ok: boolean; message: string };
    expect(answer.ok).toBe(false);
    expect(answer.message).toContain('cannot be read');
  });

  it('lights a crown and takes it off again', async () => {
    await call('new', 'tower-a', '--style', 'cyber');
    expect(await call('crown', 'crown', '--colour', 'red')).toMatchObject({ ok: true, crown: 'red' });
    expect(await call('crown', 'crown', '--off')).toMatchObject({ ok: true, crown: 'off' });
  });

  it('takes the lit parts off a section', async () => {
    await call('new', 'tower-a', '--style', 'cyber', '--floors', '12');
    await call('line', 'body', '--count', '2');
    await call('screen', 'body', '--side', 'E', '--width', '4');
    expect(await call('unlight', 'body')).toMatchObject({ ok: true, lines: 0, screens: 0 });
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

describe('the roof deck', () => {
  it('lists the grid, places parts in cells, and clears them again', async () => {
    await call('new', 'tower-a', '--floors', '8');
    await call('set-band', 'crown', '--width', '18', '--depth', '14', '--height', '3');

    const grid = (await call('deck')) as unknown as { section: string; cells: { cell: string; holds: string | null }[]; parts: { part: string }[] };
    expect(grid.section).toBe('crown');
    expect(grid.cells.length).toBeGreaterThan(4);
    expect(grid.parts.map((p) => p.part)).toContain('turbine');
    expect(grid.cells.every((cell) => cell.holds === null)).toBe(true);

    const first = grid.cells[0]!.cell;
    const second = grid.cells[1]!.cell;
    expect(await call('place', 'turbine', first, second)).toMatchObject({ part: 'turbine', deck: expect.stringContaining('2 of') });

    const after = (await call('deck')) as unknown as { cells: { cell: string; holds: string | null }[] };
    expect(after.cells.find((cell) => cell.cell === first)!.holds).toBe('turbine');

    expect(await call('unplace', first)).toMatchObject({ holds: 1 });

  });

  it('refuses a cell that is not on that roof, and says which ones are', async () => {
    await call('new', 'tower-a', '--floors', '6');
    const answer = (await call('place', 'mast', 'Z9')) as unknown as { ok: boolean; message: string };
    expect(answer.ok).toBe(false);
    expect(answer.message).toContain('has no cell Z9');
  });

  it('keeps parts from standing on top of each other, whatever size they are', async () => {
    await call('new', 'tower-a', '--floors', '8');
    await call('set-band', 'crown', '--width', '24', '--depth', '20', '--height', '3');
    const grid = (await call('deck')) as unknown as { cells: { cell: string }[] };
    const first = grid.cells[0]!.cell;

    expect(await call('place', 'tank', first)).toMatchObject({ ok: true });
    // The tank holds a 2x2 block, so its neighbours are taken too.
    const after = (await call('deck')) as unknown as { cells: { cell: string; holds: string | null }[] };
    expect(after.cells.filter((cell) => cell.holds === 'tank').length).toBe(4);

    // Its own cell can be replaced; the other three are held.
    const alsoTank = after.cells.find((cell) => cell.holds === 'tank' && cell.cell !== first)!.cell;
    const clash = (await call('place', 'turbine', alsoTank)) as unknown as { ok: boolean; message: string };
    expect(clash.ok).toBe(false);
    expect(clash.message).toContain('already holds a tank');

    expect(await call('place', 'turbine', first)).toMatchObject({ ok: true, part: 'turbine' });
  });

  it('refuses a block that runs off the edge of the deck', async () => {
    await call('new', 'tower-a', '--floors', '8');
    await call('set-band', 'crown', '--width', '18', '--depth', '14', '--height', '3');
    const grid = (await call('deck')) as unknown as { cells: { cell: string }[] };
    const last = grid.cells.at(-1)!.cell;
    const answer = (await call('place', 'tower', last)) as unknown as { ok: boolean; message: string };
    expect(answer.ok).toBe(false);
    expect(answer.message).toContain('2x2 block');
  });

  it('refuses a part the kit does not have', async () => {
    await call('new', 'tower-a', '--floors', '6');
    expect(await call('place', 'helipad', 'B2')).toMatchObject({ ok: false, code: 'E_DOC_INVALID' });
  });

  it('builds what was placed', async () => {
    await call('new', 'tower-a', '--floors', '8');
    await call('set-band', 'crown', '--width', '18', '--depth', '14', '--height', '3');
    const grid = (await call('deck')) as unknown as { cells: { cell: string }[] };
    await call('place', 'turbine', grid.cells[0]!.cell);

    const bare = (await call('build')) as unknown as { triangles: number };
    await call('place', 'mast', grid.cells[1]!.cell);
    const more = (await call('build')) as unknown as { triangles: number };
    expect(more.triangles).toBeGreaterThan(bare.triangles);
  });
});
