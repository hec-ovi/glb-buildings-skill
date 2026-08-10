/**
 * The glass over a screen: the dot matrix, and nothing else.
 *
 * A screen is not a picture on a wall. What makes it read as a screen is the grid of lamps behind
 * the glass, and the fact that you can see a little of the city through it. So the picture stays a
 * clean picture and this goes over it: a tile that is almost entirely nothing, with a dark dot
 * where each pixel of the wall ends and the gap between them begins.
 *
 * It tiles by the metre, so the dots stay the same size on a screen of any size, which is what a
 * real LED wall does.
 */
import { Canvas, type Drawing, type Rgb } from '../paint.ts';

const SIZE = 128;
/** Dots across one tile. At a metre a tile, that puts a lamp every 8 cm. */
const DOTS = 12;
const DARK: Rgb = [0, 0, 0];

export function drawScreenGlass(): Drawing {
  // Nothing at all to start with: alpha zero everywhere, so the picture behind comes through.
  const canvas = new Canvas(SIZE, SIZE, DARK).fill(DARK, 0);
  const pitch = SIZE / DOTS;
  const radius = pitch * 0.34;

  for (let row = 0; row < DOTS; row++) {
    for (let column = 0; column < DOTS; column++) {
      const cx = (column + 0.5) * pitch;
      const cy = (row + 0.5) * pitch;
      for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
        for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
          const away = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / radius;
          if (away > 1) continue;
          // Soft at the rim, so the grid reads as lamps rather than as punched holes.
          canvas.pixel(x, y, DARK, Math.round(190 * (1 - away * away)));
        }
      }
    }
  }

  // And the fine gap between the panels the wall is built from, which is what gives a big screen
  // its scale: without it a screen is one flat rectangle however large you make it.
  for (let i = 0; i < SIZE; i++) {
    canvas.pixel(i, 0, DARK, 120);
    canvas.pixel(0, i, DARK, 120);
  }

  return { colour: canvas.bytes() };
}
