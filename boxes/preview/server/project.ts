/** A building project on disk: the document, the built file, the current selection. */
import { watch, type FSWatcher } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { EMPTY_SELECTION, parseDocument, parseSelection, type BuildingDocument, type Selection } from '#spec';

export class Project {
  readonly dir: string;

  constructor(dir: string) {
    this.dir = resolve(dir);
  }

  get documentPath(): string {
    return join(this.dir, 'building.json');
  }

  get modelPath(): string {
    return join(this.dir, 'build', 'model.glb');
  }

  get selectionPath(): string {
    return join(this.dir, 'selection.json');
  }

  async readDocument(): Promise<BuildingDocument> {
    return parseDocument(JSON.parse(await readFile(this.documentPath, 'utf8')));
  }

  async writeDocument(doc: BuildingDocument): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.documentPath, `${JSON.stringify(doc, null, 2)}\n`);
  }

  hasModel(): boolean {
    return existsSync(this.modelPath);
  }

  async readModel(): Promise<Buffer> {
    return readFile(this.modelPath);
  }

  async readSelection(): Promise<Selection> {
    if (!existsSync(this.selectionPath)) return EMPTY_SELECTION;
    return parseSelection(JSON.parse(await readFile(this.selectionPath, 'utf8')));
  }

  async writeSelection(selection: Selection): Promise<Selection> {
    const stamped = { ...selection, at: new Date().toISOString() };
    await writeFile(this.selectionPath, `${JSON.stringify(stamped, null, 2)}\n`);
    return stamped;
  }

  /** Call back when the document or the built file changes. Returns a closer. */
  watch(onChange: () => void): () => void {
    const watchers: FSWatcher[] = [];
    let timer: NodeJS.Timeout | undefined;
    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(onChange, 80);
    };

    const add = (path: string) => {
      if (!existsSync(path)) return;
      const w = watch(path, fire);
      w.on('error', () => {});
      watchers.push(w);
    };

    add(this.dir);
    add(join(this.dir, 'build'));

    return () => {
      clearTimeout(timer);
      for (const w of watchers) w.close();
    };
  }
}
