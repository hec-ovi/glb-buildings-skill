/** The finish library: what every named surface looks like, drawn from code or read from a pack. */
export {
  finish,
  fits,
  bands,
  gridded,
  pictured,
  known,
  splitName,
  tileOf,
  COLOUR_NAMES,
  FINISHES,
  MODES,
  MODE_NOTES,
  PAINTS,
  PAINT_NOTES,
  type Finish,
  type Look,
  type Mode,
  type PaintName,
} from './finishes.ts';
export { STYLES, STYLE_NOTES, sheet, type Style, type StyleSheet } from './styles.ts';
export { loadImage, loadPack, type Bitmap, type Grid, type Maps, type Pack, type Scale } from './pack.ts';
export type { Size } from './size.ts';
export { facadeTexture, FACADE_STYLE, FACADE_WALL, type FacadeStyle, type FacadeTexture } from './templates/facade.ts';
export { rng, tint, type Drawing, type Rgb } from './paint.ts';
export { png, type Pixels } from './png.ts';
