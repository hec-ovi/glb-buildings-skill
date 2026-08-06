/** Bundles the viewer into one ES module. esbuild runs in process, no build step to remember. */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const ENTRY = fileURLToPath(new URL('../viewer/main.ts', import.meta.url));

export class ViewerBundle {
  #cache: string | undefined;

  /** Build once and keep it. Pass `fresh` to rebuild after a source change. */
  async code(fresh = false): Promise<string> {
    if (this.#cache && !fresh) return this.#cache;
    const result = await build({
      entryPoints: [ENTRY],
      bundle: true,
      format: 'esm',
      target: 'es2022',
      platform: 'browser',
      write: false,
      minify: false,
      sourcemap: 'inline',
    });
    const file = result.outputFiles[0];
    if (!file) throw new Error('viewer bundle produced no output');
    this.#cache = file.text;
    return this.#cache;
  }
}
