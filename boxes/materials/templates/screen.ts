/**
 * A screen: a sign, a video wall, the panel standing off a tower. Drawn as an LED wall rather than
 * as a picture, since the picture is whatever somebody drops in the pack later.
 *
 * It fills the element it is given, so one image is one screen at whatever size the screen is.
 */
import { Canvas, mix, rng, tint, type Drawing, type Rgb } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const WIDTH = 256;
const HEIGHT = 128;

export function drawScreen(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0xc41b);
  const dark: Rgb = [4, 4, 6];
  const canvas = new Canvas(WIDTH, HEIGHT, dark);
  const light = new Canvas(WIDTH, HEIGHT, [0, 0, 0]);

  const second = mix(look.screen, look.neon, 0.6);
  const cell = 8;

  // Blocks of content: bars, a big field, and a column of indicators. Abstract on purpose, so it
  // reads as a screen from any distance and never as text that turns out to say nothing.
  for (let y = 0; y < HEIGHT; y += cell) {
    const row = random();
    if (row < 0.34) continue;
    const runs = 1 + Math.floor(random() * 3);
    for (let i = 0; i < runs; i++) {
      const x = Math.floor(random() * WIDTH);
      const width = cell * (2 + Math.floor(random() * 12));
      const colour = tint(random() < 0.6 ? look.screen : second, 0.5 + random() * 0.5);
      canvas.rect(x, y, width, cell - 1, colour);
      light.rect(x, y, width, cell - 1, colour);
    }
  }

  const blockX = Math.floor(random() * (WIDTH / 2));
  const blockY = Math.floor(random() * (HEIGHT / 2));
  canvas.rect(blockX, blockY, WIDTH / 3, HEIGHT / 4, tint(second, 0.9));
  light.rect(blockX, blockY, WIDTH / 3, HEIGHT / 4, tint(second, 0.9));

  // Scanlines: every other row darker, which is the whole difference between a screen and a poster.
  for (let y = 0; y < HEIGHT; y += 2) {
    for (let x = 0; x < WIDTH; x++) {
      canvas.pixel(x, y, tint(canvas.read(x, y), 0.72));
      light.pixel(x, y, tint(light.read(x, y), 0.72));
    }
  }

  // A dead row, and the refresh band drifting through.
  const dead = Math.floor(random() * HEIGHT);
  canvas.band(dead, 2, dark);
  light.band(dead, 2, [0, 0, 0]);
  const refresh = Math.floor(random() * HEIGHT);
  for (let y = refresh; y < refresh + 12; y++) {
    for (let x = 0; x < WIDTH; x++) light.pixel(x, y, tint(light.read(x, y), 1.35));
  }

  return { colour: canvas.bytes(), emissive: light.bytes() };
}
