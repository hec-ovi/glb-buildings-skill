/**
 * The top of the building, laid out as a floor plan rather than modelled. The deck is a grid of
 * two metre cells; each cell holds one part, and the caller says which. A quick pass can fill
 * whatever is left, seeded, so a roof is never bare and never the same twice.
 */
import { METAL, PIPE } from './names.ts';
import { nearestOn } from './plan.ts';
import { ringAt, type Corner, type SectionShape } from './section.ts';
import type { Surfaces } from './surfaces.ts';
import { CELL, block, cells, cylinder, pipe, rng, turbine, type Cell } from './deck.ts';
import { dish, mast, sector, whips } from './antenna.ts';
import { solar, tank } from './plant.ts';

export type DeckPart =
  | 'unit'
  | 'turbine'
  | 'pipe'
  | 'vent'
  | 'tower'
  | 'solar'
  | 'tank'
  | 'mast'
  | 'dish'
  | 'array'
  | 'whip';

export const DECK_PART_NOTES: Record<DeckPart, string> = {
  unit: 'an air conditioning box, low and wide',
  turbine: 'a flat round turbine with a hub and blades',
  pipe: 'a pipe that bends over and drops to the level below',
  vent: 'a round vent stack',
  tower: 'a small tower, takes the space of four cells',
  solar: 'rows of tilted solar panels on a frame, takes four cells. --turn aims them',
  tank: 'a water tank on a leg frame, with a cap, a ladder and its outlet. Takes four cells',
  mast: 'a lattice mast drawing in to a spire, guyed down to the deck. The tall one',
  dish: 'a dish on its mount, tilted at the sky. --turn aims it',
  array: 'a sector array: a pole with three panels facing out, like every cell site',
  whip: 'a cluster of thin whip aerials at different heights',
};

export type Placement = { cell: string; part: DeckPart; turn?: number };

/** How many cells a part needs, on a side. A tank or a tower wants a 2x2 block. */
export const PART_SIZE: Record<DeckPart, number> = {
  unit: 1,
  turbine: 1,
  pipe: 1,
  vent: 1,
  dish: 1,
  array: 1,
  whip: 1,
  mast: 2,
  solar: 2,
  tank: 2,
  tower: 2,
};

/** The cells a part standing at `cell` occupies, or nothing if the block runs off the deck. */
export function claim(grid: Cell[], cell: string, size: number): Cell[] | undefined {
  const anchor = grid.find((candidate) => candidate.name === cell);
  if (!anchor) return undefined;
  if (size === 1) return [anchor];

  const block: Cell[] = [];
  for (let dc = 0; dc < size; dc++) {
    for (let dr = 0; dr < size; dr++) {
      const found = grid.find((candidate) => candidate.column === anchor.column + dc && candidate.row === anchor.row + dr);
      if (!found) return undefined;
      block.push(found);
    }
  }
  return block;
}

/** The middle of a block of cells, where the part actually stands. */
function blockCentre(block: Cell[]): Corner {
  const x = block.reduce((sum, cell) => sum + cell.centre[0], 0) / block.length;
  const z = block.reduce((sum, cell) => sum + cell.centre[1], 0) / block.length;
  return [x, z];
}

/** How far a point sits from the segment `from`..`to`. */
function awayFrom(point: Corner, from: Corner, to: Corner): number {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const span = dx * dx + dz * dz;
  const t = span === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - from[0]) * dx + (point[1] - from[1]) * dz) / span));
  return Math.hypot(point[0] - (from[0] + dx * t), point[1] - (from[1] + dz * t));
}

/**
 * Every cell a part actually covers, which is not always the block it stands in. A pipe runs
 * across the deck to the nearest edge before it drops, so it covers the corridor it crosses:
 * without that the deck happily stands a dish in the middle of a pipeline.
 */
export function covers(grid: Cell[], ring: Corner[], cell: string, part: DeckPart): Cell[] | undefined {
  const block = claim(grid, cell, PART_SIZE[part] ?? 1);
  if (!block || part !== 'pipe') return block;

  const from = blockCentre(block);
  const to = nearestOn(ring, from).at;
  const held = new Set(block.map((one) => one.name));
  return [...block, ...grid.filter((one) => !held.has(one.name) && awayFrom(one.centre, from, to) <= CELL / 2)];
}

/** Parts sit this far into the deck. Two faces in the same plane flicker; these never are. */
const SINK = 0.06;

export type RooftopOptions = {
  /** What the caller put where. */
  placements?: Placement[];
  /** Fill what is left, 0 to 1. */
  clutter?: number;
  /** The footprint of the section above, whose cells are not roof at all. */
  covered?: Corner[];
  /**
   * This roof carries a mast whatever else is on it. A tower of this kind is read against the sky
   * and the lit tip is what puts it there, so it is not left to whoever composed the deck to
   * remember. One is placed as near the middle as there is room for, unless one was placed already.
   */
  mast?: boolean;
  seed: number;
};

