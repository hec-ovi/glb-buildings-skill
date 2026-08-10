/** Faces as grids of cells: what stands where on a wall, and the geometry it becomes. */
export { CELL, MARGIN, Face, Sheet, rectOf, type Rect, type Side } from './grid.ts';
export {
  MATERIALS,
  MATERIAL_NOTES,
  KINDS,
  KIND_NOTES,
  DEFAULT_MATERIAL,
  claims,
  type Element,
  type Kind,
  type Material,
} from './elements.ts';
export { dressFaces, readFace, type FacePlan, type Wears } from './build.ts';
