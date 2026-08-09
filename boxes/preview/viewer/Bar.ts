/**
 * The bottom bar: what this building is, which section you are looking at, how you are looking
 * at it, and the file out.
 *
 * Three columns and nothing else. The building speaks for itself on the left, the section walker
 * is one line in the middle, and the view and what is selected share the right, because they are
 * the same question asked twice.
 */
import type { PlacedScene } from '#assemble';
import type { BuildingDocument } from '#spec';
import { BAND_COLOUR } from './Blueprint.ts';
import { element } from './dom.ts';

/**
 * What is on screen: the drawing, the drawing over the built file, or the building on its own
 * with nothing drawn over it. `final` is the one to look at when you want to see the product.
 */
export const VIEWS = ['blueprint', 'model', 'final'] as const;
export type View = (typeof VIEWS)[number];

export type BarHandlers = {
  onView: (view: View) => void;
  /** Which section the bar is showing, so the drawing can bring it forward. */
  onSection?: (bandId: string | undefined) => void;
};

const m = (mm: number) => (mm / 1000).toFixed(2).replace(/\.?0+$/, '');
const hex = (colour: number) => `#${colour.toString(16).padStart(6, '0')}`;

type Section = { id: string; kind: string; tier: string; floors: number; height: string };

/** A tray out of a box: enough of a download to read at fourteen pixels. */
function downloadIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M8 1.5v7.5M4.75 6.25L8 9.5l3.25-3.25M2 11.5v3h12v-3');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.6');
  svg.appendChild(path);
  return svg;
}

export class Bar {
  readonly #name = element('div', 'bar-name', 'no building yet');
  readonly #size = element('div', 'bar-size', 'starting the viewer');
  readonly #brief = element('div', 'bar-brief');
  readonly #export = element('a', 'icon');
  readonly #section = element('div', 'one-section');
  readonly #of = element('div', 'of');
  readonly #selection = element('div', 'read', 'nothing selected');
  readonly #ids = element('div', 'ids');
  readonly #hint = element('div', 'hint', 'click a bay to select it · hold shift and drag to mark a zone');
  readonly #views: Record<View, HTMLButtonElement>;
  #sections: Section[] = [];
  #at = 0;
  #onSection: BarHandlers['onSection'];

  constructor(root: HTMLElement, handlers: BarHandlers) {
    root.replaceChildren();
    this.#onSection = handlers.onSection;

    this.#export.dataset.testid = 'export';
    this.#export.append(downloadIcon());
    this.#offerExport(undefined, false);

    const title = element('div', 'bar-title');
    title.append(this.#name, this.#export);

    const identity = element('div', 'bar-block identity');
    identity.append(title, this.#size, this.#brief);

    const step = (by: number) => {
      if (this.#sections.length === 0) return;
      this.#at = (this.#at + by + this.#sections.length) % this.#sections.length;
      this.#draw();
    };

    const back = element('button', 'arrow', '‹');
    back.dataset.testid = 'section-back';
    back.title = 'the section below';
    back.addEventListener('click', () => step(-1));

    const on = element('button', 'arrow', '›');
    on.dataset.testid = 'section-on';
    on.title = 'the section above';
    on.addEventListener('click', () => step(1));

    const head = element('div', 'row-line');
    head.append(element('h2', undefined, 'Section'), this.#of);

    const walk = element('div', 'walk');
    walk.append(back, this.#section, on);

    const sections = element('div', 'bar-block sections');
    sections.append(head, walk);

    const views = element('div', 'segmented');
    this.#views = {
      blueprint: this.#view('blueprint', views, handlers),
      model: this.#view('model', views, handlers),
      final: this.#view('final', views, handlers),
    };
    this.#setView('blueprint', handlers, false);

    this.#selection.dataset.testid = 'selection';
    this.#section.dataset.testid = 'section';

    const right = element('div', 'bar-block right');
    right.append(element('h2', undefined, 'View'), views, this.#selection, this.#ids, this.#hint);

    root.append(identity, sections, right);
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

  /** The file is only offered once there is one, so export never hands over a stale build. */
  #offerExport(name: string | undefined, built: boolean): void {
    const ready = built && name !== undefined;
    this.#export.setAttribute('aria-disabled', String(!ready));
    this.#export.title = ready ? `download ${name}.glb` : 'no build yet';
    if (ready) {
      this.#export.setAttribute('href', '/api/model.glb');
      this.#export.setAttribute('download', `${name}.glb`);
    } else {
      this.#export.removeAttribute('href');
      this.#export.removeAttribute('download');
    }
  }

  /** One section on screen, and the drawing told which one it is. */
  #draw(): void {
    const section = this.#sections[this.#at];
    if (!section) {
      this.#section.replaceChildren(element('div', 'chip-meta', 'no sections'));
      this.#of.textContent = '';
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
    this.#of.textContent = `${this.#at + 1} of ${this.#sections.length}`;
    this.#onSection?.(section.id);
  }

  /** Which section the bar is on, for whoever draws it. */
  get section(): string | undefined {
    return this.#sections[this.#at]?.id;
  }

  describe(doc: BuildingDocument, scene: PlacedScene, hasModel: boolean): void {
    const floors = scene.bands.reduce((n, band) => n + band.floors.length, 0);
    this.#name.textContent = doc.name;
    this.#size.textContent =
      `${m(scene.size.width)} x ${m(scene.size.depth)} x ${m(scene.size.height)} m · ` +
      `${floors} floors in ${scene.bands.length} sections · bay ${m(doc.grid.bay)} m`;
    this.#brief.textContent = doc.brief ? `“${doc.brief}”` : '';

    this.#sections = scene.bands.map((band) => ({
      id: band.id,
      kind: band.kind,
      tier: band.tier,
      floors: band.floors.length,
      height: m(band.floors.length ? band.floors[0]!.y1 - band.floors[0]!.y0 : 0),
    }));
    // Stay on the same section across a rebuild, so an edit does not move the bar under you.
    this.#at = Math.min(this.#at, Math.max(0, this.#sections.length - 1));
    this.#draw();

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
