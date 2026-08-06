// @vitest-environment jsdom
import { screen } from '@testing-library/dom';
import { userEvent } from '@testing-library/user-event';
import { PerspectiveCamera } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assemble } from '#assemble';
import { newDocument, type Selection } from '#spec';
import { Blueprint } from '../viewer/Blueprint.ts';
import { Hud } from '../viewer/Hud.ts';
import { Picker } from '../viewer/Picker.ts';
import { boot } from '../viewer/boot.ts';

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

  it('reports what is selected, one chip per bay', () => {
    const hud = new Hud(document.body, { onMode: () => {}, onModel: () => {} });
    hud.showSelection(['body.f1.S0', 'body.f1.S1'], ['body']);
    expect(screen.getByTestId('selection').textContent).toBe('2 bays in body');
    expect([...document.querySelectorAll('.ids span')].map((n) => n.textContent)).toEqual(['body.f1.S0', 'body.f1.S1']);
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
    expect(selection.bayIds.length).toBeGreaterThan(0);
    expect(selection.bayIds.every((id) => /\.S\d+$/.test(id))).toBe(true);
    expect(blueprint.selected).toEqual(selection.bayIds);
  });

  it('reports an empty selection when the rectangle catches nothing', () => {
    const { picker, emitted } = mount();
    picker.setMode('zone');
    drag(picker, [0, 0], [4, 4]);

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
    expect(emitted[0]!.bayIds).toHaveLength(1);
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
