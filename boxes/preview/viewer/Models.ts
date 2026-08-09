/** The side navigator: every building you have, what each one is, and which is open. */
import type { ProjectCard } from '../server/server.ts';
import { element } from './dom.ts';

export type ModelsHandlers = {
  onProject: (name: string) => void;
};

const metres = (mm: number) => (mm / 1000).toFixed(1).replace(/\.0$/, '');

export class Models {
  readonly #rows = element('div', 'rows');
  readonly #total = element('div', 'total');
  readonly #onProject: (name: string) => void;

  constructor(root: HTMLElement, handlers: ModelsHandlers) {
    root.replaceChildren();
    this.#onProject = handlers.onProject;

    const head = element('div', 'head');
    head.append(element('h1', 'title', 'Models'), element('div', 'hint', 'click one to open it'));

    this.#total.textContent = 'reading the store';
    root.append(head, this.#rows, this.#total);
  }

  /** Redraw the list. The current building is the one the CLI is editing. */
  show(projects: ProjectCard[], current: string | undefined): void {
    if (projects.length === 0) {
      this.#rows.replaceChildren(element('div', 'empty', 'no buildings yet: run buildings new <name>'));
      this.#total.textContent = '0 buildings';
      return;
    }

    this.#rows.replaceChildren(...projects.map((card) => this.#row(card, card.name === current)));

    const floors = projects.reduce((sum, card) => sum + card.floors, 0);
    const built = projects.filter((card) => card.built).length;
    this.#total.replaceChildren(
      element('span', 'figure', String(projects.length)),
      element('span', undefined, projects.length === 1 ? ' building · ' : ' buildings · '),
      element('span', 'figure', String(floors)),
      element('span', undefined, ' floors · '),
      element('span', 'figure', String(built)),
      element('span', undefined, ' built'),
    );
  }

  #row(card: ProjectCard, open: boolean): HTMLElement {
    const row = element('button', 'row');
    row.dataset.testid = `project-${card.name}`;
    row.setAttribute('aria-pressed', String(open));

    const top = element('div', 'row-top');
    top.append(
      element('span', 'row-name', card.name),
      element('span', card.built ? 'tag built' : 'tag', card.built ? 'built' : 'no build'),
    );

    const figures = element('div', 'row-figures');
    figures.append(
      element('span', 'figure', String(card.floors)),
      element('span', undefined, ' floors · '),
      element('span', 'figure', String(card.sections)),
      element('span', undefined, ' sections · '),
      element('span', 'figure', metres(card.height)),
      element('span', undefined, ' m'),
    );

    row.append(top, figures);
    // What it was asked for, then what it actually came out as.
    if (card.brief) row.append(element('div', 'row-brief', `“${card.brief}”`));
    row.append(element('div', 'row-reads', card.reads));
    row.addEventListener('click', () => this.#onProject(card.name));
    return row;
  }
}
