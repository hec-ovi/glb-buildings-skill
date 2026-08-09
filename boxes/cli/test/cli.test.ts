import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp } from 'node:fs/promises';
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
    expect(await call('list')).toMatchObject({ ok: true, current: 'tower-a', projects: [{ project: 'tower-a', built: false }] });
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
