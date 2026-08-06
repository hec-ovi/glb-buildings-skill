// @vitest-environment jsdom
import { screen } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import { PerspectiveCamera, Vector3 } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assemble } from '#assemble';
import { newDocument, type Selection } from '#spec';
import { Blueprint } from '../viewer/Blueprint.ts';
import { Hud } from '../viewer/Hud.ts';
import { Picker } from '../viewer/Picker.ts';
import { boot } from '../viewer/boot.ts';
import { Fly } from '../viewer/Fly.ts';

const doc = newDocument('tower-a', { width: 18, depth: 14, floors: 6 });
const scene = assemble(doc);

beforeEach(() => {
  document.body.replaceChildren();
});

describe('panel', () => {
  it('names the building and lists every band with its tier and floor count', () => {
    const hud = new Hud(document.body, { onMode: () => {}, onModel: () => {} });
    hud.describe(doc, scene);
    expect(screen.getByText('tower-a')).toBeTruthy();
    expect(document.querySelector('.sub')!.textContent).toContain('6 floors');
    expect(document.querySelectorAll('.band')).toHaveLength(3);
    expect(document.body.textContent).toContain('bulk-flat');
  });

  it('switches between pick and zone, and shows which one is on', async () => {
    const onMode = vi.fn();
    new Hud(document.body, { onMode, onModel: () => {} });
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

  it('turns the built model on and off', async () => {
    const onModel = vi.fn();
    new Hud(document.body, { onMode: () => {}, onModel });
    await userEvent.click(screen.getByTestId('model'));
    expect(onModel).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByTestId('model'));
    expect(onModel).toHaveBeenLastCalledWith(false);
  });

  it('reports the floors that are selected, one chip each', () => {
    const hud = new Hud(document.body, { onMode: () => {}, onModel: () => {} });
    hud.showSelection(['body.f1.S0', 'body.f1.S1'], ['body'], ['body.f1']);
    expect(screen.getByTestId('selection').textContent).toBe('1 floor in body · 2 bays');
    expect([...document.querySelectorAll('.ids span')].map((n) => n.textContent)).toEqual(['body.f1']);
  });
});

describe('boot', () => {
  it('still shows the panel, and says why, when the browser gives no WebGL context', async () => {
    const stage = document.createElement('div');
    const panel = document.createElement('div');
    document.body.append(stage, panel);

    const { ready } = boot({
      stage,
      panel,
      createRenderer: () => {
        throw new Error('Error creating WebGL context.');
      },
    });
    await ready;

    expect(screen.getByTestId('mode-pick')).toBeTruthy();
    expect(screen.getByTestId('model')).toBeTruthy();
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
    expect(Math.abs(c.position.x)).toBeGreaterThan(0);
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

describe('the building picker', () => {
  it('lists every building and marks the current one', async () => {
    const onProject = vi.fn();
    const hud = new Hud(document.body, { onMode: () => {}, onModel: () => {}, onProject });
    hud.listProjects(['tower-a', 'tower-b'], 'tower-b');

    expect(screen.getByTestId('project-tower-b').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('project-tower-a').getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(screen.getByTestId('project-tower-a'));
    expect(onProject).toHaveBeenCalledWith('tower-a');
  });

  it('says the name plainly when there is only one', () => {
    const hud = new Hud(document.body, { onMode: () => {}, onModel: () => {} });
    hud.listProjects(['only-one'], 'only-one');
    expect(document.querySelector('.buildings')!.textContent).toBe('only-one');
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
});
