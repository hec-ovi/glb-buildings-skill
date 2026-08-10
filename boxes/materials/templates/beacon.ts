/**
 * The lens on the tip of a mast, and the marker on a roof corner: the one part of an antenna that
 * is not dark. Small, lit, and the same tile whatever colour the material tints it.
 */
import { Canvas, rng, tint, type Drawing, type Rgb } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 64;
const LENS: Rgb = [255, 255, 255];

export function drawBeacon(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x7f13);
  const cage = tint(look.antenna, 0.5);
  const canvas = new Canvas(SIZE, SIZE, cage);
  const light = new Canvas(SIZE, SIZE, [0, 0, 0]);

  // The lens fills most of the tile: at this size anything smaller disappears.
  const inset = Math.round(SIZE * 0.12);
  const span = SIZE - inset * 2;
  const middle = SIZE / 2;

  for (let y = inset; y < inset + span; y++) {
    for (let x = inset; x < inset + span; x++) {
      const away = Math.hypot(x - middle, y - middle) / (span / 2);
      if (away > 1) continue;
      // Hot in the middle, falling off to the rim, with the ribs of a fresnel lens across it.
      const rib = 0.82 + 0.18 * Math.abs(Math.sin(away * Math.PI * 5));
      const face = tint(LENS, Math.max(0.12, (1 - away * away) * rib));
      canvas.pixel(x, y, face);
      light.pixel(x, y, face);
    }
  }

  // The guard bars over it, which is what stops it reading as a glowing ball.
  for (const x of [Math.round(SIZE * 0.28), Math.round(SIZE * 0.68)]) {
    canvas.stripe(x, 3, cage);
    light.stripe(x, 3, [0, 0, 0]);
  }
  canvas.band(0, inset, cage);
  canvas.band(SIZE - inset, inset, cage);

  canvas.grain(random, 0.04);
  return { colour: canvas.bytes(), emissive: light.bytes() };
}
