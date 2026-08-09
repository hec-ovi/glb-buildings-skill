/**
 * Document to placed scene. Bands stack from y=0 upward, each floor's facade is
 * divided into bays whose widths are the exact integer partition of the side, so a
 * facade never leaves a gap or an overlap at the corner.
 *
 * Axes: X east, Y up, Z south. So side S faces +Z (the front, toward the default
 * camera), N faces -Z, E faces +X, W faces -X. Bays run along increasing X on the
 * N and S sides, along increasing Z on the E and W sides.
 */
import { BuildingError, bandFloorHeight, bayCount, partition, type Band, type BuildingDocument, type Mm, type Side } from '#spec';
import type { Box, Corner, PlacedBand, PlacedBay, PlacedFloor, PlacedScene } from './scene.ts';

/** Facade panel depth used for blueprint volumes until the kit places real walls. */
export const PANEL_THICKNESS: Mm = 200;

/** How far a corner has to stand off the line through its neighbours to be a corner at all, in mm. */
const FLAT = 50;

/** How much a rounding step may read as a turn the wrong way before the plan is not convex, in mm². */
const STRAIGHT = 2000;

type Rect = { x0: Mm; x1: Mm; z0: Mm; z1: Mm };

function footprintRect(doc: BuildingDocument, band: Band): Rect {
  const width = band.width ?? doc.footprint.width;
  const depth = band.depth ?? doc.footprint.depth;
  const x0 = -Math.floor(width / 2) + band.inset + band.shiftX;
  const z0 = -Math.floor(depth / 2) + band.inset + band.shiftZ;
  return { x0, x1: x0 + width - 2 * band.inset, z0, z1: z0 + depth - 2 * band.inset };
}

type Plan = { round?: number; arc: number; corner: number; bow: string };

/**
 * The footprint as world corners, turned about the building's own axis. Bands that step, slide,
 * turn, round off or get sliced all end up as plain convex polygons, and the junction between
 * two of them is one loft.
 */
function cornersOf(rect: Rect, degrees: number, shrink: number, plan: Plan): Corner[] {
  const square: Corner[] = [
    [rect.x0 + shrink, rect.z1 - shrink],
    [rect.x1 - shrink, rect.z1 - shrink],
    [rect.x1 - shrink, rect.z0 + shrink],
    [rect.x0 + shrink, rect.z0 + shrink],
  ];

  const points: Corner[] = plan.round
    ? ellipse(rect, shrink, plan.round, plan.arc)
    : plan.bow !== ''
      ? bowed(square, plan.bow)
      : plan.corner > 0
        ? fillet(square, plan.corner)
        : square;

  if (degrees === 0) return points;
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(([x, z]) => [Math.round(x * cos + z * sin), Math.round(-x * sin + z * cos)]);
}

/**
 * A round footprint: the ellipse inside the rectangle, walked the same way as the corners. An arc
 * of less than a full turn is a slice of it, closed through the middle while the middle is still
 * outside the chord. So a quarter turn is a wedge with its point at the middle, a half turn is a
 * D, and three quarters is a cylinder with a flat cut across it. Every one of them is convex.
 */
function ellipse(rect: Rect, shrink: number, segments: number, arc: number): Corner[] {
  const cx = (rect.x0 + rect.x1) / 2;
  const cz = (rect.z0 + rect.z1) / 2;
  const rx = (rect.x1 - rect.x0) / 2 - shrink;
  const rz = (rect.z1 - rect.z0) / 2 - shrink;

  const sweep = (Math.min(360, arc) * Math.PI) / 180;
  const full = arc >= 360;
  // Starts on the south face and turns south, east, north, west, the way a box does.
  const at = (angle: number): Corner => [Math.round(cx + rx * Math.sin(angle)), Math.round(cz + rz * Math.cos(angle))];

  const steps = full ? segments : Math.max(2, Math.round((segments * sweep) / (Math.PI * 2)));
  const points: Corner[] = [];
  for (let i = 0; i < (full ? steps : steps + 1); i++) points.push(at((i / steps) * sweep));
  if (full) return points;

  const first = points[0]!;
  const last = points.at(-1)!;
  const chord = Math.hypot(last[0] - first[0], last[1] - first[1]) || 1;
  const sideOf = (p: Corner) =>
    ((last[0] - first[0]) * (p[1] - first[1]) - (last[1] - first[1]) * (p[0] - first[0])) / chord;

  // The middle only earns a corner while it stands clear on the far side of the chord from the
  // arc. Past a half turn it is inside the arc, where it would fold the plan in on itself.
  const middle = sideOf([cx, cz]);
  if (Math.sign(middle) !== Math.sign(sideOf(at(sweep / 2))) && Math.abs(middle) > FLAT) {
    points.push([Math.round(cx), Math.round(cz)]);
  }
  return points;
}

