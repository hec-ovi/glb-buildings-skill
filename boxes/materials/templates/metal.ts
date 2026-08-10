/**
 * Plate metal: shutters, louvres, housings, deck plant. Tiles by the metre, with the seam and the
 * rivets that say a big surface is made of sheets rather than being one sheet.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 128;

export function drawMetal(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x44b9);
  const canvas = new Canvas(SIZE, SIZE, look.metal);

  // Brushed: every row a slightly different brightness, which is what a rolled sheet looks like.
  for (let y = 0; y < SIZE; y++) {
    canvas.rect(0, y, SIZE, 1, tint(look.metal, 0.94 + random() * 0.12));
  }

  // A panel seam across and down, with rivets along both.
  const seamX = Math.round(SIZE * 0.5);
  canvas.stripe(seamX, 2, tint(look.metal, 0.7));
  canvas.band(Math.round(SIZE * 0.5), 2, tint(look.metal, 0.72));
  for (let i = 6; i < SIZE; i += 14) {
    canvas.rect(seamX - 4, i, 3, 3, tint(look.metal, 1.25));
    canvas.rect(i, Math.round(SIZE * 0.5) - 4, 3, 3, tint(look.metal, 1.2));
  }

  canvas.grain(random, 0.04 + look.wear * 0.1);
  if (look.wear > 0.3) {
    canvas.speckle(random, Math.round(look.wear * 220), mix(look.grime, [126, 66, 34], 0.7), 3);
    canvas.streak(Math.floor(random() * SIZE), 4, mix(look.grime, [126, 66, 34], 0.6), 0.45 * look.wear, Math.round(SIZE * 0.5), SIZE);
  }

  return { colour: canvas.bytes() };
}
