/** The side panel: what this building is, what is selected, and the two controls. */
import type { PlacedScene } from '#assemble';
import type { BuildingDocument } from '#spec';
import type { PickerMode } from './Picker.ts';
import { BAND_COLOUR } from './Blueprint.ts';

const m = (mm: number) => (mm / 1000).toFixed(2).replace(/\.?0+$/, '');
const hex = (colour: number) => `#${colour.toString(16).padStart(6, '0')}`;

export type HudHandlers = {
  onMode: (mode: PickerMode) => void;
  onModel: (show: boolean) => void;
};

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function section(title: string, ...children: HTMLElement[]): HTMLElement {
  const box = element('section', 'section');
  box.append(element('h2', undefined, title), ...children);
  return box;
}

export class Hud {
  readonly #name = element('div', 'name', 'building');
  readonly #size = element('div', 'sub', 'no document yet');
  readonly #bands = element('div', 'bands');
  readonly #count = element('div', 'count', 'nothing selected');
  readonly #ids = element('div', 'ids');
  readonly #hint = element('div', 'hint');
  readonly #keys: HTMLElement;
  readonly #modeButtons: Record<PickerMode, HTMLButtonElement>;
  readonly #modelButton: HTMLButtonElement;
  #model = false;

  constructor(panel: HTMLElement, handlers: HudHandlers) {
    // The page ships with a line of plain HTML, so a blank screen means the page itself never
    // arrived. Once the viewer runs, the panel replaces it.
    panel.replaceChildren();
    const segmented = element('div', 'segmented');
    this.#modeButtons = {
      pick: this.#segment('pick', 'mode-pick', segmented, handlers),
      zone: this.#segment('zone', 'mode-zone', segmented, handlers),
    };
    this.#setMode('pick', handlers, false);

    this.#modelButton = element('button', 'switch');
    this.#modelButton.dataset.testid = 'model';
    this.#modelButton.setAttribute('aria-pressed', 'false');
    this.#modelButton.append(element('span', undefined, 'built model'), element('span', 'state', 'off'));
    this.#modelButton.addEventListener('click', () => {
      this.#model = !this.#model;
      this.#modelButton.setAttribute('aria-pressed', String(this.#model));
      this.#modelButton.querySelector('.state')!.textContent = this.#model ? 'on' : 'off';
      handlers.onModel(this.#model);
    });

    this.#count.dataset.testid = 'selection';
    this.#hint.textContent = 'click a bay, or drag a rectangle in zone mode';

    const keys = element('div', 'hint', 'W A S D move · Q E turn · R F up and down · mouse orbits and zooms');
    keys.style.marginTop = '14px';
    this.#keys = keys;

    panel.append(
      this.#name,
      this.#size,
      section('Bands', this.#bands),
      section('Tools', segmented, this.#modelButton),
      section('Selection', this.#count, this.#ids, this.#hint),
      section('View', this.#keys),
    );
  }

  #segment(mode: PickerMode, testid: string, parent: HTMLElement, handlers: HudHandlers): HTMLButtonElement {
    const button = element('button', undefined, mode);
    button.dataset.testid = testid;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => this.#setMode(mode, handlers, true));
    parent.appendChild(button);
    return button;
  }

  #setMode(mode: PickerMode, handlers: HudHandlers, tell: boolean): void {
    for (const [name, button] of Object.entries(this.#modeButtons)) {
      button.setAttribute('aria-pressed', String(name === mode));
    }
    this.#hint.textContent =
      mode === 'zone' ? 'drag a rectangle over the facade to mark a zone' : 'click a bay to select it';
    if (tell) handlers.onMode(mode);
  }

  describe(doc: BuildingDocument, scene: PlacedScene): void {
    const floors = scene.bands.reduce((n, band) => n + band.floors.length, 0);
    this.#name.textContent = doc.name;
    this.#size.textContent = `${m(scene.size.width)} x ${m(scene.size.depth)} x ${m(scene.size.height)} m · ${floors} floors · bay ${m(doc.grid.bay)} m`;

    this.#bands.replaceChildren(
      ...scene.bands.map((band) => {
        const row = element('div', 'band');
        const dot = element('span', 'dot');
        dot.style.background = hex(BAND_COLOUR[band.kind] ?? 0x8899bb);
        const body = element('div');
        const height = band.floors.length ? band.floors[0]!.y1 - band.floors[0]!.y0 : 0;
        body.append(
          element('div', 'id', band.id),
          element('div', 'meta', `${band.kind} · ${band.tier} · ${band.floors.length} x ${m(height)} m · ${band.template}`),
        );
        row.append(dot, body);
        return row;
      }),
    );
  }

  showSelection(bayIds: string[], bandIds: string[], floorIds: string[] = []): void {
    if (floorIds.length === 0 && bayIds.length === 0) {
      this.#count.textContent = 'nothing selected';
      this.#ids.replaceChildren();
      return;
    }
    const what = floorIds.length === 1 ? 'floor' : 'floors';
    this.#count.textContent = `${floorIds.length} ${what} in ${bandIds.join(', ')} · ${bayIds.length} bays`;
    this.#ids.replaceChildren(...floorIds.map((id) => element('span', undefined, id)));
  }

  fail(message: string): void {
    this.#count.textContent = message;
    this.#ids.replaceChildren();
  }
}
