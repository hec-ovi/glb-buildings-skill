# kit

The parts. A section template builds one section's geometry in metres, in its own frame, with the winding and
normals that survive Unreal, Unity and three.js. It knows nothing about documents or files.

## The section

A section is the design unit: a run of floors that owns its shape. Its skin is the **loft** between the
footprint it starts on and the one it ends on, closed at both ends, so a step, a slide, a turn, a twist and a
taper are all the same operation. Sections are closed solids that sink slightly into the one below, the way a
kitbashed building is assembled, which is why any two of them meet without a transition piece.

```
SectionShape { bottom: Corner[], top: Corner[], height, floors, chamfer?, windows? }
```

Corners are world X and Z in metres, `y=0` is the section's underside, and a footprint is convex. Walls are cut
into one row of quads per floor, so a texture tiles once per floor.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `template(id)` | template id | the `Template`, or `E_UNKNOWN_TEMPLATE` |
| `templates()` | | every template with its tier and one-line purpose |
| `Template.build(shape)` | `SectionShape` | one `MeshData` per material, closed |
| `dress(shape, options)` | shape, what it wears | cables, columns, greebles, deck parts, as one mesh |
| `segment(surface, points, style)` | a path in metres, a profile and a thickness | one closed run of tube, mitred at every corner |
| `walls` / `cap` / `capRing` / `ringAt` | shape or rings | the pieces templates are made of |
| `outwardAt(ring, edge)` | footprint, edge | the way out at that edge |
| `outsideBy(ring, point)` | footprint, point | metres past the footprint, negative inside |
| `facePoint(shape, t, edge, along, out)` | a face, how far up and across it | that point in the building |
| `insideRing` / `nearestOn` / `insetRing` / `middleOf` / `tangentAt` | footprints | the rest of the plan arithmetic |
| `cells(ring, margin, covered?)` | deck footprint | the two metre grid, named `A1`, `B3` |
| `windingProblems(mesh)` | one mesh | where a normal disagrees with its triangle, or a triangle has no area |
| `shellProblems(meshes)` | a section's meshes | where it is open, doubled, or inside out |
| `sunkProblems(meshes, shape)` | what a section wears | which parts are buried inside it |
| `proudProblems(meshes, box)` | meshes, the section's box | which parts have drifted off it |
| `solids(meshes)` | meshes | triangles grouped into separate solids |
| `new Surface(material, patch?)` | material name, where its quads land on the texture | a builder: `.quad()`, `.box()`, `.cap()`, `.data()` |

## Templates

| id | tier | what it is |
| --- | --- | --- |
| `bulk-flat` | flat | a plain section: four textured walls, windows live in the image |
| `main-plain` | full | the base: taller walls, and the underside that closes the building |
| `roof-parapet` | light | the crown: a parapet and the roof deck |

Materials are named, not built here: `facade`, `glass` and `roof`.

## Runs

A duct, a pipe and a cable are one thing: a **segment**, a path of points carrying a ring along
it. `profile` is how many corners that ring has (`square`, or `round` with `sides`), `thickness`
is how far across the run is, and the material is whatever surface it is drawn into. A square
duct, a round pipe and a thin wire differ in those two numbers and nothing else.

The ring is mitred at every point onto the plane bisecting the two runs meeting there, so a
corner is the same ring rather than two parts overlapping, and the cross section never changes
along the way. Points that carry straight on are dropped, so a cable up twenty identical floors
is one length rather than twenty. A turn sharper than `MAX_MITRE` allows is a fold, not a bend,
and is refused with the point named.

## Invariants

- Front faces are counter-clockwise seen from outside, and every stored normal agrees with its triangle's
  winding. `windingProblems` returns nothing for any template output.
- Every section is a closed solid with positive volume. `shellProblems` returns nothing, at any twist or taper.
- Every part a section wears reaches at least `SHOWS` (5 cm) out of it, measured against the footprint at the
  part's own height. Nothing the kit builds is buried in a wall or flush with one.
- Which way is out comes from `outwardAt`, measured against the middle of the footprint, never from the
  winding, so a ring wound either way dresses the same.
- A triangle with no area is never written: a collapsed corner drops out instead of carrying a zero normal.
- A wall lays its own UVs against the facade tile: one row of the tile per floor, one bay per `FACADE_STYLE.bay`
  metres of face, so a window comes out window sized. A window pane covers the window it is built over and
  samples it, so drawn glass and cut glass are one window.
- Everything that is not a window takes `WALL_PATCH`, one point of plain wall, rather than a slice of
  somebody's windows at whatever scale the part happens to be.

## Errors

`E_UNKNOWN_TEMPLATE`.

## Depends on

`#spec`, `#materials` (for the facade tile's shape).
