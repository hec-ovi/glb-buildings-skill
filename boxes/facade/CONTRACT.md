# facade

A face as a grid of cells. Composing a wall is naming rectangles of cells, never working out a
size or a position, and two elements cannot claim the same cell, so overlapping is not a mistake
that can be made.

## The grid

Every face of a section is a rectangle: one floor tall, the section's own width. It divides into
**10 cm cells**, read from the bottom left seen from outside, so `[0,0]` is the floor at the left
end and `[cols-1,rows-1]` is the far top corner. A 3.2 m floor on a 12 m face is 120 by 32.

A border of `MARGIN` cells is kept clear all round, so nothing lands on a corner or a floor line.

The design belongs to the face, not to a floor: a section of eighteen floors builds it eighteen
times and still costs one mesh.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `new Face(shape, side)` | a section shape, a side | the grid: `cols`, `rows`, `floors`, `width`, `height` |
| `face.point(floor, col, row, out)` | a cell, and how far out of the wall | where that is in the building |
| `face.corners(floor, rect, out)` | a rectangle of cells | its four corners, counter-clockwise from outside |
| `new Sheet(face)` | a face | what is on it |
| `sheet.claim(rects, what)` | the cells an element stands on | takes them, or refuses and says what is in the way |
| `sheet.draw()` | | the face as rows of text, top row first |
| `dressFaces(shape, plans)` | a section and what is composed on it | one `MeshData` per material |
| `readFace(shape, plan)` | a section and one face | the grid and what is on it, without building anything |
| `claims(element)` | an element | the rectangles it actually stands on |

## What can stand on a face

| Kind | What it is | Costs |
| --- | --- | --- |
| `window` | a pane set in the face, a cell of wall showing all round it | 12 triangles a floor |
| `door` | a pane that reaches a floor, so it reads as a way out | 12 a floor |
| `panel` | a flat plate: cladding, a sign, a shutter, a screen | 12 a floor |
| `balcony` | a slab standing out of the face with a rail round it | 48 a floor |

Materials are `crystal` (glazing), `concrete` (flat dead panel), `screen` (lit, for signs and
video walls) and `metal` (shutters, louvres, plant).

## Balconies and the door onto them

A balcony fills the cells it claims: the slab sits on the bottom of them and the balustrade rises to the top
of them, so what is claimed is what is built. It claims its **slab and its two side rails** only, and leaves
the middle open. That open middle
is exactly the space a door onto it needs, so the two compose:

```
. o x x x o .
. o x x x o .
. o o o o o .   <- the slab, which is the floor the door stands on
```

A door has to reach a floor it opens onto: the building's own, or the slab of a balcony under it
on the same face. A window over the rail is still refused, because the rail holds those cells.

## What the section already wears

A section's uprights (`--columns`) and cable runs (`--wires`) are built by `#kit`, not composed
on the grid. `FacePlan.wears` hands them over and the sheet **holds** their cells before any
element claims one, so a window cannot be placed through a rib. Where they stand comes from
`uprightsOn` and `WIRE_RUNS` in `#kit`, the same source the builder uses, so the two cannot drift.

Held cells are clipped to the face rather than refused: the dressing is already built, and the
grid's job is to keep composition off it.

## Errors

`E_OVERLAP` (a cell is taken, or the rectangle runs into the border), `E_DOC_INVALID` (a door
floating in the middle of a wall, a balcony deeper than the kit allows, a rectangle of no cells).

## Invariants

- Two elements never share a cell, nothing is ever placed by coordinate, and nothing is composed
  over what the section already wears.
- A cell is asked for by column and row and comes back on the real face, so a section that
  twists, tapers or curves needs no special case anywhere.
- Everything bites into the wall behind it and stands proud in front, so nothing shares a plane
  with the wall and every element is seen from outside the section.
- Every element closes into its own solid, on every floor of the section.

## Depends on

`#spec`, `#kit`.
