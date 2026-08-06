/**
 * Fake parts. A bulk section is four flat walls, which reads as a box however good the texture
 * is. Greebles break it: shallow boxes of different sizes standing off the face, the way a
 * kitbashed building carries panels, ducts, vents and blank signage.
 *
 * The scatter is seeded, so the same section rebuilds the same way and an edit somewhere else
 * never reshuffles it.
 */
import { Surface, type Vec } from './geometry.ts';
import { ringAt, type Corner, type SectionShape } from './section.ts';

export type GreebleOptions = {
  /** 0 to 1: how much of the face carries a part. */
  density: number;
  /** Same seed, same scatter. */
  seed: number;
  /** Which faces to dress. Default all four. */
  sides?: number[];
};

/** A small deterministic generator, so a building never reshuffles itself between builds. */
function rng(seed: number): () => number {
  let state = (seed | 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a section id into a seed, so ids alone decide the scatter. */
export function seedOf(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const point = (corner: Corner, y: number): Vec => [corner[0], y, corner[1]];

function lerp(a: Corner, b: Corner, t: number): Corner {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** One box standing off a face, between two heights, as a closed solid. */
function part(
  surface: Surface,
  lower: Corner[],
  upper: Corner[],
  edge: number,
  from: number,
  to: number,
  y0: number,
  y1: number,
  stand: number,
): void {
  const next = (edge + 1) % lower.length;
  const face = (ring: Corner[], t: number, out: number): Corner => {
    const a = ring[edge]!;
    const b = ring[next]!;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const length = Math.hypot(dx, dz) || 1;
    const outward: Corner = [dz / length, -dx / length];
    const on = lerp(a, b, t);
    return [on[0] + outward[0] * out, on[1] + outward[1] * out];
  };

  const bottom: Corner[] = [face(lower, from, 0), face(lower, to, 0), face(lower, to, stand), face(lower, from, stand)];
  const top: Corner[] = [face(upper, from, 0), face(upper, to, 0), face(upper, to, stand), face(upper, from, stand)];

  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    surface.quad(point(bottom[i]!, y0), point(bottom[j]!, y0), point(top[j]!, y1), point(top[i]!, y1));
  }
  surface.quad(point(top[0]!, y1), point(top[1]!, y1), point(top[2]!, y1), point(top[3]!, y1));
  surface.quad(point(bottom[3]!, y0), point(bottom[2]!, y0), point(bottom[1]!, y0), point(bottom[0]!, y0));
}

/**
 * Dress a section's faces. Each floor row is cut into cells; a cell that draws below the
 * density gets a part, one or two cells wide, part of the row tall, standing 0.1 to 0.45 m out.
 */
export function greebles(surface: Surface, shape: SectionShape, options: GreebleOptions): void {
  const density = Math.max(0, Math.min(1, options.density));
  if (density === 0) return;

  const random = rng(options.seed);
  const rows = Math.max(1, shape.floors);
  const sides = options.sides ?? [0, 1, 2, 3];

  for (let row = 0; row < rows; row++) {
    const lower = ringAt(shape, row / rows);
    const upper = ringAt(shape, (row + 1) / rows);
    const y0 = (shape.height * row) / rows;
    const y1 = (shape.height * (row + 1)) / rows;
    const height = y1 - y0;

    for (const edge of sides) {
      const next = (edge + 1) % lower.length;
      const a = lower[edge]!;
      const b = lower[next]!;
      const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const cells = Math.max(2, Math.round(run / 1.6));

      for (let cell = 0; cell < cells; cell++) {
        if (random() > density) continue;
        const wide = random() < 0.3 && cell + 1 < cells ? 2 : 1;
        const from = (cell + 0.12) / cells;
        const to = (cell + wide - 0.12) / cells;

        const tall = 0.25 + random() * 0.55;
        const base = random() * (1 - tall);
        const stand = 0.1 + random() * 0.35;

        part(surface, lower, upper, edge, from, to, y0 + height * base, y0 + height * (base + tall), stand);
        cell += wide - 1;
      }
    }
  }
}
