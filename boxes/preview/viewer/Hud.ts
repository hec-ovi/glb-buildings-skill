/** The panel: what this building is, what is selected, and the two toggles. */
import type { PlacedScene } from '#assemble';
import type { BuildingDocument } from '#spec';
import type { PickerMode } from './Picker.ts';
import { BAND_COLOUR } from './Blueprint.ts';

const m = (mm: number) => (mm / 1000).toFixed(2).replace(/\.00$/, '');

export type HudHandlers = {
  onMode: (mode: PickerMode) => void;
  onModel: (show: boolean) => void;
};

export class Hud {
  readonly root: HTMLDivElement;
  readonly #title: HTMLDivElement;
  readonly #bands: HTMLDivElement;
  readonly #selection: HTMLDivElement;
  readonly #modeButton: HTMLButtonElement;
  readonly #modelButton: HTMLButtonElement;
  #mode: PickerMode = 'pick';
  #model = false;

  constructor(parent: HTMLElement, handlers: HudHandlers) {
    this.root = document.createElement('div');
    this.root.className = 'hud';

    this.#title = document.createElement('div');
    this.#title.className = 'hud-title';

    this.#bands = document.createElement('div');
    this.#bands.className = 'hud-bands';

    const controls = document.createElement('div');
    controls.className = 'hud-controls';

    this.#modeButton = document.createElement('button');
    this.#modeButton.textContent = 'mode: pick';
    this.#modeButton.dataset.testid = 'mode';
    this.#modeButton.addEventListener('click', () => {
      this.#mode = this.#mode === 'pick' ? 'zone' : 'pick';
      this.#modeButton.textContent = `mode: ${this.#mode}`;
      handlers.onMode(this.#mode);
    });

    this.#modelButton = document.createElement('button');
    this.#modelButton.textContent = 'model: off';
    this.#modelButton.dataset.testid = 'model';
    this.#modelButton.addEventListener('click', () => {
      this.#model = !this.#model;
      this.#modelButton.textContent = `model: ${this.#model ? 'on' : 'off'}`;
      handlers.onModel(this.#model);
    });

    controls.append(this.#modeButton, this.#modelButton);

    this.#selection = document.createElement('div');
    this.#selection.className = 'hud-selection';
    this.#selection.dataset.testid = 'selection';
    this.#selection.textContent = 'nothing selected';

    this.root.append(this.#title, this.#bands, controls, this.#selection);
    parent.appendChild(this.root);
  }

  describe(doc: BuildingDocument, scene: PlacedScene): void {
    const floors = scene.bands.reduce((n, band) => n + band.floors.length, 0);
    this.#title.textContent = `${doc.name} · ${m(scene.size.width)} x ${m(scene.size.depth)} x ${m(scene.size.height)} m · ${floors} floors`;

    this.#bands.replaceChildren(
      ...scene.bands.map((band) => {
        const row = document.createElement('div');
        row.className = 'hud-band';
        const height = band.floors.length ? (band.floors[0]!.y1 - band.floors[0]!.y0) : 0;
        row.innerHTML =
          `<span class="dot" style="background:#${(BAND_COLOUR[band.kind] ?? 0x8899bb).toString(16).padStart(6, '0')}"></span>` +
          `<b>${band.id}</b> ${band.kind} · ${band.tier} · ${band.floors.length} x ${m(height)} m · ${band.template}`;
        return row;
      }),
    );
  }

  showSelection(bayIds: string[], bandIds: string[]): void {
    if (bayIds.length === 0) {
      this.#selection.textContent = 'nothing selected';
      return;
    }
    const head = bayIds.slice(0, 6).join(', ');
    const tail = bayIds.length > 6 ? ` and ${bayIds.length - 6} more` : '';
    this.#selection.textContent = `${bayIds.length} bays in ${bandIds.join(', ')}: ${head}${tail}`;
  }

  fail(message: string): void {
    this.#selection.textContent = message;
  }
}
