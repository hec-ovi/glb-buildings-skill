// @vitest-environment jsdom
import { screen } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import { PerspectiveCamera, Vector3 } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assemble } from '#assemble';
import { newDocument, type Selection } from '#spec';
import type { ProjectCard } from '#preview';
import { Bar } from '../viewer/Bar.ts';
import { Blueprint } from '../viewer/Blueprint.ts';
import { Models } from '../viewer/Models.ts';
import { Picker } from '../viewer/Picker.ts';
import { boot } from '../viewer/boot.ts';
import { Fly } from '../viewer/Fly.ts';

const doc = newDocument('tower-a', { width: 18, depth: 14, floors: 6 });
const scene = assemble(doc);

const bar = () => new Bar(document.body, { onMode: () => {}, onView: () => {} });

beforeEach(() => {
  document.body.replaceChildren();
});

describe('the building bar', () => {
  it('names the building and lists every section with its tier and floor count', () => {
    bar().describe(doc, scene, false);
    expect(screen.getByText('tower-a')).toBeTruthy();
    expect(document.querySelector('.bar-size')!.textContent).toContain('6 floors');
    expect(document.querySelectorAll('.chip')).toHaveLength(3);
    expect(document.body.textContent).toContain('bulk');
  });

  it('switches between pick and zone, and shows which one is on', async () => {
    const onMode = vi.fn();
    new Bar(document.body, { onMode, onView: () => {} });
    const pick = screen.getByTestId('mode-pick');
    const zone = screen.getByTestId('mode-zone');
    expect(pick.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(zone);
    expect(onMode).toHaveBeenCalledWith('zone');
    expect(zone.getAttribute('aria-pressed')).toBe('true');
    expect(pick.getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(pick);
    expect(onMode).toHaveBeenLastCalledWith('pick');
  });

  it('offers three ways to look at it, and starts on the drawing', async () => {
    const onView = vi.fn();
    new Bar(document.body, { onMode: () => {}, onView });
    expect(screen.getByTestId('view-blueprint').getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(screen.getByTestId('view-model'));
    expect(onView).toHaveBeenCalledWith('model');
    expect(screen.getByTestId('view-model').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('view-blueprint').getAttribute('aria-pressed')).toBe('false');

    // `final` is the building on its own, which is the one to look at when it is done.
    await userEvent.click(screen.getByTestId('view-final'));
    expect(onView).toHaveBeenLastCalledWith('final');
  });

  it('offers the file only once a build exists, named after the building', () => {
    const panel = bar();
    panel.describe(doc, scene, false);
    const link = screen.getByTestId('export');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('href')).toBeNull();

    panel.describe(doc, scene, true);
    expect(link.getAttribute('aria-disabled')).toBe('false');
    expect(link.getAttribute('href')).toBe('/api/model.glb');
    expect(link.getAttribute('download')).toBe('tower-a.glb');
  });

  it('reports the floors that are selected, one chip each', () => {
    bar().showSelection(['body.f1.S0', 'body.f1.S1'], ['body'], ['body.f1']);
    expect(screen.getByTestId('selection').textContent).toBe('1 floor in body · 2 bays');
    expect([...document.querySelectorAll('.ids span')].map((n) => n.textContent)).toEqual(['body.f1']);
  });
});

describe('boot', () => {
  it('still shows both panels, and says why, when the browser gives no WebGL context', async () => {
    const stage = document.createElement('div');
    const side = document.createElement('div');
    const bottom = document.createElement('div');
    document.body.append(stage, side, bottom);

    const { ready } = boot({
      stage,
      side,
      bar: bottom,
      createRenderer: () => {
        throw new Error('Error creating WebGL context.');
      },
    });
    await ready;

    expect(screen.getByTestId('mode-pick')).toBeTruthy();
    expect(screen.getByTestId('view-final')).toBeTruthy();
    expect(side.textContent).toContain('Models');
    expect(screen.getByTestId('selection').textContent).toContain('no WebGL context');
  });
});

describe('picking', () => {
  it('takes the bays facing the camera and leaves the far side alone', () => {
    const { picker, blueprint, emitted } = mount();
    picker.setMode('zone');
    drag(picker, [0, 0], [800, 600]);

    const selection = emitted.at(-1)!;
    expect(selection.mode).toBe('zone');
    expect(selection.floorIds.length).toBeGreaterThan(0);
    // The rectangle catches the near face, and the floors it touches come whole.
    expect(selection.bayIds.some((id) => /\.N\d+$/.test(id))).toBe(true);
    expect(blueprint.selected).toEqual(selection.bayIds);
  });

  it('reports an empty selection when the rectangle catches nothing', () => {
    const { picker, emitted } = mount();
    picker.setMode('zone');
    drag(picker, [0, 0], [4, 4]);

    expect(emitted.at(-1)!.floorIds).toEqual([]);
    expect(emitted.at(-1)!.bayIds).toEqual([]);
    expect(emitted.at(-1)!.box).toBeUndefined();
  });

  it('keeps the selection when the pointer travelled, because that was the camera moving', () => {
    const { picker, blueprint, emitted } = mount();
    picker.setMode('zone');
    drag(picker, [0, 0], [800, 600]);
    const kept = blueprint.selected;
    expect(kept.length).toBeGreaterThan(0);

    picker.setMode('pick');
    drag(picker, [400, 300], [700, 120]);

    expect(emitted).toHaveLength(1);
    expect(blueprint.selected).toEqual(kept);
  });

  it('picks the one bay under a click that stayed put', () => {
    const { picker, emitted } = mount();
    picker.setMode('pick');
    drag(picker, [400, 300], [400, 300]);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]!.mode).toBe('pick');
    expect(emitted[0]!.floorIds).toHaveLength(1);
    // A pick is a floor: every bay of it, all four sides.
    expect(emitted[0]!.bayIds.length).toBeGreaterThan(4);
    expect(new Set(emitted[0]!.bayIds.map((id) => id.replace(/\.[NESW]\d+$/, '')))).toEqual(new Set(emitted[0]!.floorIds));
  });
});

