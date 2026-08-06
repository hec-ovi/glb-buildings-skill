/**
 * Units. Everything in a document is whole millimetres, so contact, overlap and seam
 * equality are exact integer comparisons. Metres appear once, when a GLB is written.
 */

/** One metre, in document units. */
export const METRE = 1000;

export type Mm = number;

export function isMm(value: unknown): value is Mm {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

/** Millimetres to metres, for export and for anything shown to a human. */
export function toMetres(mm: Mm): number {
  return mm / METRE;
}

/** Metres to millimetres, rounded to the nearest whole millimetre. */
export function toMm(metres: number): Mm {
  return Math.round(metres * METRE);
}

/**
 * Split a length into `count` whole-millimetre parts that sum back to it exactly.
 * The remainder is spread one millimetre at a time over the first parts, so a facade
 * divided into bays never leaves a gap or an overlap at the corner.
 */
export function partition(total: Mm, count: number): Mm[] {
  if (count < 1) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** How many bays fit a facade of this length at this target bay width, at least one. */
export function bayCount(side: Mm, targetBay: Mm): number {
  return Math.max(1, Math.round(side / targetBay));
}
