/**
 * A face of a section, as a grid of cells.
 *
 * Every face is a rectangle: one floor tall, one section wide. Divide it into 10 cm cells and a
 * window, a door, a balcony or a screen becomes a rectangle of cells rather than a position
 * somebody has to work out. Two elements cannot claim the same cell, so overlapping is not a
 * mistake that can be made, and a border of cells is kept clear so nothing runs off an edge.
 *
 * Cells are read from the bottom left of the face: column 0 is the left end seen from outside,
 * row 0 sits on the floor.
 */
import { BuildingError } from '#spec';
import { edgeFacing, facePoint, type SectionShape, type Vec } from '#kit';

/** One cell, in metres. Ten centimetres is a hand's width: fine enough to place a sill on. */
export const CELL = 0.1;

/** Cells of clear face kept around the edges, so nothing lands on a corner or a floor line. */
export const MARGIN = 1;

export type Side = 'N' | 'E' | 'S' | 'W';

/** A rectangle of cells, from the bottom left corner to the top right, both ends inside it. */
export type Rect = { col: number; row: number; cols: number; rows: number };

export function rectOf(from: [number, number], to: [number, number]): Rect {
  const col = Math.min(from[0], to[0]);
  const row = Math.min(from[1], to[1]);
  return { col, row, cols: Math.abs(to[0] - from[0]) + 1, rows: Math.abs(to[1] - from[1]) + 1 };
}

export function describeRect(rect: Rect): string {
  return `[${rect.col},${rect.row}] to [${rect.col + rect.cols - 1},${rect.row + rect.rows - 1}]`;
}

/**
 * The face itself: how many cells it has, and where any of them is in the building.
 *
 * A point is asked for by cell and by how far it stands out of the wall, and comes back already
 * on the real face, so a section that twists, tapers or curves needs no special case anywhere.
 */
export class Face {
  readonly side: Side;
  readonly cols: number;
  readonly rows: number;
  /** Floors this face repeats over: the same design is built on each. */
  readonly floors: number;
  readonly #shape: SectionShape;
  readonly #edge: number;

  constructor(shape: SectionShape, side: Side) {
    this.side = side;
    this.#shape = shape;
    this.#edge = edgeFacing(shape.bottom, side);
    this.floors = Math.max(1, shape.floors);

    const ring = shape.bottom;
    const a = ring[this.#edge]!;
    const b = ring[(this.#edge + 1) % ring.length]!;
    this.cols = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / CELL));
    this.rows = Math.max(1, Math.round(shape.height / this.floors / CELL));
  }

  /** Metres across and up, for a caller sizing something in real units. */
  get width(): number {
    return this.cols * CELL;
  }

  get height(): number {
    return this.rows * CELL;
  }

  /**
   * Where a cell corner sits, on the given floor of the section, `out` metres proud of the wall.
   * Columns and rows may run one past the end, which is how the far corner of a cell is asked
   * for.
   */
  point(floor: number, col: number, row: number, out: number): Vec {
    const along = col / this.cols;
    const t = (floor * this.rows + row) / (this.floors * this.rows);
    return facePoint(this.#shape, t, this.#edge, along, out);
  }

  /** The four corners of a rectangle of cells, counter-clockwise seen from outside the wall. */
  corners(floor: number, rect: Rect, out: number): [Vec, Vec, Vec, Vec] {
    const c1 = rect.col + rect.cols;
    const r1 = rect.row + rect.rows;
    return [
      this.point(floor, rect.col, rect.row, out),
      this.point(floor, c1, rect.row, out),
      this.point(floor, c1, r1, out),
      this.point(floor, rect.col, r1, out),
    ];
  }

  /** Which way is out of this face at a cell, as a unit vector: what a part stands along. */
  outward(floor: number, col: number, row: number): Vec {
    const on = this.point(floor, col, row, 0);
    const off = this.point(floor, col, row, 1);
    return [off[0] - on[0], off[1] - on[1], off[2] - on[2]];
  }
}

/** What is on a face already, so nothing can be placed on top of it. */
export class Sheet {
  readonly face: Face;
  readonly #taken: (string | undefined)[];

  constructor(face: Face) {
    this.face = face;
    this.#taken = new Array<string | undefined>(face.cols * face.rows).fill(undefined);
  }

  at(col: number, row: number): string | undefined {
    return this.#taken[row * this.face.cols + col];
  }

  /**
   * Take cells for one element, given as the rectangles it actually stands on. A window takes
   * the one it covers; a balcony takes its slab and its two side rails and leaves the middle
   * open, which is the space a door onto it needs.
   *
   * Refuses cells that run off the face, land inside the border margin, or belong to something
   * else, naming what is in the way. The element's own rectangles may overlap each other.
   */
  claim(rects: Rect[], what: string): void {
    const { cols, rows } = this.face;
    const wanted = new Set<number>();

    for (const rect of rects) {
      const last = { col: rect.col + rect.cols - 1, row: rect.row + rect.rows - 1 };

      if (rect.cols < 1 || rect.rows < 1) {
        throw new BuildingError('E_DOC_INVALID', `${what} covers no cells; give it a rectangle`, ['face', what]);
      }
      if (rect.col < MARGIN || rect.row < MARGIN || last.col > cols - 1 - MARGIN || last.row > rows - 1 - MARGIN) {
        throw new BuildingError(
          'E_OVERLAP',
          `${what} at ${describeRect(rect)} runs into the border of the face, which is ${cols} by ${rows} cells with ${MARGIN} kept clear all round. Keep it between [${MARGIN},${MARGIN}] and [${cols - 1 - MARGIN},${rows - 1 - MARGIN}]`,
          ['face', what],
        );
      }

      for (let row = rect.row; row <= last.row; row++) {
        for (let col = rect.col; col <= last.col; col++) {
          const held = this.at(col, row);
          if (held !== undefined) {
            throw new BuildingError(
              'E_OVERLAP',
              `${what} at ${describeRect(rect)} wants cell [${col},${row}], which ${held} already has`,
              ['face', what],
            );
          }
          wanted.add(row * cols + col);
        }
      }
    }

    for (const cell of wanted) this.#taken[cell] = what;
  }

  /**
   * Take cells for something the section wears rather than something composed on it: an upright,
   * a cable run. It is already built, so it is clipped to the face rather than refused.
   */
  hold(rect: Rect, what: string): void {
    const last = { col: Math.min(this.face.cols - 1, rect.col + rect.cols - 1), row: Math.min(this.face.rows - 1, rect.row + rect.rows - 1) };
    for (let row = Math.max(0, rect.row); row <= last.row; row++) {
      for (let col = Math.max(0, rect.col); col <= last.col; col++) this.#taken[row * this.face.cols + col] = what;
    }
  }

  /** The face as rows of text, top row first, for a human or an agent to read. */
  draw(): string[] {
    const marks = new Map<string, string>();
    const alphabet = 'xovtpqrsuwyz';
    const lines: string[] = [];

    for (let row = this.face.rows - 1; row >= 0; row--) {
      let line = '';
      for (let col = 0; col < this.face.cols; col++) {
        const held = this.at(col, row);
        if (held === undefined) {
          line += '.';
          continue;
        }
        const kind = held.split(' ')[0]!;
        if (!marks.has(kind)) marks.set(kind, alphabet[marks.size] ?? '#');
        line += marks.get(kind);
      }
      lines.push(line);
    }
    return lines;
  }
}
