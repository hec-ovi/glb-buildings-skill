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
import { FACADE_WALL } from '#materials';
import { BuildingError, type Tier } from '#spec';
import { Surface, type MeshData, type Patch } from './geometry.ts';
import { cap, capRing, edgeFacing, walls, wires, type SectionShape } from './section.ts';
import { greebles } from './greebles.ts';
import { columns, type ColumnStyle } from './columns.ts';
import { rooftop } from './rooftop.ts';

export type Template = {
  id: string;
  tier: Tier;
  /** One line for the skill and the CLI. */
  purpose: string;
  build(shape: SectionShape): MeshData[];
};

/** One point of plain wall. Everything that is not a window takes its colour from there. */
export const WALL_PATCH: Patch = { u0: FACADE_WALL.u, u1: FACADE_WALL.u, v0: FACADE_WALL.v, v1: FACADE_WALL.v };

export const FACADE = 'facade';
export const ROOF = 'roof';
export const GLASS = 'glass';

function surfaces(...list: Surface[]): MeshData[] {
  return list.filter((surface) => !surface.empty).map((surface) => surface.data());
}

const TEMPLATES: Template[] = [
  {
    id: 'bulk-flat',
    tier: 'flat',
    purpose: 'a plain section: four textured walls, windows live in the image',
    build: (shape) => {
      const skin = new Surface(FACADE, WALL_PATCH);
      const pane = new Surface(GLASS, WALL_PATCH);
      walls(skin, shape, pane);
      cap(skin, capRing(shape, 0), 0, false);
      cap(skin, capRing(shape, 1), shape.height, true);
      return surfaces(skin, pane);
    },
  },
  {
    id: 'main-plain',
    tier: 'full',
    purpose: 'the base: taller walls, and the underside that closes the building',
    build: (shape) => {
      const skin = new Surface(FACADE, WALL_PATCH);
      const pane = new Surface(GLASS, WALL_PATCH);
      walls(skin, shape, pane);
      cap(skin, capRing(shape, 0), 0, false);
      cap(skin, capRing(shape, 1), shape.height, true);
      return surfaces(skin, pane);
    },
  },
  {
    id: 'roof-parapet',
    tier: 'light',
    purpose: 'the crown: a parapet and the roof deck that closes the building',
    build: (shape) => {
      const skin = new Surface(FACADE, WALL_PATCH);
      walls(skin, shape);
      cap(skin, capRing(shape, 0), 0, false);
      const deck = new Surface(ROOF);
      cap(deck, capRing(shape, 1), shape.height, true);
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

export type Dressing = {
  wires?: 'none' | 'N' | 'E' | 'S' | 'W';
  columns?: ColumnStyle;
  greebles?: number;
  clutter?: number;
  deck?: { cell: string; part: string; turn?: number }[];
  covered?: [number, number][];
  seed?: number;
};

/** Everything a section can wear on top of its skin: cables, balconies, columns, fake parts. */
export function dress(shape: SectionShape, options: Dressing): MeshData[] {
  const surface = new Surface(FACADE, WALL_PATCH);

  if (options.wires && options.wires !== 'none') wires(surface, shape, options.wires);
  if (options.columns && options.columns !== 'none') columns(surface, shape, options.columns, options.seed ?? 1);
  if (options.greebles) greebles(surface, shape, { density: options.greebles, seed: options.seed ?? 1 });
  if (options.clutter || options.deck?.length) {
    rooftop(surface, shape, {
      clutter: options.clutter,
      placements: (options.deck ?? []) as never,
      covered: options.covered,
      seed: (options.seed ?? 1) ^ 0x9e37,
    });
  }

  return surfaces(surface);
}