/** Faces in the order the rectangle's edges are walked. */
const FACES: { side: Side; out: [number, number] }[] = [
  { side: 'S', out: [0, 1] },
  { side: 'E', out: [1, 0] },
  { side: 'N', out: [0, -1] },
  { side: 'W', out: [-1, 0] },
];

/**
 * Named faces bulged out into a round end: the edge becomes an arc standing off it, as deep as
 * the face is wide or the plan is deep, whichever is less. Two opposite faces bowed is the plan
 * of a stadium, one is a tower with a rounded front.
 */
function bowed(square: Corner[], sides: string, steps = 6): Corner[] {
  const points: Corner[] = [];

  for (let i = 0; i < square.length; i++) {
    const a = square[i]!;
    const b = square[(i + 1) % square.length]!;
    if (!sides.includes(FACES[i]!.side)) {
      points.push(a);
      continue;
    }

    const [ox, oz] = FACES[i]!.out;
    const after = square[(i + 2) % square.length]!;
    const half = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2;
    const across = Math.hypot(after[0] - b[0], after[1] - b[1]);

    // A face bowed beside another bowed face has to stay shallow: two round ends meeting at a
    // corner leave a cusp there, and a cusp is a plan that folds in on itself.
    const beside = [(i + 3) % 4, (i + 1) % 4].some((n) => sides.includes(FACES[n]!.side));
    const rise = Math.min(half * (beside ? 0.4 : 1), across / 2);
    const radius = (half * half + rise * rise) / (2 * rise);
    const middle: Corner = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const along: Corner = [(b[0] - a[0]) / (half * 2), (b[1] - a[1]) / (half * 2)];

    // Ends on the corners it replaced, so the faces beside it still meet it.
    for (let step = 0; step < steps; step++) {
      const u = (-1 + (2 * step) / steps) * half;
      const stand = Math.sqrt(Math.max(0, radius * radius - u * u)) - (radius - rise);
      points.push([Math.round(middle[0] + along[0] * u + ox * stand), Math.round(middle[1] + along[1] * u + oz * stand)]);
    }
  }
  return points;
}

/** Replace each corner with a small arc, which is what a bevelled upright edge looks like. */
function fillet(square: Corner[], radius: Mm, steps = 3): Corner[] {
  const out: Corner[] = [];
  const count = square.length;

  for (let i = 0; i < count; i++) {
    const previous = square[(i + count - 1) % count]!;
    const corner = square[i]!;
    const next = square[(i + 1) % count]!;

    const towards = (from: Corner, to: Corner): Corner => {
      const dx = to[0] - from[0];
      const dz = to[1] - from[1];
      const length = Math.hypot(dx, dz) || 1;
      const cut = Math.min(radius, length / 2);
      return [from[0] + (dx / length) * cut, from[1] + (dz / length) * cut];
    };

    const start = towards(corner, previous);
    const end = towards(corner, next);
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      // A quadratic bend through the corner: exact enough at this size, and always convex.
      const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * corner[0] + t * t * end[0];
      const z = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * corner[1] + t * t * end[1];
      out.push([Math.round(x), Math.round(z)]);
    }
  }
  return out;
}

/**
 * Every footprint is convex, and this is where that is proved. The deck grid, the support proof,
 * the caps and the way out of a wall all read a plan by its edges alone, and a plan that folds in
 * on itself makes each of them quietly wrong instead of loudly broken.
 */
function turnsOneWay(points: Corner[]): boolean {
  let left = 0;
  let right = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const c = points[(i + 2) % points.length]!;
    const turn = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (turn > STRAIGHT) left += 1;
    if (turn < -STRAIGHT) right += 1;
  }
  return left === 0 || right === 0;
}