function mount() {
  const stage = document.createElement('div');
  stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
  document.body.appendChild(stage);

  const blueprint = new Blueprint(scene);
  const camera = new PerspectiveCamera(45, 800 / 600, 0.1, 5000);
  camera.position.set(0, blueprint.sizeMetres.y / 2, 60);
  camera.lookAt(0, blueprint.sizeMetres.y / 2, 0);
  camera.updateMatrixWorld(true);

  const emitted: Omit<Selection, 'at'>[] = [];
  const picker = new Picker(stage, camera, blueprint, (value) => emitted.push(value), () => {});
  return { stage, blueprint, camera, picker, emitted };
}

function drag(picker: Picker, from: [number, number], to: [number, number]): void {
  const target = document.querySelector('div')!;
  const at = (type: string, [x, y]: [number, number]) =>
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
  at('pointerdown', from);
  at('pointermove', to);
  at('pointerup', to);
}

describe('view controls', () => {
  const camera = () => {
    const c = new PerspectiveCamera(45, 1, 0.1, 5000);
    c.position.set(0, 20, 60);
    return c;
  };

  it('walks the way you are looking with W and S, and strafes with A and D', () => {
    const c = camera();
    const target = new Vector3(0, 20, 0);
    const fly = new Fly(c, target);

    fly.press('w', true);
    fly.step(0.5);
    expect(c.position.z).toBeLessThan(60);
    expect(target.z).toBeLessThan(0);

    const afterForward = c.position.z;
    fly.press('w', false);
    fly.press('s', true);
    fly.step(0.5);
    expect(c.position.z).toBeGreaterThan(afterForward);

    fly.press('s', false);
    fly.press('d', true);
    fly.step(0.5);
    // Looking down -Z, the right of the screen is +X.
    expect(c.position.x).toBeGreaterThan(0);

    // And A goes the other way, from its own start, so the two cannot both drift one way.
    const back = camera();
    const strafe = new Fly(back, new Vector3(0, 20, 0));
    strafe.press('a', true);
    strafe.step(0.5);
    expect(back.position.x).toBeLessThan(0);
  });

  it('turns around the target with Q and E, keeping its distance', () => {
    const c = camera();
    const target = new Vector3(0, 20, 0);
    const fly = new Fly(c, target);
    const before = c.position.distanceTo(target);

    fly.press('q', true);
    fly.step(0.5);

    expect(c.position.distanceTo(target)).toBeCloseTo(before, 3);
    expect(c.position.x).not.toBeCloseTo(0, 3);
  });

  it('rises and falls with R and F', () => {
    const c = camera();
    const target = new Vector3(0, 20, 0);
    const fly = new Fly(c, target);

    fly.press('r', true);
    fly.step(0.5);
    expect(c.position.y).toBeGreaterThan(20);
    expect(target.y).toBeGreaterThan(20);

    fly.press('r', false);
    fly.press('f', true);
    fly.step(0.5);
    expect(target.y).toBeLessThan(21);
  });

  it('ignores keys it does not own, and stops when the key comes up', () => {
    const c = camera();
    const fly = new Fly(c, new Vector3(0, 20, 0));
    fly.press('k', true);
    expect(fly.active).toBe(false);

    fly.press('W', true);
    expect(fly.active).toBe(true);
    fly.press('w', false);
    expect(fly.active).toBe(false);

    const still = c.position.clone();
    fly.step(0.5);
    expect(c.position).toEqual(still);
  });
});

