/** Document to placed scene: transforms, bays, seams. No geometry, no files. */
export { assemble, floors, findBay, PANEL_THICKNESS } from './assemble.ts';
export {
  seamsMatch,
  describeSeam,
  boxCentre,
  type Box,
  type Rect,
  type Corner,
  type Vec3,
  type Seam,
  type PlacedBay,
  type PlacedFloor,
  type PlacedBand,
  type PlacedScene,
} from './scene.ts';
