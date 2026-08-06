/**
 * What the human picked in the preview, in the words the CLI can act on.
 * The viewer writes it, the CLI reads it, so "put a window there" resolves to bay ids.
 */
import { z } from 'zod';

const mm = z.number().int();
const point = z.tuple([mm, mm, mm]);

export const selectionSchema = z.object({
  /** `pick` is one click, `zone` is a dragged rectangle. */
  mode: z.enum(['pick', 'zone']),
  /** ISO timestamp, stamped by the server on write. */
  at: z.string(),
  bandIds: z.array(z.string()).default([]),
  floorIds: z.array(z.string()).default([]),
  bayIds: z.array(z.string()).default([]),
  /** Bounding box of the selection in building coordinates, millimetres. */
  box: z.object({ min: point, max: point }).optional(),
});

export type Selection = z.infer<typeof selectionSchema>;

export const EMPTY_SELECTION: Selection = { mode: 'pick', at: '', bandIds: [], floorIds: [], bayIds: [] };

export function parseSelection(value: unknown): Selection {
  return selectionSchema.parse(value);
}

/** One line an agent can read: which bays, on which floors, in which bands. */
export function describeSelection(selection: Selection): string {
  if (selection.floorIds.length === 0 && selection.bayIds.length === 0) return 'nothing selected';
  const parts: string[] = [];
  if (selection.floorIds.length) parts.push(`${selection.floorIds.length} floors: ${selection.floorIds.join(', ')}`);
  if (selection.bandIds.length) parts.push(`in ${selection.bandIds.join(', ')}`);
  if (selection.bayIds.length) parts.push(`${selection.bayIds.length} bays`);
  return parts.join(' | ');
}