describe('the navigator', () => {
  const card = (name: string, over: Partial<ProjectCard> = {}): ProjectCard => ({
    name,
    floors: 6,
    sections: 3,
    height: 20_600,
    reads: `${name} reads like this`,
    built: false,
    ...over,
  });

  it('shows what each building is, and marks the one that is open', async () => {
    const onProject = vi.fn();
    const models = new Models(document.body, { onProject });
    models.show([card('tower-a', { built: true }), card('tower-b', { floors: 12 })], 'tower-b');

    expect(screen.getByTestId('project-tower-b').getAttribute('aria-pressed')).toBe('true');
    const open = screen.getByTestId('project-tower-a');
    expect(open.getAttribute('aria-pressed')).toBe('false');
    expect(open.textContent).toContain('tower-a reads like this');
    expect(open.textContent).toContain('6');
    expect(open.textContent).toContain('built');

    await userEvent.click(open);
    expect(onProject).toHaveBeenCalledWith('tower-a');
  });

  it('counts what the store holds, and says so when it holds nothing', () => {
    const models = new Models(document.body, { onProject: () => {} });
    models.show([card('a', { floors: 4, built: true }), card('b', { floors: 6 })], 'a');
    expect(document.querySelector('.total')!.textContent).toBe('2 buildings · 10 floors · 1 built');

    models.show([], undefined);
    expect(document.querySelector('.empty')!.textContent).toContain('buildings new');
  });
});

describe('blueprint against the model', () => {
  it('hides the panels while the built model is on, so the two never fight over depth', () => {
    const blueprint = new Blueprint(scene);
    expect(blueprint.meshes.every((mesh) => mesh.visible)).toBe(true);

    blueprint.showPanels(false);
    expect(blueprint.meshes.every((mesh) => mesh.visible)).toBe(false);

    blueprint.showPanels(true);
    expect(blueprint.meshes.every((mesh) => mesh.visible)).toBe(true);
  });

  it('takes the section outlines away too, so the finished building is seen on its own', () => {
    const blueprint = new Blueprint(scene);
    const lines = () => blueprint.root.children.flatMap((group) => group.children.filter((child) => child.type === 'LineSegments'));
    expect(lines().length).toBeGreaterThan(0);
    expect(lines().every((line) => line.visible)).toBe(true);

    blueprint.showOutlines(false);
    expect(lines().every((line) => line.visible)).toBe(false);

    blueprint.showOutlines(true);
    expect(lines().every((line) => line.visible)).toBe(true);
  });
});
