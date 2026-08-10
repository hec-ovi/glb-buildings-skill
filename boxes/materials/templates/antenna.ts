/**
 * Antenna steel: masts, dishes, sector arrays, whips. Small parts, so the tile is short, a bar of
 * it shows a real amount of the picture, and the warning band lands often enough to read.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 128;
const WARNING: [number, number, number] = [186, 74, 42];

export function drawAntenna(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x0b5f);
  const canvas = new Canvas(SIZE, SIZE, look.antenna);

  // Galvanising: the crystalline spangle of a hot dip, drawn as soft patches of two brightnesses.
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(random() * SIZE);
    const y = Math.floor(random() * SIZE);
    const size = 4 + Math.floor(random() * 12);
    canvas.rect(x, y, size, size, tint(look.antenna, 0.9 + random() * 0.22));
  }
  canvas.grain(random, 0.05);

  // Bolts, and the aviation band that marks anything tall.
  for (let i = 8; i < SIZE; i += 26) canvas.rect(i, Math.round(SIZE * 0.34), 4, 4, tint(look.antenna, 0.7));
  canvas.band(Math.round(SIZE * 0.82), Math.round(SIZE * 0.1), WARNING);
  canvas.band(Math.round(SIZE * 0.82), 1, tint(WARNING, 0.6));

  if (look.wear > 0.3) {
    canvas.speckle(random, Math.round(look.wear * 260), mix(look.grime, [132, 68, 32], 0.8), 3);
    canvas.streak(Math.floor(random() * SIZE), 3, mix(look.grime, [132, 68, 32], 0.7), 0.45 * look.wear, Math.round(SIZE * 0.34), SIZE);
  }

  return { colour: canvas.bytes() };
}