/** Each part in what it is actually made of: plant in plate metal, aerials in galvanised steel. */
function one(kit: Surfaces, part: DeckPart, at: Corner, y: number, turn: number, random: () => number, ring: Corner[]): void {
  switch (part) {
    case 'unit':
      return block(kit.get(METAL), at, 1.3 + random() * 0.6, 0.9 + random() * 0.5, y, 0.7 + random() * 0.5, turn);
    case 'turbine':
      return turbine(kit.get(METAL), at, y, random);
    case 'pipe':
      // The pipe finds the edge for itself: dropped anywhere else it would run inside the wall.
      return pipe(kit.get(PIPE), at, ring, y, random);
    case 'vent':
      return cylinder(kit.get(PIPE), at, 0.35 + random() * 0.25, y, 1 + random() * 1.4, 8);
    case 'solar':
      return solar(kit, at, y, turn, random);
    case 'tank':
      return tank(kit, at, y, random);
    case 'mast':
      return mast(kit, at, y, random);
    case 'dish':
      return dish(kit, at, y, turn, random);
    case 'array':
      return sector(kit, at, y, turn, random);
    case 'whip':
      return whips(kit, at, y, random);
    case 'tower':
      return block(kit.get(METAL), at, 2.4 + random() * 1.2, 2.4 + random() * 1.2, y, 4 + random() * 5, turn);
  }
}

/**
 * A mast, as near the middle of the deck as there is room for. Nearest the middle because that is
 * where a mast goes and because the edge cells are where everything else wants to be.
 */
function standMast(kit: Surfaces, grid: Cell[], ring: Corner[], taken: Set<string>, y: number, random: () => number): string | undefined {
  if (grid.length === 0) return undefined;
  const middle = blockCentre(grid);
  const near = [...grid].sort(
    (a, b) => Math.hypot(a.centre[0] - middle[0], a.centre[1] - middle[1]) - Math.hypot(b.centre[0] - middle[0], b.centre[1] - middle[1]),
  );

  for (const cell of near) {
    const block = covers(grid, ring, cell.name, 'mast');
    if (!block || block.some((one) => taken.has(one.name))) continue;
    for (const one of block) taken.add(one.name);
    mast(kit, blockCentre(block), y - SINK, random);
    return cell.name;
  }
  return undefined;
}

/** A run of thin bars around the deck edge, with a rail across the top. */
function railing(kit: Surfaces, ring: Corner[], y: number, height: number): void {
  const surface = kit.get(METAL);
  y -= SINK;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const posts = Math.max(2, Math.round(run / 1.2));

    // Stops one short: the next edge starts where this one ends.
    for (let post = 0; post < posts; post++) {
      const t = post / posts;
      block(surface, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], 0.08, 0.08, y, height);
    }
    const mid: Corner = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    block(surface, mid, run, 0.06, y + height - 0.1, 0.08, -Math.atan2(b[1] - a[1], b[0] - a[0]));
  }
}

/** The parts a quick fill reaches for, and how often. */
const FILL: DeckPart[] = ['unit', 'unit', 'vent', 'turbine', 'pipe', 'whip', 'unit', 'dish', 'turbine', 'array'];

export function deckCells(shape: SectionShape, covered?: Corner[]): Cell[] {
  return cells(ringAt(shape, 1), 0.6, covered);
}

export function rooftop(kit: Surfaces, shape: SectionShape, options: RooftopOptions): void {
  const random = rng(options.seed);
  const deck = ringAt(shape, 1);
  const y = shape.height;
  const grid = cells(deck, 0.6, options.covered);
  const taken = new Set<string>();

  for (const placement of options.placements ?? []) {
    const block = claim(grid, placement.cell, PART_SIZE[placement.part] ?? 1);
    if (!block) continue;
    // What it stands on decides where it is drawn; what it covers decides what may go near it.
    for (const cell of covers(grid, deck, placement.cell, placement.part) ?? block) taken.add(cell.name);
    one(kit, placement.part, blockCentre(block), y - SINK, ((placement.turn ?? 0) * Math.PI) / 180, random, deck);
  }

  // The mast this kind of roof always carries, if nobody placed one.
  if (options.mast && !(options.placements ?? []).some((placed) => placed.part === 'mast')) {
    const stood = standMast(kit, grid, deck, taken, y, random);
    if (stood) taken.add(stood);
  }

  const clutter = Math.max(0, Math.min(1, options.clutter ?? 0));
  if (clutter === 0) {
    if (taken.size > 0) railing(kit, deck, y, 1.1);
    return;
  }

  railing(kit, deck, y, 1.1);
  const free = grid.filter((cell) => !taken.has(cell.name));
  const wanted = Math.round(free.length * clutter * 0.5);
  for (let i = 0; i < wanted && i < free.length; i++) {
    const cell = free[Math.floor(random() * free.length)]!;
    const part = FILL[Math.floor(random() * FILL.length)]!;
    const turn = random() * Math.PI;
    if (taken.has(cell.name)) continue;

    // A pipe covers the corridor it runs along, so a fill that would cross something already
    // standing is dropped rather than drawn through it.
    const over = covers(grid, deck, cell.name, part) ?? [cell];
    if (over.some((held) => taken.has(held.name))) continue;

    for (const held of over) taken.add(held.name);
    one(kit, part, cell.centre, y - SINK, turn, random, deck);
  }
}
