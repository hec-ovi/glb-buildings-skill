/**
 * A neon run: a housing with a lit diffuser down the middle of it. The tile wraps around the tube
 * across and covers a metre of run down, the same layout as a pipe, so a line climbing twenty
 * floors is one run of one texture.
 *
 * Drawn white and tinted by the material, so one tile gives cyan, magenta, red or amber without
 * four more images.
 */
import { Canvas, rng, tint, type Drawing, type Rgb } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const WIDTH = 64;
const HEIGHT = 128;
const LENS: Rgb = [255, 255, 255];

export function drawNeon(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0xe07a);
  const housing = tint(look.metal, 0.45);
  const canvas = new Canvas(WIDTH, HEIGHT, housing);
  const light = new Canvas(WIDTH, HEIGHT, [0, 0, 0]);

  // The housing, ribbed along its length.
  for (let x = 0; x < WIDTH; x += 4) canvas.stripe(x, 1, tint(housing, 0.82));

  // The diffuser: the middle third of the wrap, so the run shows a lit face and a dark back.
  const from = Math.round(WIDTH / 3);
  const width = Math.round(WIDTH / 3);
  canvas.rect(from, 0, width, HEIGHT, LENS);
  light.rect(from, 0, width, HEIGHT, LENS);
  // Brighter down the centre line of the lens, and a gasket where it meets the housing.
  canvas.rect(from + Math.round(width / 2) - 2, 0, 4, HEIGHT, [255, 255, 255]);
  canvas.rect(from - 1, 0, 1, HEIGHT, tint(housing, 0.5));
  canvas.rect(from + width, 0, 1, HEIGHT, tint(housing, 0.5));

  // A mounting bracket once a metre, which is the only thing that breaks the run.
  canvas.band(2, 5, tint(housing, 1.3));
  light.band(2, 5, [0, 0, 0]);

  canvas.grain(random, 0.03);
  return { colour: canvas.bytes(), emissive: light.bytes() };
}
