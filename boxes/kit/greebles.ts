/**
 * Fake parts. A bulk section is four flat walls, which reads as a box however good the texture
 * is. Greebles break it: shallow boxes of different sizes standing off the face, the way a
 * kitbashed building carries panels, ducts, vents and blank signage.
 *
 * The scatter is seeded, so the same section rebuilds the same way and an edit somewhere else
 * never reshuffles it.
 */
import { Surface, type Vec } from './geometry.ts';
import { BITE, outwardAt, ringAt, type Corner, type SectionShape } from './section.ts';

type GreebleOptions = {
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
    const outward = outwardAt(ring, edge);
    const on = lerp(ring[edge]!, ring[next]!, t);
    return [on[0] + outward[0] * out, on[1] + outward[1] * out];
  };

  // Outer face first, then the back, which sits inside the wall: two faces in the same plane
  // flicker. Round the same way as a footprint, so the panel faces out.
  const bottom: Corner[] = [face(lower, from, stand), face(lower, to, stand), face(lower, to, -BITE), face(lower, from, -BITE)];
  const top: Corner[] = [face(upper, from, stand), face(upper, to, stand), face(upper, to, -BITE), face(upper, from, -BITE)];

  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    surface.quad(point(bottom[i]!, y0), point(bottom[j]!, y0), point(top[j]!, y1), point(top[i]!, y1));
  }
  surface.quad(point(top[0]!, y1), point(top[1]!, y1), point(top[2]!, y1), point(top[3]!, y1));
  surface.quad(point(bottom[3]!, y0), point(bottom[2]!, y0), point(bottom[1]!, y0), point(bottom[0]!, y0));
}

/**
 * Panels, by recursive subdivision. Each face of each floor is split in two, again and again,
 * until the pieces are about a metre across; every leaf either stays flat or stands out by a
 * quantised depth. Big slabs, medium blocks and small chips come out of the same pass, which is
 * what makes the result read as erratic rather than as a regular grid of bumps.
 *
 * The panels that stay flat are the cuts: a face made of standing slabs reads as recessed
 * wherever a slab is missing, and nothing has to be subtracted from anything.
 */

/** Depths a panel can stand out by. Quantised, so the face keeps a built look. */
const DEPTHS = [0.12, 0.22, 0.35, 0.55, 0.9];

type Panel = { u0: number; u1: number; v0: number; v1: number };

function split(panel: Panel, random: () => number, run: number, rise: number, depth: number, out: Panel[]): void {
  const width = (panel.u1 - panel.u0) * run;
  const height = (panel.v1 - panel.v0) * rise;
  const small = width < 1.1 || height < 0.9;

  if (depth === 0 || small || random() < 0.18) {
    out.push(panel);
    return;
  }

  // Split the long way, at a ratio that is never a clean half.
  const cut = 0.32 + random() * 0.36;
  if (width >= height) {
    const at = panel.u0 + (panel.u1 - panel.u0) * cut;
    split({ ...panel, u1: at }, random, run, rise, depth - 1, out);
    split({ ...panel, u0: at }, random, run, rise, depth - 1, out);
  } else {
    const at = panel.v0 + (panel.v1 - panel.v0) * cut;
    split({ ...panel, v1: at }, random, run, rise, depth - 1, out);
    split({ ...panel, v0: at }, random, run, rise, depth - 1, out);
  }
}

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
    const rise = y1 - y0;

    for (const edge of sides) {
      const a = lower[edge]!;
      const b = lower[(edge + 1) % lower.length]!;
      const run = Math.hypot(b[0] - a[0], b[1] - a[1]);

      const panels: Panel[] = [];
      split({ u0: 0.02, u1: 0.98, v0: 0.04, v1: 0.96 }, random, run, rise, 4, panels);

      // Panels are pulled apart by a few centimetres, so neighbours never share a face and the
      // gap reads as the reveal between two slabs.
      const gapU = 0.03 / run;
      const gapV = 0.03 / rise;

      for (const panel of panels) {
        // A panel left flat is a cut: the slabs around it do the work.
        if (random() > density) continue;
        const stand = DEPTHS[Math.floor(random() * DEPTHS.length)]!;
        part(
          surface,
          lower,
          upper,
          edge,
          panel.u0 + gapU,
          panel.u1 - gapU,
          y0 + rise * (panel.v0 + gapV),
          y0 + rise * (panel.v1 - gapV),
          stand,
        );
      }
    }
  }
}
