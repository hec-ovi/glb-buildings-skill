/**
 * Cast concrete: the panel a composer puts on a face, the slab a balcony stands on, and whatever
 * else is a flat plate. Tiles by the metre.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 128;

export function drawConcrete(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x1c0f);
  const canvas = new Canvas(SIZE, SIZE, look.concrete);

  // The lines the shuttering leaves, and the holes the ties leave in them.
  const boards = 4;
  for (let i = 0; i < boards; i++) {
    const y = Math.round((i / boards) * SIZE);
    canvas.band(y, 1, tint(look.concrete, 0.9));
    canvas.band(y + 1, 1, tint(look.concrete, 1.05));
  }
  for (let i = 0; i < 6; i++) {
    const x = Math.round(random() * SIZE);
    const y = Math.round(random() * SIZE);
    canvas.rect(x, y, 3, 3, tint(look.concrete, 0.72));
  }

  // Aggregate, then the pour mottle over it.
  canvas.speckle(random, 900, tint(look.concrete, 1.2), 2);
  canvas.speckle(random, 300, tint(look.concrete, 0.78), 3);
  canvas.grain(random, 0.05 + look.wear * 0.08);

  const streaks = Math.round(2 + look.wear * 8);
  for (let i = 0; i < streaks; i++) {
    canvas.streak(Math.floor(random() * SIZE), 3 + Math.floor(random() * 8), look.grime, 0.15 + random() * 0.35 * look.wear, Math.floor(random() * SIZE), SIZE);
  }
  if (look.wear > 0.5) {
    // Patched repairs, which is most of what an old wall is by the time anybody photographs it.
    for (let i = 0; i < 2; i++) {
      const x = Math.floor(random() * SIZE);
      const y = Math.floor(random() * SIZE);
      canvas.rect(x, y, 18 + Math.floor(random() * 26), 14 + Math.floor(random() * 20), mix(look.concrete, look.grime, 0.28));
    }
  }

  return { colour: canvas.bytes() };
}
