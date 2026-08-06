/** The parts. Geometry in metres, correct winding, and the proofs that keep it that way. */
export { Surface, normalOf, triangleCount, TILE, type MeshData, type Vec } from './geometry.ts';
export { windingProblems, shellProblems, type MeshProblem } from './invariants.ts';
export {
  template,
  templates,
  TEMPLATE_IDS,
  FACADE,
  ROOF,
  type FloorShape,
  type Template,
} from './templates.ts';
