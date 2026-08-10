/** A section's faces, composed. Grids in, one mesh per material out. */
import { Surfaces, WIRE_RUNS, uprightsOn, type ColumnStyle, type MeshData, type SectionShape } from '#kit';
import { CELL, Face, Sheet, type Rect, type Side } from './grid.ts';
import { build as buildElement, checkKind, claims, type Element } from './elements.ts';

/** What the section already wears on this face, which the grid has to keep clear. */
export type Wears = { columns?: ColumnStyle; wires?: 'none' | Side };

export type FacePlan = { side: Side; elements: Element[]; wears?: Wears };

/**
 * The cells a section's own dressing stands on. Uprights and cables are built by the kit, not
 * composed on the grid, so unless the grid holds their cells an element lands straight through
 * one. Reserving them is what keeps the two systems from meeting in the same place.
 */
function dressingOn(face: Face, wears: Wears | undefined): [Rect, string][] {
  if (!wears) return [];
  const held: [Rect, string][] = [];

  const band = (along: number, width: number, what: string) => {
    const middle = along * face.cols;
    const half = Math.max(1, Math.round(width / CELL / 2)) + 1;
    const col = Math.max(0, Math.round(middle) - half);
    const last = Math.min(face.cols - 1, Math.round(middle) + half);
    held.push([{ col, row: 0, cols: last - col + 1, rows: face.rows }, what]);
  };

  for (const upright of uprightsOn(face.width, wears.columns ?? 'none')) {
    band(upright.along, upright.width, 'a column');
  }
  if (wears.wires && wears.wires === face.side) {
    for (const run of WIRE_RUNS) band(run.along, run.width, 'a cable run');
  }
  return held;
}

/** A sheet with the section's own dressing already on it, ready for elements. */
function sheetFor(face: Face, wears: Wears | undefined): Sheet {
  const sheet = new Sheet(face);
  for (const [rect, what] of dressingOn(face, wears)) sheet.hold(rect, what);
  return sheet;
}

/**
 * Every element on every face of a section, proved as it goes: each one claims its cells, so a
 * second element in them is refused before any geometry exists, and every kind is checked
 * against the little it has to obey.
 */
export function dressFaces(shape: SectionShape, plans: FacePlan[]): MeshData[] {
  const kit = new Surfaces();

  for (const plan of plans) {
    const face = new Face(shape, plan.side);
    const sheet = sheetFor(face, plan.wears);

    plan.elements.forEach((element, index) => {
      sheet.claim(claims(element), `${element.kind} ${index + 1} on ${plan.side}`);
      checkKind(element, plan.elements);
      buildElement(kit, face, element);
    });
  }

  return kit.data();
}

/** The face as it stands, for printing back to whoever is composing it. */
export function readFace(shape: SectionShape, plan: FacePlan): { face: Face; sheet: Sheet } {
  const face = new Face(shape, plan.side);
  const sheet = sheetFor(face, plan.wears);
  plan.elements.forEach((element, index) => {
    sheet.claim(claims(element), `${element.kind} ${index + 1} on ${plan.side}`);
  });
  return { face, sheet };
}
