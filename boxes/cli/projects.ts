/**
 * Named projects. One folder per building, one of them current, so a session says
 * "use tower-a" once and every later verb knows what it is editing.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Project } from '#preview';
import { BuildingError } from '#spec';

/** Override with BUILDINGS_HOME. Never a path baked into the code. */
export function home(): string {
  return process.env.BUILDINGS_HOME ?? join(homedir(), '.glb-buildings');
}

const NAME = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export class Projects {
  readonly root: string;

  constructor(root = home()) {
    this.root = root;
  }

  get dir(): string {
    return join(this.root, 'projects');
  }

  get currentFile(): string {
    return join(this.root, 'current');
  }

  path(name: string): string {
    return join(this.dir, name);
  }

  async list(): Promise<string[]> {
    if (!existsSync(this.dir)) return [];
    const entries = await readdir(this.dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  }

  async current(): Promise<string | undefined> {
    if (!existsSync(this.currentFile)) return undefined;
    const name = (await readFile(this.currentFile, 'utf8')).trim();
    return name && existsSync(this.path(name)) ? name : undefined;
  }

  async use(name: string): Promise<void> {
    if (!existsSync(this.path(name))) {
      throw new BuildingError('E_DOC_INVALID', `no project named ${name}`, ['project', name]);
    }
    await mkdir(this.root, { recursive: true });
    await writeFile(this.currentFile, `${name}\n`);
  }

  async create(name: string): Promise<Project> {
    if (!NAME.test(name)) {
      throw new BuildingError('E_DOC_INVALID', `project name ${name} may use letters, digits, dash and underscore`, ['project', name]);
    }
    if (existsSync(this.path(name))) {
      throw new BuildingError('E_DOC_INVALID', `project ${name} already exists`, ['project', name]);
    }
    await mkdir(this.path(name), { recursive: true });
    return new Project(this.path(name));
  }

  /** The named project, or the current one. Fails when neither is set. */
  async open(name?: string): Promise<{ name: string; project: Project }> {
    const chosen = name ?? (await this.current());
    if (!chosen) {
      throw new BuildingError('E_DOC_INVALID', 'no project chosen: run `buildings new <name>` or `buildings use <name>`', ['project']);
    }
    if (!existsSync(this.path(chosen))) {
      throw new BuildingError('E_DOC_INVALID', `no project named ${chosen}`, ['project', chosen]);
    }
    return { name: chosen, project: new Project(this.path(chosen)) };
  }
}
