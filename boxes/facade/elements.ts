/**
 * What can stand on a face. Each one is given a rectangle of cells and builds itself: the
 * composer says "a window here", never a size, a transform or a corner.
 *
 * Everything bites a little into the wall behind it and reaches further out in front, so no
 * surface shares a plane with the wall and every part is seen from outside the section.
 */
import { BuildingError } from '#spec';
import { Surface, type Vec } from '#kit';
import { MARGIN, describeRect, type Face, type Rect } from './grid.ts';

/** What an element is made of. The wall itself is not in here: it is the section's own skin. */
export const MATERIALS = ['crystal', 'concrete', 'screen', 'metal'] as const;
export type Material = (typeof MATERIALS)[number];

export const MATERIAL_NOTES: Record<Material, string> = {
  crystal: 'glazing: bright, a little reflective, what a window is made of',
  concrete: 'flat dead panel, the colour of the wall but standing off it',
  screen: 'a lit screen, for signs and the video walls of a busy street',
  metal: 'a dull grey plate, for shutters, louvres and plant',
};

export const KINDS = ['window', 'door', 'panel', 'balcony'] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_NOTES: Record<Kind, string> = {
  window: 'a pane set in the face, one cell of wall showing all round it',
  door: 'a pane that reaches the floor, so it reads as a way in or out onto a balcony',
  panel: 'a flat plate on the wall: cladding, a sign, a shutter, a screen',
  balcony: 'a slab standing out of the face with a rail round it, one per floor',
};

export const DEFAULT_MATERIAL: Record<Kind, Material> = {
  window: 'crystal',
  door: 'crystal',
  panel: 'concrete',
  balcony: 'concrete',
};

export type Element = {
  kind: Kind;
  rect: Rect;
  material: Material;
  /** How far a balcony stands out, in metres. Ignored by the flat kinds. */
  depth?: number;
};

/** How far into the wall a part reaches, so its back never shares the wall's plane. */
const BITE = 0.03;

/** Cells of slab a balcony stands on, and how wide its side rails are. */
const SLAB_CELLS = 2;
const RAIL_CELLS = 1;

/**
 * The cells an element actually stands on. A flat kind takes the rectangle it covers. A balcony
 * takes its slab and its two side rails and leaves the middle open, which is exactly the space
 * a door onto it needs, so the two compose instead of fighting.
 */
export function claims(element: Element): Rect[] {
  const rect = element.rect;
  if (element.kind !== 'balcony') return [rect];

  return [
    { col: rect.col, row: rect.row, cols: rect.cols, rows: Math.min(SLAB_CELLS, rect.rows) },
    { col: rect.col, row: rect.row, cols: RAIL_CELLS, rows: rect.rows },
    { col: rect.col + rect.cols - RAIL_CELLS, row: rect.row, cols: RAIL_CELLS, rows: rect.rows },
  ];
}

/** A box between two rectangles of the face: `near` behind, `far` in front. */
function plate(surface: Surface, face: Face, floor: number, rect: Rect, near: number, far: number): void {
  const a = face.corners(floor, rect, near);
  const b = face.corners(floor, rect, far);

  surface.quad(b[0], b[1], b[2], b[3]);
  surface.quad(a[3], a[2], a[1], a[0]);
  surface.quad(a[0], a[1], b[1], b[0]);
  surface.quad(a[1], a[2], b[2], b[1]);
  surface.quad(a[2], a[3], b[3], b[2]);
  surface.quad(a[3], a[0], b[0], b[3]);
}

/** Shrink a rectangle by one cell all round, which is the wall a pane shows against. */
function reveal(rect: Rect): Rect {
  return { col: rect.col + 1, row: rect.row + 1, cols: Math.max(1, rect.cols - 2), rows: Math.max(1, rect.rows - 2) };
}

/**
 * Build one element on every floor of the section. The design belongs to the face, so a section
 * of eighteen floors carries it eighteen times and still costs one mesh.
 */
