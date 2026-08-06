/** Plan geometry: how much of a section actually lands on the one below it. */
import type { Corner } from '#assemble';

export type Point = [number, number];

/** Shoelace, always positive. */
export function area(polygon: Point[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x0, z0] = polygon[i]!;
    const [x1, z1] = polygon[(i + 1) % polygon.length]!;
    sum += x0 * z1 - x1 * z0;
  }
  return Math.abs(sum) / 2;
}

export function centroid(polygon: Point[]): Point {
  const x = polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length;
  const z = polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length;
  return [x, z];
}

function side(a: Point, b: Point, p: Point): number {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

export function inside(polygon: Point[], p: Point): boolean {
  let positive = 0;
  let negative = 0;
  for (let i = 0; i < polygon.length; i++) {
    const value = side(polygon[i]!, polygon[(i + 1) % polygon.length]!, p);
    if (value > 0) positive += 1;
    if (value < 0) negative += 1;
  }
  return positive === 0 || negative === 0;
}

function intersect(a: Point, b: Point, c: Point, d: Point): Point {
  const a1 = b[1] - a[1];
  const b1 = a[0] - b[0];
  const c1 = a1 * a[0] + b1 * a[1];
  const a2 = d[1] - c[1];
  const b2 = c[0] - d[0];
  const c2 = a2 * c[0] + b2 * c[1];
  const determinant = a1 * b2 - a2 * b1;
  if (determinant === 0) return d;
  return [(b2 * c1 - b1 * c2) / determinant, (a1 * c2 - a2 * c1) / determinant];
}

/** Sutherland-Hodgman: the part of `subject` that lies inside the convex `clip`. */
export function overlap(subject: Point[], clip: Point[]): Point[] {
  let output = subject;
  const clockwise = signedArea(clip) < 0;

  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i]!;
    const b = clip[(i + 1) % clip.length]!;
    const input = output;
    output = [];

    for (let j = 0; j < input.length; j++) {
      const current = input[j]!;
      const previous = input[(j + input.length - 1) % input.length]!;
      const currentIn = clockwise ? side(a, b, current) <= 0 : side(a, b, current) >= 0;
      const previousIn = clockwise ? side(a, b, previous) <= 0 : side(a, b, previous) >= 0;

      if (currentIn) {
        if (!previousIn) output.push(intersect(previous, current, a, b));
        output.push(current);
      } else if (previousIn) {
        output.push(intersect(previous, current, a, b));
      }
    }
  }
  return output;
}

function signedArea(polygon: Point[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x0, z0] = polygon[i]!;
    const [x1, z1] = polygon[(i + 1) % polygon.length]!;
    sum += x0 * z1 - x1 * z0;
  }
  return sum / 2;
}

export function toPoints(corners: Corner[]): Point[] {
  return corners.map(([x, z]) => [x, z] as Point);
}
