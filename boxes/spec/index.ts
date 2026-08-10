/** The vocabulary every other box speaks: the document, the selection, units, errors. */
export {
  TIERS,
  BAND_KINDS,
  SIDES,
  documentSchema,
  parseDocument,
  newDocument,
  bandFloorHeight,
  DECK_PARTS,
  type DeckPart,
  type DeckPlacement,
  type ElementKind,
  type ElementMaterial,
  type FaceElement,
  type BandFace,
  type BandRun,
  type BandLine,
  type BandScreen,
  type Tier,
  type BandKind,
  type Side,
  type Footprint,
  type Grid,
  type Band,
  type BuildingDocument,
} from './document.ts';

export { describeBuilding } from './describe.ts';

export {
  selectionSchema,
  parseSelection,
  describeSelection,
  EMPTY_SELECTION,
  type Selection,
} from './selection.ts';

export { toMetres, toMm, partition, bayCount, type Mm } from './units.ts';

export { ERRORS, BuildingError, type ErrorCode } from './errors.ts';
