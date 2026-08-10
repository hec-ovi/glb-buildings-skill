/** The parts. Geometry in metres, correct winding, and the proofs that keep it that way. */
export { Surface, normalOf, triangleCount, TILE, type MeshData, type Patch, type Vec } from './geometry.ts';
export { windingProblems, shellProblems, sunkProblems, proudProblems, solids, MAX_PROUD, MAX_ABOVE, SHOWS, type MeshProblem } from './invariants.ts';
export { insideRing, insetRing, middleOf, outsideBy, outwardAt, type Corner } from './plan.ts';
export { walls, cap, capRing, WINDOW, type WindowStyle, wires, WIRE_RUNS, ringAt, edgeFacing, facePoint, tubeRing, type SectionShape } from './section.ts';
export {
  template,
  templates,
  dress,
  type Dressing,
  type LineSpec,
  TEMPLATE_IDS,
  FACADE,
  GLASS,
  GLASS_BAND,
  ROOF,
  CONCRETE,
  METAL,
  PIPE,
  ANTENNA,
  BEACON,
  NEON,
  type Template,
  WALL_PATCH,
} from './templates.ts';
export { Surfaces } from './surfaces.ts';
export { line, crown, LINE_STAND, type LineStyle } from './lines.ts';
export { screen, type ScreenStyle } from './screens.ts';
export { segment, MAX_MITRE, type Profile, type SegmentStyle } from './segment.ts';
export { greebles, seedOf } from './greebles.ts';
export { mast, dish, sector, whips } from './antenna.ts';
export { solar, tank } from './plant.ts';
export { columns, uprightsOn, RIB_PITCH, type ColumnStyle, type Upright } from './columns.ts';
export { rooftop, deckCells, DECK_PART_NOTES, PART_SIZE, claim, type RooftopOptions, type Placement, type DeckPart } from './rooftop.ts';
export { cells, cylinder, block, turbine, pipe, CELL, type Cell } from './deck.ts';
