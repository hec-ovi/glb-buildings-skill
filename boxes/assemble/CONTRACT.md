# assemble

Lays a document out in space: sections stack from the ground, each one gets the two footprints its skin is
lofted between, and each floor's facade splits into bays. Pure arithmetic, no geometry and no files.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `assemble(document)` | `BuildingDocument` from `#spec` | `PlacedScene` |
| `floors(scene)` | placed scene | every floor, bottom to top |
| `findBay(scene, id)` | placed scene, bay id | that bay, or nothing |
| `boxCentre(box)` | a box | its middle |

Types live in [`scene.ts`](scene.ts).

## The placed scene

```
PlacedScene { name, size {width, depth, height}, bands[] }
  PlacedBand { id, kind, tier, template, rotation, inset, rect, bottom[], top[], chamfer,
               wires, windows, greebles, columns, clutter, deck[], faces[], runs[], y0, y1, floors[] }
    PlacedFloor { id: "body.f3", bandId, index, y0, y1, bays[] }
      PlacedBay { id: "body.f3.S2", side, index, width, box }
```

Coordinates are millimetres, the building is centred on X and Z, and y starts at 0 on the ground. `bottom`
and `top` are world corners, so a section's shift, inset, rotation, twist and taper are already in them; bay
boxes are in the section's own frame, before its rotation.

Bays run along increasing X on the N and S sides, along increasing Z on the E and W sides. Bay widths are the
exact integer partition of the side, so they sum to the side length with no gap and no overlap. Adjacent sides
share their corner volume, which the kit resolves with a corner part.

## Footprints

A section's `bottom` and `top` are the polygons its skin is lofted between: a rectangle, a fillet of one, a
rectangle with named faces bowed into round ends, an ellipse, or a slice of one. A slice closes through the
middle while the middle stands clear of the chord, so a quarter turn is a wedge, a half is a D and three
quarters is a cylinder with a flat cut across it.

## Errors

`E_DOC_INVALID` when a section insets past its own footprint, or when its plan folds in on itself. Nothing
else: a document that parsed can be assembled.

## Invariants

- Every footprint is convex, and the layout refuses one that is not. The deck grid, the support proof and the
  caps all read a plan by its edges alone.
- Sections are contiguous in y: each one starts where the one below ended, starting at 0.
- Every floor of a section has the same bay layout, so a repeated floor costs nothing extra.
- The sum of a side's bay widths equals that side's length exactly.

## Depends on

`#spec`.
