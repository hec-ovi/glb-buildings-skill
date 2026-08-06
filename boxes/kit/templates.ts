/**
 * Floor templates. Each one builds a single floor in its own frame: the building centre at
 * x=0, z=0, and y=0 at the floor's underside. Every floor of a band is identical, so the GLB
 * writes one mesh and points many nodes at it.
 *
 * A floor's walls are a ring of four outward quads. Stacked rings share their edges exactly,
 * and the main floor's underside plus the roof's top close the building into one shell.
 */
import { BuildingError, type Tier } from '#spec';
import { Surface, type MeshData } from './geometry.ts';

export type FloorShape = {
  /** Metres, in the floor's own frame. */
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  height: number;
};

export type Template = {
  id: string;
  tier: Tier;
  /** One line for the skill and the CLI. */
  purpose: string;
  build(shape: FloorShape): MeshData[];
};

export const FACADE = 'facade';
export const ROOF = 'roof';

function ring(shape: FloorShape, material = FACADE): Surface {
  const { x0, x1, z0, z1, height: h } = shape;
  return new Surface(material)
    .quad([x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1]) // S, faces +Z
    .quad([x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0]) // N, faces -Z
    .quad([x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1]) // E, faces +X
    .quad([x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]); // W, faces -X
}

function surfaces(...list: Surface[]): MeshData[] {
  return list.filter((surface) => !surface.empty).map((surface) => surface.data());
}

const TEMPLATES: Template[] = [
  {
    id: 'bulk-flat',
    tier: 'flat',
    purpose: 'a fake floor: four textured walls, windows live in the image',
    build: (shape) => surfaces(ring(shape)),
  },
  {
    id: 'main-plain',
    tier: 'full',
    purpose: 'the ground floor: taller walls, and the underside that closes the building',
    build: (shape) => {
      const walls = ring(shape);
      walls.cap([shape.x0, shape.z0], [shape.x1, shape.z1], 0, false);
      return surfaces(walls);
    },
  },
  {
    id: 'roof-parapet',
    tier: 'light',
    purpose: 'the crown: a parapet ring and the roof deck that closes the building',
    build: (shape) => {
      const walls = ring(shape);
      const deck = new Surface(ROOF).cap([shape.x0, shape.z0], [shape.x1, shape.z1], shape.height, true);
      return surfaces(walls, deck);
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
