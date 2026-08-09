/** The bottom bar: the building on screen, its sections, the tools, and the file out. */
import type { PlacedScene } from '#assemble';
import type { BuildingDocument } from '#spec';
import { BAND_COLOUR } from './Blueprint.ts';
import { element } from './dom.ts';
import type { PickerMode } from './Picker.ts';

export type BarHandlers = {
  onMode: (mode: PickerMode) => void;
  onModel: (show: boolean) => void;
};

const m = (mm: number) => (mm / 1000).toFixed(2).replace(/\.?0+$/, '');
const hex = (colour: number) => `#${colour.toString(16).padStart(6, '0')}`;

export class Bar {
  readonly #name = element('div', 'bar-name', 'no building yet');
  readonly #size = element('div', 'bar-size', 'starting the viewer');
  readonly #sections = element('div', 'strip');
  readonly #selection = element('div', 'read', 'nothing selected');
  readonly #ids = element('div', 'ids');
  readonly #hint = element('div', 'hint', 'click a bay, or drag a rectangle in zone mode');
  readonly #modes: Record<PickerMode, HTMLButtonElement>;
  readonly #model: HTMLButtonElement;
  readonly #export = element('a', 'action');
  #showing = false;

  constructor(root: HTMLElement, handlers: BarHandlers) {
    root.replaceChildren();

    const modes = element('div', 'segmented');
    this.#modes = {
      pick: this.#mode('pick', 'mode-pick', modes, handlers),
      zone: this.#mode('zone', 'mode-zone', modes, handlers),
    };
    this.#setMode('pick', handlers, false);

    this.#model = element('button', 'action');
    this.#model.dataset.testid = 'model';
    this.#model.setAttribute('aria-pressed', 'false');
    this.#model.append(element('span', undefined, 'built model'), element('span', 'state', 'off'));
    this.#model.addEventListener('click', () => {
      this.#showing = !this.#showing;
      this.#model.setAttribute('aria-pressed', String(this.#showing));
      this.#model.querySelector('.state')!.textContent = this.#showing ? 'on' : 'off';
      handlers.onModel(this.#showing);
    });

    this.#export.dataset.testid = 'export';
    this.#export.append(element('span', undefined, 'export'), element('span', 'state', '.glb'));
    this.#offerExport(undefined, false);

    this.#selection.dataset.testid = 'selection';

    const identity = element('div', 'bar-block identity');
    identity.append(this.#name, this.#size);

    const sections = element('div', 'bar-block grow');
    sections.append(element('h2', undefined, 'Sections'), this.#sections);

    const tools = element('div', 'bar-block');
    tools.append(element('h2', undefined, 'Tools'), modes, this.#model);

    const out = element('div', 'bar-block');
    out.append(element('h2', undefined, 'Selection'), this.#selection, this.#ids, this.#hint, this.#export);

    root.append(identity, sections, tools, out);
  }

  #mode(mode: PickerMode, testid: string, parent: HTMLElement, handlers: BarHandlers): HTMLButtonElement {
    const button = element('button', undefined, mode);
    button.dataset.testid = testid;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => this.#setMode(mode, handlers, true));
    parent.appendChild(button);
    return button;
  }

  #setMode(mode: PickerMode, handlers: BarHandlers, tell: boolean): void {
    for (const [name, button] of Object.entries(this.#modes)) {
      button.setAttribute('aria-pressed', String(name === mode));
    }
    this.#hint.textContent =
      mode === 'zone' ? 'drag a rectangle over the facade to mark a zone' : 'click a bay to select it';
    if (tell) handlers.onMode(mode);
  }

  /** The file is only offered once there is one, so export never hands over a stale build. */
  #offerExport(name: string | undefined, built: boolean): void {
    const ready = built && name !== undefined;
    this.#export.setAttribute('aria-disabled', String(!ready));
    this.#export.querySelector('.state')!.textContent = ready ? '.glb' : 'no build';
    if (ready) {
      this.#export.setAttribute('href', '/api/model.glb');
      this.#export.setAttribute('download', `${name}.glb`);
    } else {
      this.#export.removeAttribute('href');
      this.#export.removeAttribute('download');
    }
  }

  describe(doc: BuildingDocument, scene: PlacedScene, hasModel: boolean): void {
    const floors = scene.bands.reduce((n, band) => n + band.floors.length, 0);
    this.#name.textContent = doc.name;
    this.#size.textContent = `${m(scene.size.width)} x ${m(scene.size.depth)} x ${m(scene.size.height)} m · ${floors} floors · bay ${m(doc.grid.bay)} m`;

    this.#sections.replaceChildren(
      ...scene.bands.map((band) => {
        const chip = element('div', 'chip');
        const dot = element('span', 'dot');
        dot.style.background = hex(BAND_COLOUR[band.kind] ?? 0x8899bb);
        const height = band.floors.length ? band.floors[0]!.y1 - band.floors[0]!.y0 : 0;
        const body = element('div');
        body.append(
          element('div', 'chip-id', band.id),
          element('div', 'chip-meta', `${band.kind} · ${band.tier} · ${band.floors.length} x ${m(height)} m`),
        );
        chip.append(dot, body);
        return chip;
      }),
    );

    this.#offerExport(doc.name, hasModel);
  }

  showSelection(bayIds: string[], bandIds: string[], floorIds: string[] = []): void {
    if (floorIds.length === 0 && bayIds.length === 0) {
      this.#selection.textContent = 'nothing selected';
      this.#ids.replaceChildren();
      return;
    }
    const what = floorIds.length === 1 ? 'floor' : 'floors';
    this.#selection.replaceChildren(
      element('span', 'figure', String(floorIds.length)),
      element('span', undefined, ` ${what} in ${bandIds.join(', ')} · `),
      element('span', 'figure', String(bayIds.length)),
      element('span', undefined, ' bays'),
    );
    this.#ids.replaceChildren(...floorIds.map((id) => element('span', undefined, id)));
  }

  fail(message: string): void {
    this.#selection.textContent = message;
    this.#ids.replaceChildren();
  }
}
