# kit

The parts. A floor template builds one floor's geometry in metres, in its own frame, with the winding and
normals that survive Unreal, Unity and three.js. It knows nothing about documents or files.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `template(id)` | template id | the `Template`, or `E_UNKNOWN_TEMPLATE` |
| `templates()` | | every template with its tier and one-line purpose |
| `Template.build(shape)` | `FloorShape` in metres | one `MeshData` per material |
| `windingProblems(mesh)` | one mesh | problems where a normal disagrees with its triangle, or a triangle has no area |
| `shellProblems(meshes)` | every mesh of a building | problems where the shell is open, doubled, or inside out |
| `new Surface(material)` | material name | a builder: `.quad()`, `.box()`, `.cap()`, `.data()` |

## The frame

A floor is built with the building centre at x=0, z=0 and y=0 at the floor's underside. Every floor of a band
is identical, so the GLB writes the mesh once and points one node per floor at it.

Walls are a ring of four outward quads: S faces +Z, N faces -Z, E faces +X, W faces -X. Stacked rings share
their edges exactly, the main floor adds the underside and the roof adds the deck, so a whole building is one
closed shell.

## Templates

| id | tier | what it is |
| --- | --- | --- |
| `bulk-flat` | flat | a fake floor: four textured walls, windows live in the image |
| `main-plain` | full | the ground floor: taller walls, and the underside that closes the building |
| `roof-parapet` | light | the crown: a parapet ring and the roof deck that closes the building |

Materials are named, not built here: `facade` and `roof`.

## Invariants

- Front faces are counter-clockwise seen from outside, and every stored normal agrees with its triangle's
  winding. `windingProblems` returns nothing for any template output.
- A building's meshes together form a closed shell with positive volume. `shellProblems` returns nothing.
- UVs come from real-world size: one texture tile per `TILE` metres, so a wall and a roof match density.
- No triangle has zero area.

## Errors

`E_UNKNOWN_TEMPLATE`.

## Depends on

`#spec`.
