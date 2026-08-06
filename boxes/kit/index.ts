/** The parts. Geometry in metres, correct winding, and the proofs that keep it that way. */
export { Surface, normalOf, triangleCount, TILE, type MeshData, type Vec } from './geometry.ts';
export { windingProblems, shellProblems, type MeshProblem } from './invariants.ts';
export { walls, cap, junction, wires, ringAt, sameRing, type SectionShape, type Corner } from './section.ts';
export {
  template,
  templates,
  wireRun,
  TEMPLATE_IDS,
  FACADE,
  ROOF,
  type Template,
} from './templates.ts';
