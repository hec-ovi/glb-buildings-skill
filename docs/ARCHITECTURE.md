# Architecture

## The one idea

A building is a **document**, not a mesh. The document says "a base, then 18 floors on this footprint with
balconies down the south face, then a roof with a tank on it". Meshes are derived from it. Because the mesh is
derived, editing the base and rebuilding leaves every other section byte-identical, and a section can be
swapped without touching its neighbours.

```
document.json ──► assemble ──► placed scene ──► check ──► glb ──► building.glb
   (edits)                     (footprints)   (support)  (write)      │
       ▲                                                              ▼
     cli verbs ◄──────────── selection ◄──────────────────────────  preview
```

## The section

A section is the design unit: a run of identical floors that owns its shape. Its skin is the **loft** between
the footprint it starts on and the one it ends on, closed at both ends, so a step, a slide, a turn, a twist
and a taper are all the same operation. One section is one mesh and one node, however many floors it stacks.

## The grid on a face

Every face of a section is a rectangle, one floor tall, and it divides into **10 cm cells**. A window, a
door, a balcony, a panel or a lit screen is a rectangle of cells, claimed by the element that stands on it,
so two of them cannot overlap and nothing is ever placed by coordinate. A border of one cell is kept clear,
so nothing lands on a corner or a floor line.

A cell is asked for by column and row and comes back on the real face, which is what makes a twist, a taper
or a curve need no special case: the composer works in a flat grid and the geometry lands where the section
actually is.

A balcony holds its slab and its two side rails and leaves the middle open, which is exactly the space a door
onto it needs, so the two compose instead of fighting for cells.

The design belongs to the face, not to a floor: a section of eighteen floors builds it eighteen times and
still costs one mesh.

## Runs

A duct, a pipe and a cable are one thing: a path of points carrying a ring along it. `profile` is how many
corners the ring has, `thickness` is how far across the run is, and that is the whole difference between an
air duct, a pipeline and a wire.

The ring is mitred at every point onto the plane bisecting the two runs meeting there, so a corner is the
same ring rather than two parts overlapping, and the cross section holds the whole way. Points that carry
straight on are dropped. A turn too sharp to mitre is a fold, not a bend, and is refused with the point
named. Nobody composing a building ever works out a joint.

## Why nothing floats or gets buried

Free placement is the bug. Nothing in the pipeline gives a part an x, y, z and hopes.

- **Parts anchor to the plan or the grid.** A column takes a footprint corner or a face, a deck part takes a
  cell of the roof grid, a window takes a rectangle of cells on a face. Which way is out comes from the
  footprint at the part's own height, so a taper or a twist never sends a part into a wall.
- **Everything bites in.** A part sinks a centimetre into what it stands on and a section sinks a centimetre
  into the one below, so no two surfaces share a plane and nothing flickers.
- **Nothing may be buried.** Every part a section wears has to reach at least 5 cm out of it, measured against
  the footprint at its own height. A part hidden inside a wall is a mistake nobody can see, so it fails.
- **Nothing may drift.** A part more than 3 m past the footprint, or 12 m above the top, is not on the
  building any more, and fails with the section named.
- **A cell holds one part.** The roof is a two metre grid with named cells (`A1`, `B3`) and a face is a 10 cm
  one; a part claims the cells it covers and a second part in them is refused.
- **A section has to land.** The share of a section's underside that lands on the one below is measured: half
  or more is ordinary, a fifth to a half is a cantilever worth reporting, under a fifth is refused.

Human sizes (floor heights, guards, door clearances, bay widths) are in `skills/glb-buildings/parts/dimensions.md`,
where the agent choosing them reads.

## Why thousands of these run in one scene

Detail is a property of the section, not of the building.

| Tier | What it is | Budget per floor |
| --- | --- | --- |
| `flat` | Fake floor. Walls with a facade texture; windows and their glow live in the image only | 120 tris |
| `light` | Shallow relief: a parapet, a ledge, a rib | 1200 tris |
| `full` | Cut windows, balconies, columns, greebles, deck clutter | 4000 tris |

A roof is judged as a whole section rather than per floor, at 4500. A building may be `flat` top to bottom,
with no real floor in it at all. That is a supported product, not a degraded one, and it is what fills the far
half of a city. Going over the budget fails the build with the section named, so bloat never reaches a scene.

Two more things keep the cost down: one mesh per section however many floors it repeats, and one texture per
building, generated from its name, carried by both the facade and the glass material.

## The file

Plain glTF 2.0: metres, Y up, right handed, one UV set, PBR metallic roughness, no Draco, no meshopt, no
texture transform, `extensionsRequired` empty. Three materials: `facade` and `glass` share the generated
window grid (colour and emissive), `roof` is plain grey. Nothing is scaled and nothing is mirrored, so every
node keeps a positive determinant and the only handedness flip is the one each importer does for itself.

Every written file passes, in this order: the stack ends in a base and a roof, every section lands on the one
below, every stored normal agrees with its triangle's winding, every section closes into a solid with positive
volume, nothing is buried, nothing is over budget, nothing has drifted, and then the Khronos validator reports
no error. The validator alone would catch none of the geometry failures, which is why the rest exist.

One building is one mesh per section with one node each, and its parts are primitives inside those meshes.
That is the portable unit: Unreal turns it into one Static Mesh with material slots, Unity into one Mesh with
submeshes, three.js into a Group.

## The preview loop

The viewer is not a screenshot. It reads the same document and shows a blueprint over the mesh: sections
coloured by kind, floor lines, bay grid, dimensions in metres. Click picks a bay and prints its id. A drag
rectangle marks an active zone, which is a set of bay ids plus a box in building coordinates, and only faces
turned toward the camera are caught, so the far side is never selected by accident. The zone lands in
`selection.json`, so "put a window there" resolves to bay ids the agent can name in a verb.

## The agent's surface

The agent never edits the document by hand and never touches the repo. It calls verbs. The skill is a resolver
that routes an intent to one fat sub-skill (auto build, the stack, a face, editing what was clicked, breaking
up a run of floors, the roof deck, dimensions), and the sub-skill runs the verbs.

Building from one description is **two passes**, and they are separate on purpose:

- **The architect** reads the description, settles the footprint, the floor count and how the mass splits
  into sections, and builds to prove the massing stands. It works in metres and never looks at a window.
- **A facade job per section design** takes one section, reads its grid, and composes cells. It never looks
  at the rest of the building. A forty floor tower is four to six of these, not forty, because a section
  repeats one floor design.

Neither pass has to hold the other in its head, and the document is the only seam between them. That is what
makes the work fit a small local model: every context is a bounded, integer, occupancy-checked space that
refuses invalid input, so no pass has to review the pass before it.