export function build(surface: Surface, face: Face, element: Element): void {
  for (let floor = 0; floor < face.floors; floor++) {
    switch (element.kind) {
      case 'window':
      case 'door':
        plate(surface, face, floor, reveal(element.rect), -BITE, 0.06);
        break;
      case 'panel':
        plate(surface, face, floor, element.rect, -BITE, 0.08);
        break;
      case 'balcony':
        balcony(surface, face, floor, element);
        break;
    }
  }
}

/**
 * A slab standing out of the face, with a solid balustrade round its three open sides and the
 * top left open. The claimed cells are what it fills: the slab sits on the bottom of them and
 * the balustrade rises to the top of them, so what is claimed is what is built.
 *
 * The front is a panel, not a bar on posts. A rail with an open gap under it reads as a hollow
 * box from any distance, which is not what a balcony looks like.
 */
function balcony(surface: Surface, face: Face, floor: number, element: Element): void {
  const depth = element.depth ?? 1.5;
  const rect = element.rect;
  const slab = 0.15;
  const rail = 0.08;

  const out = face.outward(floor, rect.col, rect.row);
  const step = (point: Vec, by: number): Vec => [point[0] + out[0] * by, point[1] + out[1] * by, point[2] + out[2] * by];

  /** A box standing on the face: `from`..`to` across, `base`..`top` up, `back`..`front` out. */
  const solid = (from: number, to: number, base: number, top: number, back: number, front: number) => {
    const a: Vec[] = [
      face.point(floor, from, base, back),
      face.point(floor, to, base, back),
      face.point(floor, to, top, back),
      face.point(floor, from, top, back),
    ];
    const b = a.map((corner) => step(corner, front - back));
    surface.quad(b[0]!, b[1]!, b[2]!, b[3]!);
    surface.quad(a[3]!, a[2]!, a[1]!, a[0]!);
    surface.quad(a[0]!, a[1]!, b[1]!, b[0]!);
    surface.quad(a[1]!, a[2]!, b[2]!, b[1]!);
    surface.quad(a[2]!, a[3]!, b[3]!, b[2]!);
    surface.quad(a[3]!, a[0]!, b[0]!, b[3]!);
  };

  const left = rect.col;
  const right = rect.col + rect.cols;
  const base = rect.row;
  const cell = face.height / face.rows;
  const up = (metres: number) => base + metres / cell;
  const top = rect.row + rect.rows;

  solid(left, right, base, up(slab), -BITE, depth);
  solid(left, right, up(slab), top, depth - rail, depth);
  solid(left, left + RAIL_CELLS, up(slab), top, -BITE, depth);
  solid(right - RAIL_CELLS, right, up(slab), top, -BITE, depth);
}

/** The row a balcony's slab reaches, which is the floor anything on it stands on. */
export function slabTop(element: Element): number {
  return element.rect.row + Math.min(SLAB_CELLS, element.rect.rows);
}

/**
 * A door has to reach a floor it opens onto: the building's own, or the slab of a balcony on
 * the same face. A door hanging in the middle of a wall is a window with ideas.
 */
export function checkKind(element: Element, others: Element[]): void {
  if (element.kind === 'door' && element.rect.row > MARGIN) {
    const onto = others.some(
      (other) =>
        other.kind === 'balcony' &&
        slabTop(other) === element.rect.row &&
        other.rect.col <= element.rect.col &&
        other.rect.col + other.rect.cols >= element.rect.col + element.rect.cols,
    );
    if (!onto) {
      throw new BuildingError(
        'E_DOC_INVALID',
        `a door at ${describeRect(element.rect)} floats ${element.rect.row - MARGIN} cells above the floor. Start it at row ${MARGIN}, put a balcony under it, or make it a window`,
        ['face', 'door'],
      );
    }
  }
  if (element.kind === 'balcony' && (element.depth ?? 1.5) > 3) {
    throw new BuildingError(
      'E_DOC_INVALID',
      `a balcony ${element.depth} m deep reaches further off the building than anything the kit allows`,
      ['face', 'balcony', 'depth'],
    );
  }
}
