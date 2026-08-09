/** The bottom bar: the building on screen, its sections, the tools, and the file out. */
import type { PlacedScene } from '#assemble';
import type { BuildingDocument } from '#spec';
import { BAND_COLOUR } from './Blueprint.ts';
import { element } from './dom.ts';
import type { PickerMode } from './Picker.ts';

/**
 * What is on screen: the drawing, the drawing over the built file, or the building on its own
 * with nothing drawn over it. `final` is the one to look at when you want to see the product.
 */
export const VIEWS = ['blueprint', 'model', 'final'] as const;
export type View = (typeof VIEWS)[number];

export type BarHandlers = {
  onMode: (mode: PickerMode) => void;
  onView: (view: View) => void;
  /** Which section the bar is showing, so the drawing can bring it forward. */
  onSection?: (bandId: string | undefined) => void;
};

const m = (mm: number) => (mm / 1000).toFixed(2).replace(/\.?0+$/, '');
const hex = (colour: number) => `#${colour.toString(16).padStart(6, '0')}`;

export class Bar {
  readonly #name = element('div', 'bar-name', 'no building yet');
  readonly #size = element('div', 'bar-size', 'starting the viewer');
  readonly #section = element('div', 'one-section');
  readonly #count = element('div', 'of');
  #sections: { id: string; kind: string; tier: string; floors: number; height: string }[] = [];
  #at = 0;
  #onSection: BarHandlers['onSection'];
  readonly #selection = element('div', 'read', 'nothing selected');
  readonly #ids = element('div', 'ids');
  readonly #hint = element('div', 'hint', 'click a bay, or drag a rectangle in zone mode');
  readonly #modes: Record<PickerMode, HTMLButtonElement>;
  readonly #views: Record<View, HTMLButtonElement>;
  readonly #export = element('a', 'action');

  constructor(root: HTMLElement, handlers: BarHandlers) {
    root.replaceChildren();

    const modes = element('div', 'segmented');
    this.#modes = {
      pick: this.#mode('pick', 'mode-pick', modes, handlers),
      zone: this.#mode('zone', 'mode-zone', modes, handlers),
    };
    this.#setMode('pick', handlers, false);

    const views = element('div', 'segmented');
    this.#views = {
      blueprint: this.#view('blueprint', views, handlers),
      model: this.#view('model', views, handlers),
      final: this.#view('final', views, handlers),
    };
    this.#setView('blueprint', handlers, false);

    this.#export.dataset.testid = 'export';
    this.#export.append(element('span', undefined, 'export'), element('span', 'state', '.glb'));
    this.#offerExport(undefined, false);

    this.#selection.dataset.testid = 'selection';

    const identity = element('div', 'bar-block identity');
    identity.append(this.#name, this.#size);

    this.#onSection = handlers.onSection;
    const step = (by: number) => {
      if (this.#sections.length === 0) return;
      this.#at = (this.#at + by + this.#sections.length) % this.#sections.length;
      this.#drawSection();
    };

    const back = element('button', 'arrow', '\u2039');
    back.dataset.testid = 'section-back';
    back.addEventListener('click', () => step(-1));
    const on = element('button', 'arrow', '\u203a');
    on.dataset.testid = 'section-on';
    on.addEventListener('click', () => step(1));

    const head = element('div', 'section-head');
    head.append(element('h2', undefined, 'Section'), this.#count);

    const walk = element('div', 'walk');
    walk.append(back, this.#section, on);

    const sections = element('div', 'bar-block grow');
    sections.append(head, walk);

    const tools = element('div', 'bar-block');
    tools.append(element('h2', undefined, 'Tools'), modes, element('h2', undefined, 'View'), views);

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

  #view(view: View, parent: HTMLElement, handlers: BarHandlers): HTMLButtonElement {
    const button = element('button', undefined, view);
    button.dataset.testid = `view-${view}`;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => this.#setView(view, handlers, true));
    parent.appendChild(button);
    return button;
  }

  #setView(view: View, handlers: BarHandlers, tell: boolean): void {
    for (const [name, button] of Object.entries(this.#views)) {
      button.setAttribute('aria-pressed', String(name === view));
    }
    if (tell) handlers.onView(view);
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

    this.#sections = scene.bands.map((band) => ({
      id: band.id,
      kind: band.kind,
      tier: band.tier,
      floors: band.floors.length,
      height: m(band.floors.length ? band.floors[0]!.y1 - band.floors[0]!.y0 : 0),
    }));
    // Stay on the same section across a rebuild, so an edit does not move the bar under you.
    this.#at = Math.min(this.#at, Math.max(0, this.#sections.length - 1));
    this.#drawSection();

    this.#offerExport(doc.name, hasModel);
  }

  /** One section on screen, and the drawing told which one it is. */
  #drawSection(): void {
    const section = this.#sections[this.#at];
    if (!section) {
      this.#section.replaceChildren(element('div', 'chip-meta', 'no sections'));
      this.#count.textContent = '';
      this.#onSection?.(undefined);
      return;
    }

    const dot = element('span', 'dot');
    dot.style.background = hex(BAND_COLOUR[section.kind] ?? 0x8899bb);
    const body = element('div');
    body.append(
      element('div', 'chip-id', section.id),
      element('div', 'chip-meta', `${section.kind} · ${section.tier} · ${section.floors} x ${section.height} m`),
    );
    this.#section.replaceChildren(dot, body);
    this.#section.dataset.testid = 'section';
    this.#count.textContent = `${this.#at + 1} of ${this.#sections.length}`;
    this.#onSection?.(section.id);
  }

  /** Which section the bar is on, for whoever draws it. */
  get section(): string | undefined {
    return this.#sections[this.#at]?.id;
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
