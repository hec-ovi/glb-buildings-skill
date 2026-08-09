/** What a placed scene is made of. Building coordinates, Y up, millimetres. */
import type { BandKind, Mm, Side, Tier } from '#spec';

export type Vec3 = [Mm, Mm, Mm];

export type Box = { min: Vec3; max: Vec3 };

/** One facade panel slot: one side of one floor, one bay wide. */
export type PlacedBay = {
  id: string;
  side: Side;
  index: number;
  width: Mm;
  /** In the band's own frame, before the band's rotation. */
  box: Box;
};

export type PlacedFloor = {
  id: string;
  bandId: string;
  /** Index inside the band, 0 at its bottom. */
  index: number;
  y0: Mm;
  y1: Mm;
  bays: PlacedBay[];
};

export type Rect = { x0: Mm; x1: Mm; z0: Mm; z1: Mm };

/** A footprint corner in world millimetres, on the ground plane. */
export type Corner = [Mm, Mm];

export type PlacedBand = {
  id: string;
  kind: BandKind;
  tier: Tier;
  template: string;
  /** Degrees about Y, applied to the whole band at the building centre. */
  rotation: number;
  /** A run of cables climbing one face of the section. */
  wires: 'none' | Side;
  /** `box` or `round`. A round section is a polygon with more corners, nothing else changes. */
  shape: 'box' | 'round';
  /** What the section wears: fake parts, balconies, uprights. */
  greebles: number;
  windows: boolean;
  balconies: 'none' | Side;
  columns: 'none' | 'corners' | 'ribs' | 'partial';
  clutter: number;
  deck: { cell: string; part: string; turn: number }[];
  inset: Mm;
  /** Where this band's footprint actually sits, after its step and shift. */
  rect: Rect;
  /** The footprint as four world corners where the section starts. Order S, E, N, W. */
  bottom: Corner[];
  /** And where it ends, after its twist and taper. A section is the loft between the two. */
  top: Corner[];
  /** Bevel on the top and bottom edges, in millimetres. */
  chamfer: Mm;
  y0: Mm;
  y1: Mm;
  floors: PlacedFloor[];
};

export type PlacedScene = {
  name: string;
  size: { width: Mm; depth: Mm; height: Mm };
  bands: PlacedBand[];
};

export function boxCentre(box: Box): Vec3 {
  return [
    Math.round((box.min[0] + box.max[0]) / 2),
    Math.round((box.min[1] + box.max[1]) / 2),
    Math.round((box.min[2] + box.max[2]) / 2),
  ];
}
