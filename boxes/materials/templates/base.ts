/**
 * The base: the wall a building stands on at street level.
 *
 * A ground floor is not a floor of the tower with bigger glass. It is a different thing: heavier,
 * plainer, and it carries the entrance. Wearing the wall tile there stacks another row of lit
 * offices on the pavement, which is the one place a building is looked at from two metres away.
 *
 * So this tile has no window grid in it at all. It tiles by the metre like any other material and
 * it is deliberately quiet, because what goes on it is a door.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 128;

export function drawBase(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x2b71);
  const stone = mix(look.concrete, look.wall, 0.35);
  const canvas = new Canvas(SIZE, SIZE, stone);

  // Big panels, two to a tile, with a recessed joint between them. A base is made of few, large
  // pieces: that is most of what makes it read as heavier than the floors above.
  const joint = tint(stone, 0.72);
  canvas.band(0, 2, joint);
  canvas.band(SIZE / 2, 2, joint);
  canvas.stripe(0, 2, joint);
  canvas.stripe(SIZE / 2, 2, joint);
  // A highlight under each joint, which is the light catching the edge of the panel below it.
  canvas.band(2, 1, tint(stone, 1.12));
  canvas.band(SIZE / 2 + 2, 1, tint(stone, 1.12));

  canvas.speckle(random, 700, tint(stone, 1.15), 2);
  canvas.speckle(random, 260, tint(stone, 0.82), 3);
  canvas.grain(random, 0.05 + look.wear * 0.1);

  // Everything at street level is dirtier at the bottom and scuffed where people pass it.
  const streaks = Math.round(2 + look.wear * 7);
  for (let i = 0; i < streaks; i++) {
    canvas.streak(Math.floor(random() * SIZE), 3 + Math.floor(random() * 7), look.grime, 0.2 + random() * 0.35 * look.wear, Math.floor(random() * SIZE), SIZE);
  }
  if (look.wear > 0.4) {
    canvas.rect(Math.floor(random() * SIZE), SIZE - 18, 20 + Math.floor(random() * 30), 18, mix(stone, look.grime, 0.3));
  }

  return { colour: canvas.bytes() };
}
