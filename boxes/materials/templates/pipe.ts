/**
 * A pipe, a duct, a conduit. The run lays its own UVs: across the tile wraps around the pipe, and
 * down the tile is a metre of run, so the flange lands once a metre and the shading makes it round
 * whatever the pipe is drawn with.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 128;

export function drawPipe(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x9d21);
  const canvas = new Canvas(SIZE, SIZE, look.pipe);

  canvas.grain(random, 0.04);

  // The flange collar, and the bolts round it. One a metre of run.
  const collar = Math.round(SIZE * 0.06);
  canvas.band(4, collar, tint(look.pipe, 1.18));
  canvas.band(4 + collar, 2, tint(look.pipe, 0.6));
  for (let x = 4; x < SIZE; x += 16) canvas.rect(x, 4 + Math.round(collar / 2) - 2, 4, 4, tint(look.pipe, 0.7));

  // An identification band, the way every service pipe anywhere is marked.
  canvas.band(Math.round(SIZE * 0.62), Math.round(SIZE * 0.07), mix(look.pipe, look.neon, 0.45));

  if (look.wear > 0.3) {
    canvas.speckle(random, Math.round(look.wear * 400), mix(look.grime, [128, 64, 30], 0.75), 3);
    for (let i = 0; i < Math.round(look.wear * 5); i++) {
      canvas.streak(Math.floor(random() * SIZE), 3 + Math.floor(random() * 5), mix(look.grime, [128, 64, 30], 0.6), 0.4 * look.wear, 4 + collar, SIZE);
    }
  }

  // Round: bright down the middle of the wrap, dark where it turns away at both edges.
  canvas.shade((u) => 0.5 + 0.62 * Math.sin(u * Math.PI));

  return { colour: canvas.bytes() };
}
