/**
 * The deck: membrane, felt or gravel depending on the family. Seen from above and from a long way
 * up, so what matters is the seams and the puddles, not the grain.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 128;

export function drawRoof(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x50c3);
  const canvas = new Canvas(SIZE, SIZE, look.roof);

  canvas.speckle(random, 1400, tint(look.roof, 1.18), 2);
  canvas.speckle(random, 700, tint(look.roof, 0.8), 2);

  // Welded seams, the grid every flat roof is laid out on.
  canvas.band(Math.round(SIZE * 0.5), 2, tint(look.roof, 1.12));
  canvas.band(Math.round(SIZE * 0.5) + 2, 1, tint(look.roof, 0.78));
  canvas.stripe(Math.round(SIZE * 0.5), 2, tint(look.roof, 1.1));

  // Standing water, which is what a flat roof always has somewhere.
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(random() * SIZE);
    const y = Math.floor(random() * SIZE);
    const width = 20 + Math.floor(random() * 34);
    const height = 14 + Math.floor(random() * 24);
    canvas.rect(x, y, width, height, mix(look.roof, look.grime, 0.3 + random() * 0.25));
  }

  canvas.grain(random, 0.06 + look.wear * 0.1);
  if (look.wear > 0.5) {
    const x = Math.floor(random() * SIZE);
    const y = Math.floor(random() * SIZE);
    canvas.rect(x, y, 30 + Math.floor(random() * 30), 22 + Math.floor(random() * 24), mix(look.roof, look.grime, 0.55));
  }

  return { colour: canvas.bytes() };
}
