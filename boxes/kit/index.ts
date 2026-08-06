/** The parts. Geometry in metres, correct winding, and the proofs that keep it that way. */
export { Surface, normalOf, triangleCount, TILE, type MeshData, type Vec } from './geometry.ts';
export { windingProblems, shellProblems, type MeshProblem } from './invariants.ts';
export { walls, cap, capRing, insetRing, junction, wires, ringAt, sameRing, edgeFacing, tubeRing, type SectionShape, type Corner } from './section.ts';
export {
  template,
  templates,
  dress,
  type Dressing,
  TEMPLATE_IDS,
  FACADE,
  ROOF,
  type Template,
} from './templates.ts';
export { greebles, seedOf, type GreebleOptions } from './greebles.ts';
export { balconies, balconyPlan, prism, BALCONY, type BalconyOptions } from './balcony.ts';
export { columns, type ColumnStyle } from './columns.ts';
export { rooftop, deckCells, DECK_PART_NOTES, PART_SIZE, claim, blockCentre, type RooftopOptions, type Placement } from './rooftop.ts';
export { cells, columnName, cylinder, block, turbine, pipe, CELL, type Cell } from './deck.ts';
