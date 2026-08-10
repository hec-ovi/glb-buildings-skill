/**
 * One surface per material, made on demand. A section wears a dozen things and they are not all
 * the same material any more: a pipe is a pipe, a mast is galvanised steel, the lens on its tip is
 * lit. Each lands on its own surface and comes out as its own primitive.
 *
 * The scale a material tiles at comes from the finish library, so a pipe texture wraps a pipe and
 * a concrete one covers three metres, without a caller working any of it out.
 */
import { tileOf } from '#materials';
import { Surface, type MeshData, type Patch } from './geometry.ts';

export class Surfaces {
  readonly #made = new Map<string, Surface>();

  /**
   * The surface for one material. The patch is taken from the first call for that material, which
   * is what every caller here wants: a material is drawn one way on a section, not two.
   */
  get(material: string, patch?: Patch): Surface {
    const already = this.#made.get(material);
    if (already) return already;

    const made = new Surface(material, patch, tileOf(material));
    this.#made.set(material, made);
    return made;
  }

  data(): MeshData[] {
    return [...this.#made.values()].filter((surface) => !surface.empty).map((surface) => surface.data());
  }
}
