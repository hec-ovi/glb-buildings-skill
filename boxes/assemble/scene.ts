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

/** The footprint a band shows to its neighbour, and how many bays each side carries. */
export type Seam = {
  width: Mm;
  depth: Mm;
  bays: Record<Side, number>;
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
  inset: Mm;
  /** Where this band's footprint actually sits, after its step and shift. */
  rect: Rect;
  /** The footprint as four world corners where the section starts. Order S, E, N, W. */
  bottom: Corner[];
  /** And where it ends, after its twist and taper. A section is the loft between the two. */
  top: Corner[];
  y0: Mm;
  y1: Mm;
  floors: PlacedFloor[];
  seam: Seam;
};

export type PlacedScene = {
  name: string;
  size: { width: Mm; depth: Mm; height: Mm };
  bands: PlacedBand[];
};

export function seamsMatch(a: Seam, b: Seam): boolean {
  return (
    a.width === b.width &&
    a.depth === b.depth &&
    a.bays.N === b.bays.N &&
    a.bays.E === b.bays.E &&
    a.bays.S === b.bays.S &&
    a.bays.W === b.bays.W
  );
}

export function describeSeam(seam: Seam): string {
  return `${seam.width}x${seam.depth} bays N${seam.bays.N} E${seam.bays.E} S${seam.bays.S} W${seam.bays.W}`;
}

export function boxCentre(box: Box): Vec3 {
  return [
    Math.round((box.min[0] + box.max[0]) / 2),
    Math.round((box.min[1] + box.max[1]) / 2),
    Math.round((box.min[2] + box.max[2]) / 2),
  ];
}
