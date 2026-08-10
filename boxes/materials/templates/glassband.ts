/**
 * Full glass floors: four or five floors of a tower that are nothing but glazing, lit, sitting in
 * a mass that is otherwise dark. Big panels, some burning, some dimmed right down, some dead, in
 * an irregular blocky pattern.
 *
 * One tile is the same grid as the wall, so a section can be swapped from one to the other and the
 * bays still line up.
 */
import { Canvas, mix, rng, tint, type Drawing, type Rgb } from '../paint.ts';
import { lightColour, type StyleSheet } from '../styles.ts';
import { FACADE_STYLE } from './facade.ts';

const SIZE = 256;

/** Panel states, and how often each comes up. A band is mostly lit or it is not a lit band. */
const LIT = 0.62;
const DIM = 0.22;

export function drawGlassBand(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x2f1d);
  const across = FACADE_STYLE.across;
  const down = FACADE_STYLE.down;
  const cellX = SIZE / across;
  const cellY = SIZE / down;

  // One colour carries the whole band: a lit volume is one volume, not a fruit salad.
  const glow = lightColour(look, random);
  const frame: Rgb = tint(look.wall, 0.7);

  const colour = new Canvas(SIZE, SIZE, frame);
  const light = new Canvas(SIZE, SIZE, [0, 0, 0]);

  for (let row = 0; row < down; row++) {
    for (let column = 0; column < across; column++) {
      const x = Math.round(column * cellX) + 2;
      const y = Math.round(row * cellY) + 2;
      const width = Math.round(cellX) - 4;
      const height = Math.round(cellY) - 4;

      const roll = random();
      const level = roll < LIT ? 1 : roll < LIT + DIM ? 0.2 : 0;

      if (level === 0) {
        // Dead glass still catches a little of the city, or the panel reads as a hole.
        colour.rect(x, y, width, height, look.glass);
        for (let dy = 0; dy < height; dy++) {
          const sky = 1 - dy / height;
          for (let dx = 0; dx < width; dx++) colour.pixel(x + dx, y + dy, mix(look.glass, look.sheen, sky * sky * 0.8));
        }
        continue;
      }

      const face = tint(glow, level * (0.82 + random() * 0.18));
      colour.rect(x, y, width, height, face);
      light.rect(x, y, width, height, face);
      // The streak along the top edge where the glass catches its own light.
      colour.rect(x, y, width, Math.max(1, Math.round(height * 0.08)), tint(face, 1.25));
    }
  }

  return { colour: colour.bytes(), emissive: light.bytes() };
}
