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
import { FACADE_WALL, gridded, tileOf } from '#materials';
import { BuildingError, type Tier } from '#spec';
import { Surface, type MeshData, type Patch } from './geometry.ts';
import { BASE, FACADE, GLASS, GLASS_BAND, PIPE, ROOF } from './names.ts';
import { cap, capRing, walls, wires, type SectionShape } from './section.ts';
import { greebles } from './greebles.ts';
import { columns, type ColumnStyle } from './columns.ts';
import { crown, line, type LineStyle } from './lines.ts';
import { rooftop } from './rooftop.ts';
import { screen, type ScreenStyle } from './screens.ts';
import { Surfaces } from './surfaces.ts';

export type Template = {
  id: string;
  tier: Tier;
  /** One line for the skill and the CLI. */
  purpose: string;
  build(shape: SectionShape): MeshData[];
};

/** One point of plain wall. Everything that is not a window takes its colour from there. */
export const WALL_PATCH: Patch = { u0: FACADE_WALL.u, u1: FACADE_WALL.u, v0: FACADE_WALL.v, v1: FACADE_WALL.v };

export { BASE, FACADE, GLASS, GLASS_BAND, ROOF, WALL, CONCRETE, METAL, PIPE, ANTENNA, BEACON, NEON } from './names.ts';

/** How many metres a tile of this material covers on this section. */
function metresOf(shape: SectionShape, material: string): number {
  return shape.scale?.[material] ?? tileOf(material);
}

/**
 * The skin of a section, in whatever it is made of. A picture drawn as bays and floors takes the
 * one point of plain wall for its caps and bevels, so they do not show a slice of somebody's
 * windows. A plain material has no such point: it tiles, and its caps tile with it.
 */
function skinOf(shape: SectionShape, material: string): Surface {
  return new Surface(material, gridded(material) ? WALL_PATCH : undefined, metresOf(shape, material));
}

function surfaces(...list: Surface[]): MeshData[] {
  return list.filter((surface) => !surface.empty).map((surface) => surface.data());
}

const TEMPLATES: Template[] = [
  {
    id: 'bulk-flat',
    tier: 'flat',
    purpose: 'a plain section: four textured walls, windows live in the image',
    build: (shape) => {
      const skin = skinOf(shape, shape.skin ?? FACADE);
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
    purpose: 'the base: street level, a plain heavier wall with no window grid, and the underside',
    build: (shape) => {
      // The base wears its own wall. A ground floor is where a building is seen from two metres,
      // and the wall tile would stack another row of lit offices on the pavement.
      const skin = skinOf(shape, BASE);
      const pane = new Surface(GLASS, WALL_PATCH);
      walls(skin, shape, pane);
      cap(skin, capRing(shape, 0), 0, false);
      cap(skin, capRing(shape, 1), shape.height, true);
      return surfaces(skin, pane);
    },
  },
  {
    id: 'bulk-glass',
    tier: 'flat',
    purpose: 'a band of nothing but lit glazing, four or five floors of it in an otherwise dark tower',
    build: (shape) => {
      const skin = skinOf(shape, GLASS_BAND);
      walls(skin, shape);
      cap(skin, capRing(shape, 0), 0, false);
      cap(skin, capRing(shape, 1), shape.height, true);
      return surfaces(skin);
    },
  },
  {
    id: 'roof-parapet',
    tier: 'light',
    purpose: 'the crown: a parapet and the roof deck that closes the building',
    build: (shape) => {
      const skin = skinOf(shape, shape.skin ?? FACADE);
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

/** A line climbing a face, in whatever colour it was given. */
export type LineSpec = LineStyle & { material: string };

export type Dressing = {
  wires?: 'none' | 'N' | 'E' | 'S' | 'W';
  columns?: ColumnStyle;
  greebles?: number;
  clutter?: number;
  deck?: { cell: string; part: string; turn?: number }[];
  covered?: [number, number][];
  seed?: number;
  /** Lit runs climbing a face, several of them across it. */
  lines?: LineSpec[];
  /** A lit run round the top of the section. */
  crown?: { material: string; thickness: number };
  /** Panels standing off a face, each with its own picture. */
  screens?: ScreenStyle[];
  /** This roof carries a mast whatever else is on it. */
  mast?: boolean;
};

/**
 * Everything a section can wear on top of its skin. Each part lands on the surface of whatever it
 * is made of, so a mast is galvanised steel, a pipe is a pipe, and a line is lit.
 */
export function dress(shape: SectionShape, options: Dressing): MeshData[] {
  const kit = new Surfaces(shape.scale);
  const skin = kit.get(FACADE, WALL_PATCH);

  if (options.wires && options.wires !== 'none') wires(kit.get(PIPE), shape, options.wires);
  if (options.columns && options.columns !== 'none') columns(skin, shape, options.columns, options.seed ?? 1);
  if (options.greebles) greebles(skin, shape, { density: options.greebles, seed: options.seed ?? 1 });
  if (options.clutter || options.deck?.length || options.mast) {
    rooftop(kit, shape, {
      clutter: options.clutter,
      placements: (options.deck ?? []) as never,
      covered: options.covered,
      mast: options.mast,
      seed: (options.seed ?? 1) ^ 0x9e37,
    });
  }
  for (const one of options.lines ?? []) line(kit.get(one.material), shape, one);
  if (options.crown) crown(kit.get(options.crown.material), shape, options.crown.thickness);
  for (const one of options.screens ?? []) screen(kit, shape, one);

  return kit.data();
}
