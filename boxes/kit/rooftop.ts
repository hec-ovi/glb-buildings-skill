/**
 * The top of the building, laid out as a floor plan rather than modelled. The deck is a grid of
 * two metre cells; each cell holds one part, and the caller says which. A quick pass can fill
 * whatever is left, seeded, so a roof is never bare and never the same twice.
 */
import { Surface } from './geometry.ts';
import { ringAt, type Corner, type SectionShape } from './section.ts';
import { block, cells, cylinder, pipe, rng, turbine, type Cell } from './deck.ts';

export type DeckPart = 'unit' | 'turbine' | 'pipe' | 'panel' | 'mast' | 'tank' | 'tower' | 'vent';

export const DECK_PART_NOTES: Record<DeckPart, string> = {
  unit: 'an air conditioning box, low and wide',
  turbine: 'a flat round turbine with a hub and blades',
  pipe: 'a pipe that bends over and drops to the level below',
  panel: 'a solar panel on short legs',
  mast: 'a mast with harness rings and spikes',
  tank: 'a water tank on four legs, takes the space of four cells',
  tower: 'a small tower, takes the space of four cells',
  vent: 'a round vent stack',
};

export type Placement = { cell: string; part: DeckPart; turn?: number };

/** How many cells a part needs, on a side. A tank or a tower wants a 2x2 block. */
export const PART_SIZE: Record<DeckPart, number> = {
  unit: 1,
  turbine: 1,
  pipe: 1,
  panel: 1,
  mast: 1,
  vent: 1,
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
export function blockCentre(block: Cell[]): Corner {
  const x = block.reduce((sum, cell) => sum + cell.centre[0], 0) / block.length;
  const z = block.reduce((sum, cell) => sum + cell.centre[1], 0) / block.length;
  return [x, z];
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
  seed: number;
};

function one(surface: Surface, part: DeckPart, at: Corner, y: number, turn: number, random: () => number, ring: Corner[]): void {
  switch (part) {
    case 'unit':
      return block(surface, at, 1.3 + random() * 0.6, 0.9 + random() * 0.5, y, 0.7 + random() * 0.5, turn);
    case 'turbine':
      return turbine(surface, at, y, random);
    case 'pipe':
      // The pipe finds the edge for itself: dropped anywhere else it would run inside the wall.
      return pipe(surface, at, ring, y, random);
    case 'panel': {
      block(surface, at, 0.12, 0.12, y, 0.5);
      block(surface, [at[0] + 0.5, at[1]], 0.12, 0.12, y, 0.9);
      return block(surface, at, 1.8, 1.2, y + 0.75, 0.1, turn);
    }
    case 'vent':
      return cylinder(surface, at, 0.35 + random() * 0.25, y, 1 + random() * 1.4, 8);
    case 'mast': {
      const height = 3.5 + random() * 3.5;
      const shaft = 0.35;
      block(surface, at, shaft, shaft, y, height);
      const rings = 1 + Math.round(random());
      for (let i = 1; i <= rings; i++) {
        const level = y + (height * i) / (rings + 1);
        block(surface, at, 0.9, 0.18, level, 0.16);
        block(surface, at, 0.18, 0.9, level, 0.16);
      }
      // Spikes stand on the shaft, inside its width, and reach down into it so they are part
      // of the same solid rather than two bars floating beside it.
      for (const dx of [-shaft / 4, shaft / 4]) {
        block(surface, [at[0] + dx, at[1]], 0.07, 0.07, y + height - 0.2, 1 + random() * 1.2);
      }
      return;
    }
    case 'tank': {
      const legs = 3.5 + random() * 2.5;
      const radius = 1.1 + random() * 0.5;
      for (const [dx, dz] of [
        [-radius * 0.75, -radius * 0.75],
        [radius * 0.75, -radius * 0.75],
        [radius * 0.75, radius * 0.75],
        [-radius * 0.75, radius * 0.75],
      ] as const) {
        block(surface, [at[0] + dx, at[1] + dz], 0.22, 0.22, y, legs);
      }
      cylinder(surface, at, radius, y + legs, 1.8 + random() * 1.2, 10);
      return block(surface, at, 0.3, 0.3, y + legs + 3.2, 0.9);
    }
    case 'tower':
      return block(surface, at, 2.4 + random() * 1.2, 2.4 + random() * 1.2, y, 4 + random() * 5, turn);
  }
}

/** A run of thin bars around the deck edge, with a rail across the top. */
function railing(surface: Surface, ring: Corner[], y: number, height: number): void {
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
const FILL: DeckPart[] = ['unit', 'unit', 'vent', 'turbine', 'pipe', 'panel', 'unit', 'turbine'];

export function deckCells(shape: SectionShape, covered?: Corner[]): Cell[] {
  return cells(ringAt(shape, 1), 0.6, covered);
}

export function rooftop(surface: Surface, shape: SectionShape, options: RooftopOptions): void {
  const random = rng(options.seed);
  const deck = ringAt(shape, 1);
  const y = shape.height;
  const grid = cells(deck, 0.6, options.covered);
  const taken = new Set<string>();

  for (const placement of options.placements ?? []) {
    const block = claim(grid, placement.cell, PART_SIZE[placement.part] ?? 1);
    if (!block) continue;
    for (const cell of block) taken.add(cell.name);
    one(surface, placement.part, blockCentre(block), y - SINK, ((placement.turn ?? 0) * Math.PI) / 180, random, deck);
  }

  const clutter = Math.max(0, Math.min(1, options.clutter ?? 0));
  if (clutter === 0) {
    if (taken.size > 0) railing(surface, deck, y, 1.1);
    return;
  }

  railing(surface, deck, y, 1.1);
  const free = grid.filter((cell) => !taken.has(cell.name));
  const wanted = Math.round(free.length * clutter * 0.5);
  for (let i = 0; i < wanted && i < free.length; i++) {
    const cell = free[Math.floor(random() * free.length)]!;
    if (taken.has(cell.name)) continue;
    taken.add(cell.name);
    one(surface, FILL[Math.floor(random() * FILL.length)]!, cell.centre, y - SINK, random() * Math.PI, random, deck);
  }
}
