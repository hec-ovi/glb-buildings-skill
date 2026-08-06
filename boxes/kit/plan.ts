/**
 * Footprint arithmetic. A footprint is a convex ring of corners on the ground plane, in metres,
 * and everything the kit hangs on a section asks this file where the outside is.
 *
 * Taking the outside from the winding instead is a sign, and a sign that comes out wrong buries
 * a part inside the building where nobody sees it until the model is open. Here it is measured
 * against the middle of the ring, so it cannot be wrong however the ring was wound.
 */

/** A footprint corner on the ground plane, in metres. */
export type Corner = [number, number];

export function lerp(a: Corner, b: Corner, t: number): Corner {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** The middle of a footprint. */
export function middleOf(ring: Corner[]): Corner {
  const x = ring.reduce((sum, corner) => sum + corner[0], 0) / ring.length;
  const z = ring.reduce((sum, corner) => sum + corner[1], 0) / ring.length;
  return [x, z];
}

/** Whether a point is on a footprint. Convex, so one sign test per edge decides it. */
export function insideRing(ring: Corner[], p: Corner): boolean {
  let positive = 0;
  let negative = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const side = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (side > 0) positive += 1;
    if (side < 0) negative += 1;
  }
  return positive === 0 || negative === 0;
}

/** The unit vector along one edge, from its start corner to its end. */
export function tangentAt(ring: Corner[], edge: number): Corner {
  const a = ring[edge % ring.length]!;
  const b = ring[(edge + 1) % ring.length]!;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const length = Math.hypot(dx, dz) || 1;
  return [dx / length, dz / length];
}

/** The way out of the building at one edge: the perpendicular that points away from the middle. */
export function outwardAt(ring: Corner[], edge: number): Corner {
  const a = ring[edge % ring.length]!;
  const b = ring[(edge + 1) % ring.length]!;
  const [tx, tz] = tangentAt(ring, edge);
  const normal: Corner = [-tz, tx];

  const middle = middleOf(ring);
  const away: Corner = [(a[0] + b[0]) / 2 - middle[0], (a[1] + b[1]) / 2 - middle[1]];
  return normal[0] * away[0] + normal[1] * away[1] >= 0 ? normal : [-normal[0], -normal[1]];
}

/** The point on the ring's edge closest to a point, which edge it is on, and how far away. */
export function nearestOn(ring: Corner[], from: Corner): { at: Corner; edge: number; distance: number } {
  let at: Corner = ring[0]!;
  let edge = 0;
  let distance = Infinity;

  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const length2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((from[0] - a[0]) * dx + (from[1] - a[1]) * dz) / length2));
    const on: Corner = [a[0] + dx * t, a[1] + dz * t];
    const gap = Math.hypot(on[0] - from[0], on[1] - from[1]);
    if (gap >= distance) continue;
    distance = gap;
    at = on;
    edge = i;
  }
  return { at, edge, distance };
}

/**
 * How far a point is past the footprint, in metres, negative when it is inside. Told apart by
 * the winding count rather than by `outwardAt`, so a proof written on top of this one is not
 * measuring with the same ruler it is checking.
 */
export function outsideBy(ring: Corner[], p: Corner): number {
  const { distance } = nearestOn(ring, p);
  return insideRing(ring, p) ? -distance : distance;
}

/** Pull a footprint in toward its own middle, which is what a bevelled edge sits on. */
export function insetRing(ring: Corner[], by: number): Corner[] {
  if (by <= 0) return ring;
  const [cx, cz] = middleOf(ring);
  return ring.map(([x, z]) => {
    const dx = x - cx;
    const dz = z - cz;
    const length = Math.hypot(dx, dz) || 1;
    const pull = Math.min(by, length * 0.9);
    return [x - (dx / length) * pull, z - (dz / length) * pull] as Corner;
  });
}
