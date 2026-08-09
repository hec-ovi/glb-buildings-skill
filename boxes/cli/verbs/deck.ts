/**
 * The roof as a floor plan. `deck` prints the grid of cells and what stands in each; `place`
 * puts a part in a cell; `unplace` takes it out. The agent composes the roof, cell by cell,
 * instead of asking for a pile of clutter and hoping.
 */
import { assemble } from '#assemble';
import { DECK_PART_NOTES, PART_SIZE, claim, deckCells } from '#kit';
import { BuildingError, DECK_PARTS, parseDocument, type DeckPart, type DeckPlacement } from '#spec';
import type { Verb } from './verb.ts';
import { degrees, need, parse, text } from './args.ts';
import { sectionShape } from './shape.ts';

const MM = 0.001;

/** The section whose deck we are working on: the one named, or the top of the stack. */
async function target(projects: Parameters<Verb['run']>[1]['projects'], named: string | undefined) {
  const { name, project } = await projects.open();
  const doc = await project.readDocument();
  const at = named ? doc.bands.findIndex((band) => band.id === named) : doc.bands.length - 1;
  if (at === -1) throw new BuildingError('E_DOC_INVALID', `no section named ${named}`, ['bands', String(named)]);

  const placed = assemble(doc);
  const section = placed.bands[at]!;
  const above = placed.bands[at + 1];
  const shape = sectionShape(section);
  const covered = above ? above.bottom.map(([x, z]) => [x * MM, z * MM] as [number, number]) : undefined;
  return { name, project, doc, at, band: doc.bands[at]!, grid: deckCells(shape, covered) };
}

export const deck: Verb = {
  name: 'deck',
  summary: 'the roof as a grid of cells, and what stands in each',
  usage: 'deck [section]',
  async run(args, { projects }) {
    const { positionals } = parse(args, {});
    const { name, band, grid } = await target(projects, positionals[0]);
    const held = new Map(band.deck.map((entry) => [entry.cell, entry]));

    // A part that needs a block holds every cell of it, so nothing is placed on top of it.
    const occupied = new Map<string, string>();
    for (const entry of band.deck) {
      for (const cell of claim(grid, entry.cell, PART_SIZE[entry.part] ?? 1) ?? []) occupied.set(cell.name, entry.part);
    }

    return {
      project: name,
      section: band.id,
      cell: 2,
      parts: DECK_PARTS.map((part) => ({ part, cells: `${PART_SIZE[part]}x${PART_SIZE[part]}`, is: DECK_PART_NOTES[part as DeckPart] })),
      cells: grid.map((cell) => ({
        cell: cell.name,
        holds: occupied.get(cell.name) ?? null,
        turn: held.get(cell.name)?.turn ?? 0,
      })),
    };
  },
};

export const place: Verb = {
  name: 'place',
  summary: 'put a part in a cell of the roof',
  usage: 'place <part> <cell> [cell ...] [--section <id>] [--turn 45]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { section: { type: 'string' }, turn: { type: 'string' } });
    const part = need(positionals, 0, 'part') as DeckPart;
    if (!DECK_PARTS.includes(part)) {
      throw new BuildingError('E_DOC_INVALID', `part must be one of ${DECK_PARTS.join(', ')}`, ['part']);
    }
    const wanted = positionals.slice(1).map((cell) => cell.toUpperCase());
    if (wanted.length === 0) throw new BuildingError('E_DOC_INVALID', 'name at least one cell, like B3', ['cell']);

    const { name, project, doc, at, band, grid } = await target(projects, text(values.section));
    const turn = degrees(values.turn) ?? 0;

    // A cell that is not on this deck would be dropped silently at build time.
    const known = new Set(grid.map((cell) => cell.name));
    const missing = wanted.filter((cell) => !known.has(cell));
    if (missing.length > 0) {
      throw new BuildingError(
        'E_DOC_INVALID',
        `${band.id} has no cell ${missing.join(', ')}. Its deck is ${grid.map((cell) => cell.name).join(' ') || 'too small to hold anything'}`,
        ['cell'],
      );
    }

    // What is already held, including the cells a 2x2 part sits across.
    const size = PART_SIZE[part];
    const held = new Map<string, string>();
    for (const entry of band.deck) {
      if (wanted.includes(entry.cell)) continue;
      for (const cell of claim(grid, entry.cell, PART_SIZE[entry.part] ?? 1) ?? []) held.set(cell.name, entry.part);
    }

    for (const cell of wanted) {
      const block = claim(grid, cell, size);
      if (!block) {
        throw new BuildingError('E_DOC_INVALID', `a ${part} needs a ${size}x${size} block and ${cell} does not have room for one`, ['cell']);
      }
      const clash = block.find((candidate) => held.has(candidate.name));
      if (clash) {
        // A big part takes a block, so the cell in the way is often not the one that was asked
        // for. Say which cells it needs, or the message reads as a non sequitur.
        const takes = size > 1 ? `a ${part} takes the ${size}x${size} block ${block.map((one) => one.name).join(', ')}, and ` : '';
        throw new BuildingError(
          'E_DOC_INVALID',
          `${takes}${clash.name} already holds a ${held.get(clash.name)}; clear it first with unplace`,
          ['cell', clash.name],
        );
      }
      for (const candidate of block) held.set(candidate.name, part);
    }

    const kept = band.deck.filter((entry) => !wanted.includes(entry.cell));
    const deckNow: DeckPlacement[] = [...kept, ...wanted.map((cell) => ({ cell, part, turn }))];
    const bands = [...doc.bands];
    bands[at] = { ...band, deck: deckNow };
    await project.writeDocument(parseDocument({ ...doc, bands }));

    const full = Math.round((held.size / grid.length) * 100);
    return {
      project: name,
      section: band.id,
      part,
      cells: wanted,
      deck: `${held.size} of ${grid.length} cells taken, ${full}% full`,
      ...(full > 55 ? { note: 'a roof past about half full reads as noise; leave space between the parts' } : {}),
    };
  },
};

export const unplace: Verb = {
  name: 'unplace',
  summary: 'clear a cell of the roof',
  usage: 'unplace <cell> [cell ...] [--section <id>]',
  async run(args, { projects }) {
    const { positionals, values } = parse(args, { section: { type: 'string' } });
    const wanted = positionals.map((cell) => cell.toUpperCase());
    if (wanted.length === 0) throw new BuildingError('E_DOC_INVALID', 'name at least one cell, like B3', ['cell']);

    const { name, project, doc, at, band } = await target(projects, text(values.section));
    const deckNow = band.deck.filter((entry) => !wanted.includes(entry.cell));
    const bands = [...doc.bands];
    bands[at] = { ...band, deck: deckNow };
    await project.writeDocument(parseDocument({ ...doc, bands }));

    return { project: name, section: band.id, cleared: wanted, holds: deckNow.length };
  },
};

export const deckVerbs = [deck, place, unplace];
