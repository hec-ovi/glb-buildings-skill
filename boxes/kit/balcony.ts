/**
 * Balconies. A slab that runs along one face and reaches out, with a rounded front: the
 * partial cylinder is what stops a facade reading as nothing but boxes, and it costs a handful
 * of triangles per floor.
 *
 * Each slab is a closed prism built from its plan outline, so it stacks with everything else.
 */
import { Surface, type Vec } from './geometry.ts';
import { BITE, ringAt, type Corner, type SectionShape } from './section.ts';

export type BalconyOptions = {
  /** Which face, as an edge index: 0 south, 1 east, 2 north, 3 west. */
  edge: number;
  /** How far it reaches out, in metres. */
  depth: number;
  /** How thick the slab is. */
  thickness: number;
  /** How much of the face it covers, 0 to 1. */
  span: number;
  /** Segments across the rounded front. */
  segments: number;
};

export const BALCONY: BalconyOptions = { edge: 0, depth: 1.5, thickness: 0.28, span: 0.72, segments: 6 };

const point = (corner: Corner, y: number): Vec => [corner[0], y, corner[1]];

/**
 * The plan outline of one balcony: along the wall, out to the front, around the round end, and
 * back. Convex, so it caps with a fan.
 */
export function balconyPlan(ring: Corner[], options: BalconyOptions): Corner[] {
  const edge = options.edge % ring.length;
  const a = ring[edge]!;
  const b = ring[(edge + 1) % ring.length]!;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const run = Math.hypot(dx, dz) || 1;
  const along: Corner = [dx / run, dz / run];
  const out: Corner = [dz / run, -dx / run];

  const margin = (1 - options.span) / 2;
  const from = run * margin;
  const to = run * (1 - margin);
  const radius = Math.min(options.depth, (to - from) / 2);
  const straight = options.depth - radius;

  const at = (u: number, o: number): Corner => [a[0] + along[0] * u + out[0] * o, a[1] + along[1] * u + out[1] * o];

  // The back of the slab sits inside the wall, so the two never share a plane.
  const plan: Corner[] = [at(from, -BITE), at(from, straight)];
  // The round end sweeps from one side of the front to the other.
  for (let i = 0; i <= options.segments; i++) {
    const angle = Math.PI * (i / options.segments);
    const centre = (from + to) / 2;
    const half = (to - from) / 2;
    plan.push(at(centre - half * Math.cos(angle), straight + radius * Math.sin(angle)));
  }
  plan.push(at(to, -BITE));
  // Walked out from the wall and back, which is the opposite way round from a footprint; the
  // prism needs the same direction as the section it hangs on.
  return dedupe(plan).reverse();
}

/** A rounded end can land exactly on the point before it; two copies of a point make an edge
 *  with no length, which is not something a closed solid can carry. */
function dedupe(plan: Corner[]): Corner[] {
  const kept: Corner[] = [];
  for (const corner of plan) {
    const last = kept.at(-1);
    if (last && Math.hypot(corner[0] - last[0], corner[1] - last[1]) < 1e-6) continue;
    kept.push(corner);
  }
  const first = kept[0]!;
  const last = kept.at(-1)!;
  if (kept.length > 1 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-6) kept.pop();
  return kept;
}

/** A closed prism from a convex plan outline, between two heights. */
export function prism(surface: Surface, plan: Corner[], y0: number, y1: number): void {
  for (let i = 0; i < plan.length; i++) {
    const next = (i + 1) % plan.length;
    surface.quad(point(plan[i]!, y0), point(plan[next]!, y0), point(plan[next]!, y1), point(plan[i]!, y1));
  }
  // Fans, wound so the top faces up and the bottom faces down.
  for (let i = 1; i < plan.length - 1; i++) {
    surface.quad(point(plan[0]!, y1), point(plan[i]!, y1), point(plan[i + 1]!, y1), point(plan[0]!, y1));
    surface.quad(point(plan[0]!, y0), point(plan[i + 1]!, y0), point(plan[i]!, y0), point(plan[0]!, y0));
  }
}

/** One balcony per floor of the section, on the given face. */
export function balconies(surface: Surface, shape: SectionShape, options: BalconyOptions = BALCONY): void {
  const rows = Math.max(1, shape.floors);
  for (let row = 0; row < rows; row++) {
    const at = ringAt(shape, row / rows);
    const y = (shape.height * row) / rows;
    prism(surface, balconyPlan(at, options), y, y + options.thickness);
  }
}
