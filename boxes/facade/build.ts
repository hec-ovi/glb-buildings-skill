/** A section's faces, composed. Grids in, one mesh per material out. */
import { Surface, type MeshData, type SectionShape } from '#kit';
import { Face, Sheet, type Side } from './grid.ts';
import { build as buildElement, checkKind, claims, type Element } from './elements.ts';

export type FacePlan = { side: Side; elements: Element[] };

/**
 * Every element on every face of a section, proved as it goes: each one claims its cells, so a
 * second element in them is refused before any geometry exists, and every kind is checked
 * against the little it has to obey.
 */
export function dressFaces(shape: SectionShape, plans: FacePlan[]): MeshData[] {
  const surfaces = new Map<string, Surface>();

  for (const plan of plans) {
    const face = new Face(shape, plan.side);
    const sheet = new Sheet(face);

    plan.elements.forEach((element, index) => {
      sheet.claim(claims(element), `${element.kind} ${index + 1} on ${plan.side}`);
      checkKind(element, plan.elements);

      const surface = surfaces.get(element.material) ?? new Surface(element.material);
      surfaces.set(element.material, surface);
      buildElement(surface, face, element);
    });
  }

  return [...surfaces.values()].filter((surface) => !surface.empty).map((surface) => surface.data());
}

/** The face as it stands, for printing back to whoever is composing it. */
export function readFace(shape: SectionShape, plan: FacePlan): { face: Face; sheet: Sheet } {
  const face = new Face(shape, plan.side);
  const sheet = new Sheet(face);
  plan.elements.forEach((element, index) => {
    sheet.claim(claims(element), `${element.kind} ${index + 1} on ${plan.side}`);
  });
  return { face, sheet };
}
