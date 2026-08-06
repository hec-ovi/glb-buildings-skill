/**
 * The building document. Bands of floors, bottom to top, over one footprint.
 * Every length is whole millimetres.
 */
import { z } from 'zod';
import { BuildingError } from './errors.ts';
import { METRE } from './units.ts';

export const SCHEMA_VERSION = 1;

const mm = z.number().int();
const positiveMm = mm.positive();

/** How much geometry a band carries. See docs/ARCHITECTURE.md. */
export const TIERS = ['flat', 'light', 'full'] as const;
export type Tier = (typeof TIERS)[number];

/** What a band is for. Main floor and roof are always special. */
export const BAND_KINDS = ['main', 'bulk', 'custom', 'roof'] as const;
export type BandKind = (typeof BAND_KINDS)[number];

export const SIDES = ['N', 'E', 'S', 'W'] as const;
export type Side = (typeof SIDES)[number];

const footprintSchema = z.object({
  kind: z.literal('rect'),
  /** East to west, along X. */
  width: positiveMm,
  /** North to south, along Z. */
  depth: positiveMm,
});

const gridSchema = z.object({
  /** Target facade bay width. Real bays are the exact integer partition of each side. */
  bay: positiveMm.default(3000),
  /** Default floor to floor height, overridable per band. */
  floorHeight: positiveMm.default(3200),
});

const bandSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(BAND_KINDS),
  tier: z.enum(TIERS),
  /** How many identical floors this band stacks. */
  floors: z.number().int().positive(),
  /** Floor to floor height for this band. Falls back to grid.floorHeight. */
  floorHeight: positiveMm.optional(),
  /** Floor template id from the kit. */
  template: z.string().min(1),
  /** This section's own footprint. Falls back to the building's. */
  width: positiveMm.optional(),
  depth: positiveMm.optional(),
  /** `box` is four corners, `round` is a cylinder drawn with `segments` of them. */
  shape: z.enum(['box', 'round']).default('box'),
  segments: z.number().int().min(6).max(64).default(16),
  /** Fillet on the upright corners: the footprint corner becomes a small arc. */
  corner: mm.nonnegative().default(0),
  /** Bevel on the top and bottom edges of the section, so they catch the light. */
  chamfer: mm.nonnegative().default(0),
  /** Step per side: positive pulls the section in, negative hangs it out over the one below. */
  inset: mm.default(0),
  /** Slide the band east or west, and north or south, off the building centre. */
  shiftX: mm.default(0),
  shiftZ: mm.default(0),
  /** Yaw of the whole section about the building's axis, degrees. */
  rotation: z.number().default(0),
  /** Extra turn added across the section, so the mass twists as it rises. */
  twist: z.number().default(0),
  /** How much the section pulls in by the time it reaches its top. */
  taper: mm.default(0),
  /** A run of cables or pipes climbing one face of the section. */
  wires: z.enum(['none', 'N', 'E', 'S', 'W']).default('none'),
  /** Fake parts standing off the faces, 0 to 1. What stops a bulk section reading as a box. */
  greebles: z.number().min(0).max(1).default(0),
  /** Balconies with a rounded front, on one face, one per floor. */
  balconies: z.enum(['none', 'N', 'E', 'S', 'W']).default('none'),
  /** Uprights: at the footprint corners, or as ribs along every face. */
  columns: z.enum(['none', 'corners', 'ribs', 'partial']).default('none'),
  /** What stands on this section's deck: mast, harness rings, units, a small tower. 0 to 1. */
  clutter: z.number().min(0).max(1).default(0),
});

export const documentSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  name: z.string().min(1),
  footprint: footprintSchema,
  grid: gridSchema.default({ bay: 3000, floorHeight: 3200 }),
  bands: z.array(bandSchema).min(1),
});

export type Footprint = z.infer<typeof footprintSchema>;
export type Grid = z.infer<typeof gridSchema>;
export type Band = z.infer<typeof bandSchema>;
export type BuildingDocument = z.infer<typeof documentSchema>;

/** Parse and normalise. Throws one BuildingError with the failing path. */
export function parseDocument(value: unknown): BuildingDocument {
  if (typeof value === 'object' && value !== null && 'version' in value) {
    const version = (value as { version: unknown }).version;
    if (version !== SCHEMA_VERSION) {
      throw new BuildingError('E_DOC_VERSION', `document is version ${String(version)}, this build reads ${SCHEMA_VERSION}`);
    }
  }

  const result = documentSchema.safeParse(value);
  if (!result.success) {
    const first = result.error.issues[0];
    const at = (first?.path ?? []).map(String);
    throw new BuildingError('E_DOC_INVALID', first?.message ?? 'unreadable', at);
  }

  const seen = new Set<string>();
  for (const band of result.data.bands) {
    if (seen.has(band.id)) {
      throw new BuildingError('E_BAND_ID_DUPLICATE', `band id ${band.id} is used twice`, ['bands', band.id]);
    }
    seen.add(band.id);
  }

  return result.data;
}

/** A plain tower, the starting point every walk edits. Sizes are in metres here for the caller's sake. */
export function newDocument(name: string, options: { width?: number; depth?: number; floors?: number } = {}): BuildingDocument {
  const width = Math.round((options.width ?? 18) * METRE);
  const depth = Math.round((options.depth ?? 14) * METRE);
  const bulkFloors = Math.max(1, (options.floors ?? 12) - 2);

  return parseDocument({
    version: SCHEMA_VERSION,
    name,
    footprint: { kind: 'rect', width, depth },
    grid: { bay: 3000, floorHeight: 3200 },
    bands: [
      { id: 'ground', kind: 'main', tier: 'full', floors: 1, floorHeight: 4500, template: 'main-plain' },
      { id: 'body', kind: 'bulk', tier: 'flat', floors: bulkFloors, template: 'bulk-flat' },
      { id: 'crown', kind: 'roof', tier: 'light', floors: 1, floorHeight: 900, template: 'roof-parapet' },
    ],
  });
}

/** Floor to floor height this band actually uses. */
export function bandFloorHeight(doc: BuildingDocument, band: Band): number {
  return band.floorHeight ?? doc.grid.floorHeight;
}
