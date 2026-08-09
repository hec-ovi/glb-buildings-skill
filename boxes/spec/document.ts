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

/** The parts a deck cell can hold. Two metres square each, except the ones marked 2x2. */
export const DECK_PARTS = ['unit', 'turbine', 'pipe', 'vent', 'tower', 'solar', 'tank', 'mast', 'dish', 'array', 'whip'] as const;
export type DeckPart = (typeof DECK_PARTS)[number];

const deckPartSchema = z.object({
  /** A cell name from `buildings deck`, like `B3`. */
  cell: z.string().regex(/^[A-Z]+\d+$/),
  part: z.enum(DECK_PARTS),
  /** Degrees, for the parts that show a direction. */
  turn: z.number().default(0),
});

export type DeckPlacement = z.infer<typeof deckPartSchema>;

/** What can stand on a face, and what it is made of. See the `facade` box. */
export const ELEMENT_KINDS = ['window', 'door', 'panel', 'balcony'] as const;
export type ElementKind = (typeof ELEMENT_KINDS)[number];

export const ELEMENT_MATERIALS = ['crystal', 'concrete', 'screen', 'metal'] as const;
export type ElementMaterial = (typeof ELEMENT_MATERIALS)[number];

const cell = z.number().int().nonnegative();

const elementSchema = z.object({
  kind: z.enum(ELEMENT_KINDS),
  /** The cell rectangle it claims: bottom left, then top right, both inside it. */
  col: cell,
  row: cell,
  cols: cell.positive(),
  rows: cell.positive(),
  material: z.enum(ELEMENT_MATERIALS),
  /** How far a balcony stands out, in millimetres. */
  depth: positiveMm.optional(),
});

export type FaceElement = z.infer<typeof elementSchema>;

/** One face of a section, and everything composed on it. The design repeats on every floor. */
const faceSchema = z.object({
  side: z.enum(SIDES),
  elements: z.array(elementSchema).default([]),
});

export type BandFace = z.infer<typeof faceSchema>;

/** A run of tube outside the building: a duct, a pipe, a cable. Points are millimetres. */
const runSchema = z.object({
  points: z.array(z.tuple([mm, mm, mm])).min(2),
  profile: z.enum(['square', 'round']).default('round'),
  thickness: positiveMm.default(200),
  material: z.enum(ELEMENT_MATERIALS).default('metal'),
});

export type BandRun = z.infer<typeof runSchema>;

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
  /**
   * How much of the round the section sweeps, in degrees, starting at the south face and turning
   * east. A half or less is a wedge with its point at the middle, more is a cylinder with a flat
   * cut across it. `rotation` points it wherever it is wanted.
   */
  arc: z.number().min(30).max(360).default(360),
  /** Faces that bulge out into a round end instead of running straight, like `NS`. Box only. */
  bow: z
    .string()
    .regex(/^[NESW]{0,4}$/, 'bow is any of N, E, S, W, like NS')
    .refine((sides) => new Set(sides).size === sides.length, 'bow names a face twice')
    .default(''),
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
  /** Real openings in every bay: a hole, a reveal and a pane. Costs about 18 triangles each. */
  windows: z.boolean().default(false),
  /** Balconies with a rounded front, on one face, one per floor. */
  /** Uprights: at the footprint corners, or as ribs along every face. */
  columns: z.enum(['none', 'corners', 'ribs', 'partial']).default('none'),
  /** A quick pass that fills free cells of the deck, 0 to 1. Anything placed by hand wins. */
  clutter: z.number().min(0).max(1).default(0),
  /** What stands where on the deck, one entry per cell. */
  deck: z.array(deckPartSchema).default([]),
  /** What is composed on each face, cell by cell. The design repeats on every floor. */
  faces: z.array(faceSchema).default([]),
  /** Runs of tube standing off this section: ducts, pipes, cables. */
  runs: z.array(runSchema).default([]),
});

/** Shapes that read as two ways of rounding the same plan are refused rather than resolved. */
const bandShape = bandSchema.superRefine((band, ctx) => {
  const refuse = (message: string, at: string) => ctx.addIssue({ code: 'custom', message, path: [at] });

  if (band.arc !== 360 && band.shape !== 'round') {
    refuse(`band ${band.id} sweeps an arc, which only a round section has. Set --shape round`, 'arc');
  }
  if (band.bow !== '' && band.shape !== 'box') {
    refuse(`band ${band.id} bows a face, which only a box section has. A round section uses --arc`, 'bow');
  }
  if (band.corner > 0 && band.shape !== 'box') {
    refuse(`band ${band.id} fillets its corners, which a round section does not have`, 'corner');
  }
  if (band.bow !== '' && band.corner > 0) {
    refuse(`band ${band.id} both bows a face and fillets its corners, which are two ways of rounding one plan. Pick one`, 'bow');
  }
});

export const documentSchema = z.object({
  version: z.literal(SCHEMA_VERSION),
  name: z.string().min(1),
  /** What this building was asked for, in the words it was asked in. */
  brief: z.string().default(''),
  footprint: footprintSchema,
  grid: gridSchema.default({ bay: 3000, floorHeight: 3200 }),
  bands: z.array(bandShape).min(1),
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
export function newDocument(name: string, options: { width?: number; depth?: number; floors?: number; brief?: string } = {}): BuildingDocument {
  const width = Math.round((options.width ?? 18) * METRE);
  const depth = Math.round((options.depth ?? 14) * METRE);
  const bulkFloors = Math.max(1, (options.floors ?? 12) - 2);

  return parseDocument({
    version: SCHEMA_VERSION,
    name,
    brief: options.brief ?? '',
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
