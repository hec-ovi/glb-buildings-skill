/**
 * The plant a roof carries: solar arrays and water tanks.
 *
 * Both are the things people actually recognise on a roof, so they are built as the real object
 * rather than a box standing in for one: panels tilted on a frame in rows, a tank on its legs
 * with a cap, a ladder and the pipe that leaves it.
 */
import { Surface, type Vec } from './geometry.ts';
import { segment } from './segment.ts';
import type { Corner } from './plan.ts';

const point = (at: Corner, y: number, dx = 0, dz = 0): Vec => [at[0] + dx, y, at[1] + dz];

/**
 * A run of solar panels: rows of tilted glass on a frame, all facing the same way. The tilt is
 * what makes it read as solar rather than as a table, so the frame is short at the front and
 * tall at the back and the panel bridges the two.
 */
export function solar(surface: Surface, at: Corner, y: number, turn: number, random: () => number): void {
  const rows = 2 + Math.round(random());
  const span = 1.7 + random() * 0.5;
  const run = 1.5;
  const low = 0.35;
  const high = low + 0.75 + random() * 0.3;

  const face: Corner = [Math.sin(turn), Math.cos(turn)];
  const across: Corner = [-face[1], face[0]];
  const gap = run + 0.55;
  const start = -((rows - 1) * gap) / 2;

  for (let row = 0; row < rows; row++) {
    const off = start + row * gap;
    const middle: Corner = [at[0] + face[0] * off, at[1] + face[1] * off];

    const front: Corner = [middle[0] + face[0] * (run / 2), middle[1] + face[1] * (run / 2)];
    const back: Corner = [middle[0] - face[0] * (run / 2), middle[1] - face[1] * (run / 2)];

    // The legs, two at the low edge and two at the high one.
    for (const side of [-1, 1]) {
      const shift: Corner = [across[0] * (span / 2 - 0.12) * side, across[1] * (span / 2 - 0.12) * side];
      segment(surface, [point(front, y, shift[0], shift[1]), point(front, y + low, shift[0], shift[1])], {
        profile: 'square',
        thickness: 0.08,
      });
      segment(surface, [point(back, y, shift[0], shift[1]), point(back, y + high, shift[0], shift[1])], {
        profile: 'square',
        thickness: 0.08,
      });
    }

    // The panel itself: one slab from the low edge up to the high one, as wide as the array.
    segment(
      surface,
      [point(front, y + low), point(back, y + high)],
      { profile: 'square', thickness: 0.07 },
    );
    for (const side of [-0.32, 0.32]) {
      const shift: Corner = [across[0] * span * side, across[1] * span * side];
      segment(
        surface,
        [point(front, y + low, shift[0], shift[1]), point(back, y + high, shift[0], shift[1])],
        { profile: 'square', thickness: 0.07 },
      );
    }
  }
}

/**
 * A water tank: a drum standing on a frame of legs, with a domed cap, a ladder up one side and
 * the outlet dropping to the deck. The legs are what make it read as a tank and not a silo.
 */
export function tank(surface: Surface, at: Corner, y: number, random: () => number): void {
  const stand = 2.6 + random() * 1.6;
  const radius = 1 + random() * 0.45;
  const body = 1.7 + random() * 0.9;
  const spread = radius * 0.78;

  const feet: Corner[] = [
    [at[0] - spread, at[1] - spread],
    [at[0] + spread, at[1] - spread],
    [at[0] + spread, at[1] + spread],
    [at[0] - spread, at[1] + spread],
  ];

  // Legs, and a brace ring round them, so it stands on a frame rather than four loose posts.
  for (const foot of feet) {
    segment(surface, [point(foot, y), point(foot, y + stand)], { profile: 'square', thickness: 0.17 });
  }
  for (let i = 0; i < feet.length; i++) {
    const a = feet[i]!;
    const b = feet[(i + 1) % feet.length]!;
    segment(surface, [point(a, y + stand * 0.55), point(b, y + stand * 0.55)], { profile: 'square', thickness: 0.09 });
  }

  // The drum, then the cap on top of it.
  segment(surface, [point(at, y + stand), point(at, y + stand + body)], { profile: 'round', thickness: radius * 2, sides: 12 });
  segment(surface, [point(at, y + stand + body), point(at, y + stand + body + 0.35)], {
    profile: 'round',
    thickness: radius * 1.2,
    sides: 12,
  });

  // A ladder up one side, and the outlet running back down to the deck.
  const side: Corner = [at[0] + radius + 0.12, at[1]];
  segment(surface, [point(side, y), point(side, y + stand + body)], { profile: 'square', thickness: 0.06 });
  for (let rung = 1; rung * 0.55 < stand + body; rung++) {
    const up = y + rung * 0.55;
    segment(surface, [point(side, up, 0, -0.16), point(side, up, 0, 0.16)], { profile: 'square', thickness: 0.05 });
  }

  const drop: Corner = [at[0] - radius * 0.6, at[1] - radius * 0.6];
  segment(
    surface,
    [point(at, y + stand + 0.2), point(drop, y + stand + 0.2), point(drop, y + 0.05)],
    { profile: 'round', thickness: 0.16, sides: 8 },
  );
}
