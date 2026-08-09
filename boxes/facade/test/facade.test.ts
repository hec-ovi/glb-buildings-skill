import { describe, expect, it } from 'vitest';
import { BuildingError } from '#spec';
import { shellProblems, solids, windingProblems, type SectionShape } from '#kit';
import { CELL, Face, MARGIN, Sheet, dressFaces, readFace, rectOf, type Element } from '#facade';

/** A plain section, three floors of 3.2 m over a 9 by 6 m plan. */
const plain: SectionShape = {
  bottom: [
    [-4.5, 3],
    [4.5, 3],
    [4.5, -3],
    [-4.5, -3],
  ],
  top: [
    [-4.5, 3],
    [4.5, 3],
    [4.5, -3],
    [-4.5, -3],
  ],
  floors: 3,
  height: 9.6,
};

/** The same section, turning and pulling in as it rises. */
const twisted: SectionShape = {
  ...plain,
  top: [
    [-3, 2.4],
    [3.6, 1.8],
    [3, -2.4],
    [-3.6, -1.8],
  ],
};

const window = (col: number, row: number, cols: number, rows: number): Element => ({
  kind: 'window',
  rect: { col, row, cols, rows },
  material: 'crystal',
});

describe('the grid on a face', () => {
  it('divides a face into ten centimetre cells, one floor tall', () => {
    const face = new Face(plain, 'S');
    expect(face.cols).toBe(90);
    expect(face.rows).toBe(32);
    expect(face.width).toBeCloseTo(9, 6);
    expect(face.height).toBeCloseTo(3.2, 6);
    expect(CELL).toBe(0.1);
  });

  it('places a cell on the real face, so a twist needs no special case', () => {
    const straight = new Face(plain, 'S').point(0, 45, 16, 0);
    const turned = new Face(twisted, 'S').point(2, 45, 16, 0);
    // Same cell, same height on its own floor, but the twisted section has moved it.
    expect(straight[2]).toBeCloseTo(3, 6);
    expect(turned[2]).not.toBeCloseTo(3, 2);
  });
});

describe('claiming cells', () => {
  it('refuses a second element on a cell the first one has, naming both', () => {
    const sheet = new Sheet(new Face(plain, 'S'));
    sheet.claim([{ col: 10, row: 10, cols: 10, rows: 10 }], 'window 1 on S');
    const clash = () => sheet.claim([{ col: 15, row: 15, cols: 10, rows: 10 }], 'window 2 on S');
    expect(clash).toThrow(BuildingError);
    expect(clash).toThrow(/window 2 on S.*window 1 on S/);
  });

  it('keeps a border clear, so nothing lands on a corner or a floor line', () => {
    const sheet = new Sheet(new Face(plain, 'S'));
    expect(() => sheet.claim([{ col: 0, row: 5, cols: 4, rows: 4 }], 'window')).toThrow(/border/);
    expect(() => sheet.claim([{ col: 88, row: 5, cols: 4, rows: 4 }], 'window')).toThrow(/border/);
    expect(() => sheet.claim([{ col: MARGIN, row: MARGIN, cols: 4, rows: 4 }], 'window')).not.toThrow();
  });

  it('draws itself, so whoever composes it can read what is there', () => {
    const sheet = new Sheet(new Face(plain, 'S'));
    sheet.claim([rectOf([10, 10], [13, 13])], 'window 1 on S');
    const lines = sheet.draw();
    expect(lines).toHaveLength(32);
    // Top row first, so the line for row 10 is 32 - 1 - 10 from the start.
    expect(lines[32 - 1 - 10]!.slice(10, 14)).toBe('xxxx');
    expect(lines[0]!).toMatch(/^\.+$/);
  });
});

describe('what the elements build', () => {
  it('closes every kind into a solid on every floor, on a straight face and a twisted one', () => {
    const kinds: Element[] = [
      window(10, 12, 8, 12),
      { kind: 'door', rect: { col: 30, row: MARGIN, cols: 10, rows: 21 }, material: 'crystal' },
      { kind: 'panel', rect: { col: 50, row: 8, cols: 12, rows: 6 }, material: 'screen' },
      { kind: 'balcony', rect: { col: 66, row: 2, cols: 16, rows: 12 }, material: 'concrete', depth: 1.4 },
    ];

    for (const shape of [plain, twisted]) {
      for (const element of kinds) {
        const meshes = dressFaces(shape, [{ side: 'S', elements: [element] }]);
        for (const mesh of meshes) {
          expect(windingProblems(mesh), element.kind).toEqual([]);
          // Every piece closes with positive volume, whatever the face is doing under it.
          expect(shellProblems([mesh]), element.kind).toEqual([]);
        }
        // The design belongs to the face, so every floor of the section gets the same of it.
        const pieces = solids(meshes).length;
        expect(pieces, element.kind).toBeGreaterThanOrEqual(shape.floors);
        expect(pieces % shape.floors, element.kind).toBe(0);
      }
    }
  });

  it('costs a flat element twelve triangles a floor, so a face full of them still fits a tier', () => {
    const meshes = dressFaces(plain, [{ side: 'S', elements: [window(10, 12, 8, 12)] }]);
    expect(meshes.reduce((n, mesh) => n + mesh.indices.length / 3, 0)).toBe(3 * 12);
  });

  it('refuses a door that floats above the floor it opens onto', () => {
    const floating: Element = { kind: 'door', rect: { col: 10, row: 12, cols: 8, rows: 10 }, material: 'crystal' };
    expect(() => dressFaces(plain, [{ side: 'S', elements: [floating] }])).toThrow(/floats/);
  });

  it('lets a balcony and the door onto it share a face, because the slab is what the door stands on', () => {
    const balcony: Element = { kind: 'balcony', rect: { col: 20, row: 2, cols: 26, rows: 13 }, material: 'concrete', depth: 1.4 };
    // The balcony keeps its slab and its two rails; the middle is left open for the way out.
    const door: Element = { kind: 'door', rect: { col: 28, row: 4, cols: 10, rows: 18 }, material: 'crystal' };

    const meshes = dressFaces(plain, [{ side: 'S', elements: [balcony, door] }]);
    for (const mesh of meshes) expect(shellProblems([mesh]), mesh.material).toEqual([]);

    // A window over the rail is still refused: only the open middle is free.
    const onTheRail: Element = { kind: 'window', rect: { col: 20, row: 6, cols: 4, rows: 6 }, material: 'crystal' };
    expect(() => dressFaces(plain, [{ side: 'S', elements: [balcony, onTheRail] }])).toThrow(/already has/);
  });

  it('reads a face back with everything that is on it', () => {
    const { face, sheet } = readFace(plain, { side: 'S', elements: [window(10, 10, 4, 4)] });
    expect(face.cols).toBe(90);
    expect(sheet.at(11, 11)).toContain('window');
    expect(sheet.at(50, 11)).toBeUndefined();
  });
});
