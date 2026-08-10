/**
 * One window unit, close up: the pane a composer puts on a face by hand. It fills the element it
 * is given rather than tiling, so one image is one window whatever size the window is.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 128;

export function drawWindow(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x77c1);
  const canvas = new Canvas(SIZE, SIZE, look.frame);

  const border = Math.round(SIZE * 0.07);
  const inner = SIZE - border * 2;

  // The glass: lighter at the head where it catches the sky, near black at the sill.
  for (let y = 0; y < inner; y++) {
    const sky = 1 - y / inner;
    const row = mix(look.glass, look.sheen, sky * sky);
    canvas.rect(border, border + y, inner, 1, row);
  }

  // A diagonal of reflected light, the one thing that says glass rather than a dark hole.
  for (let i = 0; i < inner; i++) {
    const x = border + Math.round(i * 0.7);
    canvas.rect(x, border + inner - 1 - i, Math.round(SIZE * 0.09), 1, mix(canvas.read(x, border + inner - 1 - i), look.sheen, 0.5));
  }

  // The mullion down the middle, and the shadow line inside the frame.
  canvas.rect(Math.round(SIZE / 2 - SIZE * 0.012), border, Math.max(2, Math.round(SIZE * 0.024)), inner, look.frame);
  canvas.rect(border, border, inner, 1, tint(look.frame, 0.45));
  canvas.rect(border, border, 1, inner, tint(look.frame, 0.6));

  canvas.grain(random, 0.05 + look.wear * 0.1);
  // Dirt collects in the corners of a window long before it collects anywhere else.
  if (look.wear > 0.3) {
    canvas.streak(border + 1, 3, look.grime, look.wear * 0.5, border, border + inner);
    canvas.streak(border + inner - 4, 3, look.grime, look.wear * 0.4, border, border + inner);
  }

  return { colour: canvas.bytes() };
}
