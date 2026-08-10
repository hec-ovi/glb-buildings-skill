/**
 * A plain wall: the family's own material with no windows drawn in it at all.
 *
 * This is what a section wears when somebody composes their own openings on it. The ordinary wall
 * tile already draws a window in the middle of every bay, so a door composed there lands on top of
 * one, and no amount of aligning fixes it: the two are the same place. A worked floor needs a
 * blank wall to put things on, and that is this.
 *
 * Laid in courses for a family built of small units, in panels for one built of large ones.
 */
import { Canvas, mix, rng, tint, type Drawing } from '../paint.ts';
import type { StyleSheet } from '../styles.ts';

const SIZE = 256;
/** Courses per tile, at 3 m a tile: about 75 mm a course, which is what a brick is. */
const COURSES = 40;

export function drawWall(look: StyleSheet, seed: number): Drawing {
  const random = rng(seed ^ 0x77a3);
  const canvas = new Canvas(SIZE, SIZE, look.wall);

  if (look.masonry) courses(canvas, look, random);
  else panels(canvas, look, random);

  canvas.grain(random, 0.05 + look.wear * 0.1);

  // Weather runs down a blank wall from whatever sticks out of it, and something always does.
  const streaks = Math.round(1 + look.wear * 7);
  for (let i = 0; i < streaks; i++) {
    canvas.streak(
      Math.floor(random() * SIZE),
      2 + Math.floor(random() * 6),
      look.grime,
      0.15 + random() * 0.35 * look.wear,
      Math.floor(random() * SIZE),
      SIZE,
    );
  }

  return { colour: canvas.bytes() };
}

/** Small units in courses, every other one offset by half, with mortar between them. */
function courses(canvas: Canvas, look: StyleSheet, random: () => number): void {
  const high = SIZE / COURSES;
  const long = high * 2.6;
  const mortar = mix(look.wall, [206, 200, 186], 0.55);

  for (let course = 0; course < COURSES; course++) {
    const y = Math.round(course * high);
    canvas.band(y, 1, mortar);

    const offset = course % 2 === 0 ? 0 : long / 2;
    for (let x = -long; x < SIZE + long; x += long) {
      canvas.rect(Math.round(x + offset), y + 1, 1, Math.round(high) - 1, mortar);
      // No two bricks are the same colour, which is the whole reason brick reads as brick.
      const unit = tint(look.wall, 0.86 + random() * 0.3);
      canvas.rect(Math.round(x + offset) + 1, y + 1, Math.round(long) - 1, Math.round(high) - 1, unit);
    }
  }
}

/** Large units: a panel joint every half tile, with the light catching the edge below it. */
function panels(canvas: Canvas, look: StyleSheet, random: () => number): void {
  const joint = tint(look.wall, 0.7);
  for (const at of [0, SIZE / 2]) {
    canvas.band(at, 2, joint);
    canvas.band(at + 2, 1, tint(look.wall, 1.1));
    canvas.stripe(at, 2, joint);
  }
  canvas.speckle(random, 420, tint(look.wall, 1.12), 2);
  canvas.speckle(random, 180, tint(look.wall, 0.85), 3);
}
