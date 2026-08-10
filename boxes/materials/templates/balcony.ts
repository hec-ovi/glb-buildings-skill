/**
 * A balustrade: the rail and what fills it. The slab a balcony stands on is concrete and is built
 * as concrete, so this tile is only the part somebody leans on.
 *
 * It fills the element rather than tiling, so one image is one balustrade whatever the balcony is.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const WIDTH = 256;
const HEIGHT = 128;

export function drawBalcony(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x61e3);
  const gap = tint(look.wall, 0.55);
  const canvas = new Canvas(WIDTH, HEIGHT, gap);

  const railTop = Math.round(HEIGHT * 0.06);
  const bottom = Math.round(HEIGHT * 0.88);

  // The top rail, and the bottom rail the balusters stand on.
  canvas.band(0, railTop + 4, look.rail);
  canvas.band(bottom, HEIGHT - bottom, tint(look.rail, 0.8));

  // The balusters. Spacing is what makes a guard read as a guard: close enough to be a barrier.
  const pitch = Math.round(WIDTH / 18);
  for (let x = Math.round(pitch / 2); x < WIDTH; x += pitch) {
    canvas.rect(x, railTop, Math.max(2, Math.round(pitch * 0.28)), bottom - railTop, tint(look.rail, 0.92 + random() * 0.12));
  }

  canvas.grain(random, 0.05 + look.wear * 0.15);
  if (look.wear > 0.3) {
    // Rust starts at the fixings and runs down from every one of them.
    for (let x = Math.round(pitch / 2); x < WIDTH; x += pitch) {
      if (random() > look.wear) continue;
      canvas.streak(x, Math.max(2, Math.round(pitch * 0.3)), mix(look.grime, [120, 62, 32], 0.6), 0.5 * look.wear, bottom - 6, HEIGHT);
    }
  }

  return { colour: canvas.bytes() };
}
