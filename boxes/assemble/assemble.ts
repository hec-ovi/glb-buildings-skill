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
import type { Box, Corner, PlacedBand, PlacedBay, PlacedFloor, PlacedScene, Seam } from './scene.ts';

/** Facade panel depth used for blueprint volumes until the kit places real walls. */
export const PANEL_THICKNESS: Mm = 200;

type Rect = { x0: Mm; x1: Mm; z0: Mm; z1: Mm };

function footprintRect(doc: BuildingDocument, band: Band): Rect {
  const width = band.width ?? doc.footprint.width;
  const depth = band.depth ?? doc.footprint.depth;
  const x0 = -Math.floor(width / 2) + band.inset + band.shiftX;
  const z0 = -Math.floor(depth / 2) + band.inset + band.shiftZ;
  return { x0, x1: x0 + width - 2 * band.inset, z0, z1: z0 + depth - 2 * band.inset };
}

/**
 * The footprint as four world corners, turned about the building's own axis. Bands that step,
 * slide or turn all end up as plain polygons, and the junction between two of them is one loft.
 */
function cornersOf(rect: Rect, degrees: number, shrink = 0, round?: number, corner = 0): Corner[] {
  const square: Corner[] = [
    [rect.x0 + shrink, rect.z1 - shrink],
    [rect.x1 - shrink, rect.z1 - shrink],
    [rect.x1 - shrink, rect.z0 + shrink],
    [rect.x0 + shrink, rect.z0 + shrink],
  ];
  const points: Corner[] = round ? ellipse(rect, shrink, round) : corner > 0 ? fillet(square, corner) : square;
  if (degrees === 0) return points;
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(([x, z]) => [Math.round(x * cos + z * sin), Math.round(-x * sin + z * cos)]);
}

/** A round footprint: the ellipse inside the rectangle, walked the same way as the corners. */
function ellipse(rect: Rect, shrink: number, segments: number): Corner[] {
  const cx = (rect.x0 + rect.x1) / 2;
  const cz = (rect.z0 + rect.z1) / 2;
  const rx = (rect.x1 - rect.x0) / 2 - shrink;
  const rz = (rect.z1 - rect.z0) / 2 - shrink;
  const points: Corner[] = [];
  for (let i = 0; i < segments; i++) {
    // Starts on the south face and turns south, east, north, west, the way a box does.
    const angle = (i / segments) * Math.PI * 2;
    points.push([Math.round(cx + rx * Math.sin(angle)), Math.round(cz + rz * Math.cos(angle))]);
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

function seamOf(rect: Rect, targetBay: Mm): Seam {
  const width = rect.x1 - rect.x0;
  const depth = rect.z1 - rect.z0;
  const along = bayCount(width, targetBay);
  const across = bayCount(depth, targetBay);
  return { width, depth, bays: { N: along, S: along, E: across, W: across } };
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

    const round = band.shape === 'round' ? band.segments : undefined;
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
      balconies: band.balconies,
      columns: band.columns,
      clutter: band.clutter,
      deck: band.deck,
      inset: band.inset,
      rect: { x0: rect.x0, x1: rect.x1, z0: rect.z0, z1: rect.z1 },
      bottom: cornersOf(rect, band.rotation, 0, round, band.corner),
      top: cornersOf(rect, band.rotation + band.twist, band.taper, round, band.corner),
      chamfer: band.chamfer,
      y0,
      y1: y,
      floors,
      seam: seamOf(rect, doc.grid.bay),
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