function bayBox(side: Side, rect: Rect, start: Mm, width: Mm, y0: Mm, y1: Mm): Box {
  const t = PANEL_THICKNESS;
  switch (side) {
    case 'N':
      return { min: [start, y0, rect.z0], max: [start + width, y1, rect.z0 + t] };
    case 'S':
      return { min: [start, y0, rect.z1 - t], max: [start + width, y1, rect.z1] };
    case 'E':
      return { min: [rect.x1 - t, y0, start], max: [rect.x1, y1, start + width] };
    case 'W':
      return { min: [rect.x0, y0, start], max: [rect.x0 + t, y1, start + width] };
  }
}

function sideRun(side: Side, rect: Rect): { start: Mm; length: Mm } {
  return side === 'N' || side === 'S'
    ? { start: rect.x0, length: rect.x1 - rect.x0 }
    : { start: rect.z0, length: rect.z1 - rect.z0 };
}

function placeFloor(band: Band, index: number, rect: Rect, y0: Mm, y1: Mm, targetBay: Mm): PlacedFloor {
  const id = `${band.id}.f${index}`;
  const bays: PlacedBay[] = [];

  for (const side of ['N', 'E', 'S', 'W'] as const) {
    const run = sideRun(side, rect);
    const widths = partition(run.length, bayCount(run.length, targetBay));
    let cursor = run.start;
    widths.forEach((width, i) => {
      bays.push({ id: `${id}.${side}${i}`, side, index: i, width, box: bayBox(side, rect, cursor, width, y0, y1) });
      cursor += width;
    });
  }

  return { id, bandId: band.id, index, y0, y1, bays };
}

/** Lay the document out. Pure: same document in, same scene out, every value an integer. */
export function assemble(doc: BuildingDocument): PlacedScene {
  const bands: PlacedBand[] = [];
  let y = 0;

  for (const band of doc.bands) {
    const rect = footprintRect(doc, band);
    if (rect.x1 - rect.x0 <= 0 || rect.z1 - rect.z0 <= 0) {
      throw new BuildingError('E_DOC_INVALID', `band ${band.id} steps in past its own footprint`, ['bands', band.id, 'inset']);
    }

    const plan = { round: band.shape === 'round' ? band.segments : undefined, arc: band.arc, corner: band.corner, bow: band.bow };
    const bottom = cornersOf(rect, band.rotation, 0, plan);
    const top = cornersOf(rect, band.rotation + band.twist, band.taper, plan);
    for (const [where, points] of [['bottom', bottom], ['top', top]] as const) {
      if (turnsOneWay(points)) continue;
      throw new BuildingError('E_DOC_INVALID', `band ${band.id} has a ${where} footprint that folds in on itself`, ['bands', band.id, 'shape']);
    }

    const floorHeight = bandFloorHeight(doc, band);
    const floors: PlacedFloor[] = [];
    const y0 = y;

    for (let i = 0; i < band.floors; i++) {
      const fy0 = y0 + i * floorHeight;
      floors.push(placeFloor(band, i, rect, fy0, fy0 + floorHeight, doc.grid.bay));
    }

    y = y0 + band.floors * floorHeight;
    bands.push({
      id: band.id,
      kind: band.kind,
      tier: band.tier,
      template: band.template,
      rotation: band.rotation,
      wires: band.wires,
      shape: band.shape,
      greebles: band.greebles,
      windows: band.windows,
      columns: band.columns,
      clutter: band.clutter,
      deck: band.deck,
      faces: band.faces,
      runs: band.runs,
      inset: band.inset,
      rect: { x0: rect.x0, x1: rect.x1, z0: rect.z0, z1: rect.z1 },
      bottom,
      top,
      chamfer: band.chamfer,
      y0,
      y1: y,
      floors,
    });
  }

  return {
    name: doc.name,
    size: { width: doc.footprint.width, depth: doc.footprint.depth, height: y },
    bands,
  };
}

/** Every floor in the scene, bottom to top. */
export function floors(scene: PlacedScene): PlacedFloor[] {
  return scene.bands.flatMap((band) => band.floors);
}

/** Find one bay by its id, or nothing. */
export function findBay(scene: PlacedScene, id: string): PlacedBay | undefined {
  for (const band of scene.bands) {
    for (const floor of band.floors) {
      const bay = floor.bays.find((b) => b.id === id);
      if (bay) return bay;
    }
  }
  return undefined;
}
