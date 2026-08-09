/**
 * A building in one line, read off its own document. The navigator shows it under each name,
 * so a list of projects says what each building is without opening any of them.
 */
import { bandFloorHeight, type Band, type BuildingDocument } from './document.ts';
import { toMetres } from './units.ts';

const COUNTS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function count(n: number): string {
  return COUNTS[n] ?? String(n);
}

const metres = (mm: number) => String(Math.round(toMetres(mm) * 10) / 10);

/** The one thing a section does to its own mass, if it does anything. */
function moveOf(band: Band): string | undefined {
  if (band.twist !== 0) return 'a twisted run';
  if (band.shape === 'round') return band.arc === 360 ? 'a round mass' : 'a sliced round mass';
  if (band.bow !== '') return 'a bowed face';
  if (band.taper !== 0) return 'a tapered mass';
  if (band.rotation !== 0) return 'a turned mass';
  if (band.inset < 0) return 'an overhang';
  if (band.shiftX !== 0 || band.shiftZ !== 0) return 'a mass slid off centre';
  return undefined;
}

/** What the building wears, named once each however many sections carry it. */
function dressing(doc: BuildingDocument): string[] {
  const worn: string[] = [];
  const any = (test: (band: Band) => boolean) => doc.bands.some(test);

  if (any((b) => b.windows)) worn.push('cut windows');
  if (any((b) => b.balconies !== 'none')) worn.push('balconies');
  if (any((b) => b.columns !== 'none')) worn.push('columns');
  if (any((b) => b.greebles > 0)) worn.push('worked facades');
  if (any((b) => b.wires !== 'none')) worn.push('cables');
  if (any((b) => b.clutter > 0 || b.deck.length > 0)) worn.push('a busy roof');
  return worn;
}

/** Joins a list the way a sentence does: a, b and c. */
function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/**
 * One or two clauses: how big it is, then what makes it itself. Same document, same sentence,
 * so a rebuild never rewrites the list under the reader.
 */
export function describeBuilding(doc: BuildingDocument): string {
  const floors = doc.bands.reduce((sum, band) => sum + band.floors, 0);
  const tall = doc.bands.reduce((sum, band) => sum + band.floors * bandFloorHeight(doc, band), 0);
  const plan = `${metres(doc.footprint.width)} x ${metres(doc.footprint.depth)} m`;

  const size = `${floors} ${floors === 1 ? 'floor' : 'floors'} in ${count(doc.bands.length)} sections, ${plan}, ${metres(tall)} m tall`;

  const moves = [...new Set(doc.bands.map(moveOf).filter((move): move is string => move !== undefined))];
  const worn = dressing(doc);
  if (moves.length === 0 && worn.length === 0) return `${size}. Plain masses, windows in the texture.`;

  return `${size}. ${list([...moves.slice(0, 2), ...worn]).replace(/^./, (c) => c.toUpperCase())}.`;
}
