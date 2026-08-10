/**
 * One door leaf: a frame, a glazed upper light with a lobby behind it, a solid lower panel, a
 * handle and a kick plate. It fills the element it is given rather than tiling.
 *
 * The glazing carries a little light in the emissive map, because a lit entrance is what puts a
 * building on a street rather than in a field.
 */
import { Canvas, mix, rng, tint, type Drawing, type Rgb } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const WIDTH = 128;
const HEIGHT = 256;

/** The warm of a lobby behind the glass. Every family has one, at its own temperature. */
function lobby(look: StyleSheet): Rgb {
  return mix(look.lights[0]!.colour, look.neon, 0.25);
}

export function drawDoor(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x3ab7);
  const canvas = new Canvas(WIDTH, HEIGHT, look.frame);
  const light = new Canvas(WIDTH, HEIGHT, [0, 0, 0]);

  const border = Math.round(WIDTH * 0.09);
  const leafWidth = WIDTH - border * 2;
  const glassTop = Math.round(HEIGHT * 0.08);
  const glassBottom = Math.round(HEIGHT * 0.58);
  const warm = lobby(look);

  // The leaf itself.
  canvas.rect(border, glassTop, leafWidth, HEIGHT - glassTop - border, look.door);

  // The glazed upper light, with the lobby glow falling off toward the bottom of the opening.
  const glassHeight = glassBottom - glassTop;
  for (let y = 0; y < glassHeight; y++) {
    const deep = y / glassHeight;
    const row = mix(tint(warm, 0.42), tint(warm, 0.12), deep * deep);
    canvas.rect(border + 3, glassTop + y, leafWidth - 6, 1, row);
    light.rect(border + 3, glassTop + y, leafWidth - 6, 1, tint(row, 0.9));
  }
  // The floor line of the lobby, seen through the glass.
  canvas.rect(border + 3, glassBottom - Math.round(HEIGHT * 0.06), leafWidth - 6, 2, tint(warm, 0.6));

  // The lower panel, its moulding, and the kick plate along the bottom.
  canvas.rect(border + 6, glassBottom + 8, leafWidth - 12, HEIGHT - glassBottom - border - 22, tint(look.door, 0.86));
  canvas.rect(border, HEIGHT - border - 14, leafWidth, 14, tint(look.frame, 0.9));

  // The handle: a full height pull on the opening side.
  canvas.rect(WIDTH - border - 14, Math.round(HEIGHT * 0.4), 5, Math.round(HEIGHT * 0.22), tint(look.frame, 1.15));

  canvas.grain(random, 0.05 + look.wear * 0.16);
  if (look.wear > 0.3) {
    // Paint goes at the handle and along the bottom before it goes anywhere else.
    canvas.rect(WIDTH - border - 26, Math.round(HEIGHT * 0.44), 10, Math.round(HEIGHT * 0.12), mix(look.door, look.grime, 0.5 * look.wear));
    canvas.rect(border, HEIGHT - border - 4, leafWidth, 4, mix(look.door, look.grime, 0.7 * look.wear));
  }

  return { colour: canvas.bytes(), emissive: light.bytes() };
}
