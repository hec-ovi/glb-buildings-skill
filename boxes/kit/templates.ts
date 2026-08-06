/**
 * Section templates. A template is the skin of one section: the loft between the footprint it
 * starts on and the one it ends on, closed at both ends. The section is the design unit, so a
 * shape, a twist or a run of cables belongs to one section and stops there.
 *
 * Every section is a closed solid of its own and sinks a little into the one below, the way a
 * kitbashed building is put together. That is what lets a section step out, slide across or
 * turn 45 degrees without a seam to negotiate.
 *
 * Everything is metres, in the section's own frame: world X and Z, y=0 at its underside.
 */
import { BuildingError, type Tier } from '#spec';
import { Surface, type MeshData } from './geometry.ts';
import { cap, ringAt, walls, wires, type SectionShape } from './section.ts';

export type Template = {
  id: string;
  tier: Tier;
  /** One line for the skill and the CLI. */
  purpose: string;
  build(shape: SectionShape): MeshData[];
};

export const FACADE = 'facade';
export const ROOF = 'roof';

function surfaces(...list: Surface[]): MeshData[] {
  return list.filter((surface) => !surface.empty).map((surface) => surface.data());
}

const TEMPLATES: Template[] = [
  {
    id: 'bulk-flat',
    tier: 'flat',
    purpose: 'a plain section: four textured walls, windows live in the image',
    build: (shape) => {
      const skin = new Surface(FACADE);
      walls(skin, shape);
      cap(skin, ringAt(shape, 0), 0, false);
      cap(skin, ringAt(shape, 1), shape.height, true);
      return surfaces(skin);
    },
  },
  {
    id: 'main-plain',
    tier: 'full',
    purpose: 'the base: taller walls, and the underside that closes the building',
    build: (shape) => {
      const skin = new Surface(FACADE);
      walls(skin, shape);
      cap(skin, ringAt(shape, 0), 0, false);
      cap(skin, ringAt(shape, 1), shape.height, true);
      return surfaces(skin);
    },
  },
  {
    id: 'roof-parapet',
    tier: 'light',
    purpose: 'the crown: a parapet and the roof deck that closes the building',
    build: (shape) => {
      const skin = new Surface(FACADE);
      walls(skin, shape);
      cap(skin, ringAt(shape, 0), 0, false);
      const deck = new Surface(ROOF);
      cap(deck, ringAt(shape, 1), shape.height, true);
      return surfaces(skin, deck);
    },
  },
];

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export const TEMPLATE_IDS: string[] = TEMPLATES.map((t) => t.id);

export function template(id: string): Template {
  const found = BY_ID.get(id);
  if (!found) {
    throw new BuildingError('E_UNKNOWN_TEMPLATE', `no template named ${id}, the kit has ${TEMPLATE_IDS.join(', ')}`, [id]);
  }
  return found;
}

export function templates(): Template[] {
  return [...TEMPLATES];
}

/** Cables climbing one face of a section, added to whatever the template built. */
export function wireRun(shape: SectionShape, side: 'N' | 'E' | 'S' | 'W'): MeshData[] {
  const surface = new Surface(FACADE);
  wires(surface, shape, side);
  return surfaces(surface);
}
