/**
 * Turning mouse work into a selection: one click picks a bay, a dragged rectangle picks
 * every bay whose centre falls inside it and faces the camera.
 */
import { Raycaster, Vector2, Vector3, type Camera, type InstancedMesh } from 'three';
import type { Selection } from '#spec';
import type { BayHandle, Blueprint } from './Blueprint.ts';

export type PickerMode = 'pick' | 'zone';

type Emit = (selection: Omit<Selection, 'at'>) => void;

function selectionOf(mode: PickerMode, handles: BayHandle[]): Omit<Selection, 'at'> {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const handle of handles) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis]!, handle.bay.box.min[axis]!);
      max[axis] = Math.max(max[axis]!, handle.bay.box.max[axis]!);
    }
  }
  return {
    mode,
    bayIds: handles.map((h) => h.bay.id),
    floorIds: [...new Set(handles.map((h) => h.floorId))],
    bandIds: [...new Set(handles.map((h) => h.band.id))],
    box: handles.length ? { min, max } : undefined,
  };
}

export class Picker {
  mode: PickerMode = 'pick';
  #dragging = false;
  #start = new Vector2();
  #end = new Vector2();
  #downPixels: [number, number] = [0, 0];
  readonly #ray = new Raycaster();
  readonly #rect: HTMLDivElement;

  readonly #dom: HTMLElement;
  readonly #camera: Camera;
  readonly #emit: Emit;
  readonly #setOrbit: (enabled: boolean) => void;
  #blueprint: Blueprint;

  constructor(dom: HTMLElement, camera: Camera, blueprint: Blueprint, emit: Emit, setOrbit: (enabled: boolean) => void) {
    this.#dom = dom;
    this.#camera = camera;
    this.#blueprint = blueprint;
    this.#emit = emit;
    this.#setOrbit = setOrbit;

    this.#rect = document.createElement('div');
    this.#rect.className = 'zone-rect';
    this.#rect.hidden = true;
    this.#dom.appendChild(this.#rect);

    this.#dom.addEventListener('pointerdown', this.#down);
    this.#dom.addEventListener('pointermove', this.#move);
    this.#dom.addEventListener('pointerup', this.#up);
  }

  /** Point at a freshly built blueprint after the document changed. */
  retarget(blueprint: Blueprint): void {
    this.#blueprint = blueprint;
  }

  setMode(mode: PickerMode): void {
    this.mode = mode;
    this.#setOrbit(mode === 'pick');
  }

  dispose(): void {
    this.#dom.removeEventListener('pointerdown', this.#down);
    this.#dom.removeEventListener('pointermove', this.#move);
    this.#dom.removeEventListener('pointerup', this.#up);
    this.#rect.remove();
  }

  #ndc(event: PointerEvent): Vector2 {
    const rect = this.#dom.getBoundingClientRect();
    return new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
  }

  #down = (event: PointerEvent): void => {
    this.#downPixels = [event.clientX, event.clientY];
    if (this.mode !== 'zone') return;
    this.#dragging = true;
    this.#start = this.#ndc(event);
    this.#end = this.#start.clone();
    this.#rect.hidden = false;
    this.#paintRect();
  };

  /** A pointer that travelled was the camera being moved, not a click on a bay. */
  #travelled(event: PointerEvent): boolean {
    const [x, y] = this.#downPixels;
    return Math.abs(event.clientX - x) > 4 || Math.abs(event.clientY - y) > 4;
  }

  #move = (event: PointerEvent): void => {
    if (!this.#dragging) return;
    this.#end = this.#ndc(event);
    this.#paintRect();
  };

  #up = (event: PointerEvent): void => {
    if (this.mode === 'pick') {
      if (!this.#travelled(event)) this.#pick(event);
      return;
    }
    if (!this.#dragging) return;
    this.#dragging = false;
    this.#rect.hidden = true;
    this.#end = this.#ndc(event);
    this.#zone();
  };

  #paintRect(): void {
    const rect = this.#dom.getBoundingClientRect();
    const toPx = (v: Vector2) => ({ x: ((v.x + 1) / 2) * rect.width, y: ((1 - v.y) / 2) * rect.height });
    const a = toPx(this.#start);
    const b = toPx(this.#end);
    this.#rect.style.left = `${Math.min(a.x, b.x)}px`;
    this.#rect.style.top = `${Math.min(a.y, b.y)}px`;
    this.#rect.style.width = `${Math.abs(a.x - b.x)}px`;
    this.#rect.style.height = `${Math.abs(a.y - b.y)}px`;
  }

  #pick(event: PointerEvent): void {
    this.#ray.setFromCamera(this.#ndc(event), this.#camera);
    const hits = this.#ray.intersectObjects(this.#blueprint.meshes, false);
    const hit = hits[0];
    if (!hit || hit.instanceId === undefined) {
      this.#blueprint.select([]);
      this.#emit(selectionOf('pick', []));
      return;
    }
    const handle = this.#blueprint.handleAt(hit.object as InstancedMesh, hit.instanceId);
    if (!handle) return;
    this.#blueprint.select([handle.bay.id]);
    this.#emit(selectionOf('pick', [handle]));
  }

  #zone(): void {
    const minX = Math.min(this.#start.x, this.#end.x);
    const maxX = Math.max(this.#start.x, this.#end.x);
    const minY = Math.min(this.#start.y, this.#end.y);
    const maxY = Math.max(this.#start.y, this.#end.y);
    const eye = this.#camera.position;
    const toBay = new Vector3();

    const inside = this.#blueprint.handles.filter((handle) => {
      toBay.copy(handle.centre).sub(eye);
      if (handle.normal.dot(toBay) >= 0) return false; // facing away, it is the far side
      const p = handle.centre.clone().project(this.#camera);
      return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY && p.z < 1;
    });

    this.#blueprint.select(inside.map((h) => h.bay.id));
    this.#emit(selectionOf('zone', inside));
  }
}
