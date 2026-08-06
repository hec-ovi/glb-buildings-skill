# assemble

Lays a document out in space: bands stack from the ground, each floor's facade splits into bays, each band
publishes the seam it shows to its neighbours. Pure arithmetic, no geometry and no files.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `assemble(document)` | `BuildingDocument` from `#spec` | `PlacedScene` |
| `floors(scene)` | placed scene | every floor, bottom to top |
| `findBay(scene, id)` | placed scene, bay id | that bay, or nothing |
| `seamsMatch(a, b)` | two seams | whether the bands stack |
| `describeSeam(seam)` | seam | one line for an error message |

Types live in [`scene.ts`](scene.ts).

## The placed scene

```
PlacedScene { name, size {width, depth, height}, bands[] }
  PlacedBand { id, kind, tier, template, rotation, inset, y0, y1, floors[], seam }
    PlacedFloor { id: "body.f3", bandId, index, y0, y1, bays[] }
      PlacedBay { id: "body.f3.S2", side, index, width, box }
```

Boxes are in the band's own frame, before the band's `rotation` is applied. Coordinates are millimetres, the
building is centred on X and Z, and y starts at 0 on the ground.

Bays run along increasing X on the N and S sides, along increasing Z on the E and W sides. Bay widths are the
exact integer partition of the side, so they sum to the side length with no gap and no overlap. Adjacent sides
share their corner volume, which the kit resolves with a corner part.

## Errors

`E_DOC_INVALID` when a band insets past its own footprint. Nothing else: a document that parsed can be
assembled.

## Invariants

- Bands are contiguous in y: each band starts where the one below ended, starting at 0.
- Every floor of a band has the same bay layout, so a repeated floor is one mesh in the GLB.
- The sum of a side's bay widths equals that side's length exactly.
- Two bands with the same footprint and the same grid have matching seams.

## Depends on

`#spec`.
