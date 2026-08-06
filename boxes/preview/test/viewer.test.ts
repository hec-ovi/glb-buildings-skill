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

const doc = newDocument('tower-a', { width: 18, depth: 14, floors: 6 });
const scene = assemble(doc);

beforeEach(() => {
  document.body.replaceChildren();
});

describe('hud', () => {
  it('lists every band with its tier and floor count', () => {
    const hud = new Hud(document.body, { onMode: () => {}, onModel: () => {} });
    hud.describe(doc, scene);
    expect(screen.getByText(/tower-a/)).toHaveProperty('textContent', expect.stringContaining('6 floors'));
    expect(document.querySelectorAll('.hud-band')).toHaveLength(3);
    expect(document.body.textContent).toContain('bulk-flat');
  });

  it('toggles pick and zone mode', async () => {
    const onMode = vi.fn();
    new Hud(document.body, { onMode, onModel: () => {} });
    const button = screen.getByTestId('mode');
    await userEvent.click(button);
    expect(onMode).toHaveBeenCalledWith('zone');
    expect(button.textContent).toBe('mode: zone');
    await userEvent.click(button);
    expect(onMode).toHaveBeenLastCalledWith('pick');
  });

  it('reports what is selected', () => {
    const hud = new Hud(document.body, { onMode: () => {}, onModel: () => {} });
    hud.showSelection(['body.f1.S0', 'body.f1.S1'], ['body']);
    expect(screen.getByTestId('selection').textContent).toBe('2 bays in body: body.f1.S0, body.f1.S1');
  });
});

describe('zone selection', () => {
  it('takes the bays facing the camera and leaves the far side alone', () => {
    const stage = document.createElement('div');
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
    document.body.appendChild(stage);

    const blueprint = new Blueprint(scene);
    const camera = new PerspectiveCamera(45, 800 / 600, 0.1, 5000);
    camera.position.set(0, blueprint.sizeMetres.y / 2, 200);
    camera.lookAt(0, blueprint.sizeMetres.y / 2, 0);
    camera.updateMatrixWorld(true);

    let selection: Omit<Selection, 'at'> | undefined;
    const picker = new Picker(stage, camera, blueprint, (value) => (selection = value), () => {});
    picker.setMode('zone');

    drag(stage, [0, 0], [800, 600]);

    expect(selection).toBeDefined();
    expect(selection!.mode).toBe('zone');
    expect(selection!.bayIds.length).toBeGreaterThan(0);
    expect(selection!.bayIds.every((id) => /\.S\d+$/.test(id))).toBe(true);
    expect(blueprint.selected).toEqual(selection!.bayIds);
  });

  it('reports an empty selection when the rectangle catches nothing', () => {
    const stage = document.createElement('div');
    stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
    document.body.appendChild(stage);

    const blueprint = new Blueprint(scene);
    const camera = new PerspectiveCamera(45, 800 / 600, 0.1, 5000);
    camera.position.set(0, 10, 200);
    camera.lookAt(0, 10, 0);
    camera.updateMatrixWorld(true);

    let selection: Omit<Selection, 'at'> | undefined;
    const picker = new Picker(stage, camera, blueprint, (value) => (selection = value), () => {});
    picker.setMode('zone');

    drag(stage, [0, 0], [4, 4]);

    expect(selection!.bayIds).toEqual([]);
    expect(selection!.box).toBeUndefined();
  });
});

function drag(target: HTMLElement, from: [number, number], to: [number, number]): void {
  const at = (type: string, [x, y]: [number, number]) =>
    target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));
  at('pointerdown', from);
  at('pointermove', to);
  at('pointerup', to);
}
