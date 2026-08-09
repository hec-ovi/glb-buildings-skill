# glb-buildings-skill

Procedural building GLBs for Unreal Engine, Unity and three.js. A building is a JSON document of floor
sections, not a mesh, so you edit the ground floor and rebuild without touching anything above it. The file
that comes out is plain glTF 2.0: metres, Y up, one UV set, no extensions, one mesh and one node per section.

Built to be driven by an agent: every action is a `buildings <verb>` call that answers with one JSON object.

## Install

Needs Node 24 or newer. Full routes, including the agent skill and the Claude Code plugin, are in
[docs/INSTALL.md](docs/INSTALL.md).

```bash
git clone https://github.com/hec-ovi/glb-buildings-skill
cd glb-buildings-skill
npm install
npm link
```

## Use

```bash
buildings new tower-a --width 18 --depth 14 --floors 24
buildings set-band ground --height 4.5 --tier light --columns corners   # taller lobby
buildings set-band body --floors 22 --height 3.0 --greebles 0.35
buildings set-band crown --clutter 0.5                                  # tanks, masts, units on the roof

buildings face body --side S                     # the face as a grid of 10 cm cells
buildings put window 12,9 25,24 --every 3        # a rhythm of glazing across it
buildings put balcony 30,2 55,15 --section ground --depth 1.4
buildings put door 38,4 47,20 --section ground   # out onto the balcony

buildings build
buildings preview                                # blueprint editor at 127.0.0.1:4321
```

`buildings show` prints the stack section by section, and every flag you can set comes back in it. Projects
live in `~/.glb-buildings/projects/`, or in a `.buildings` folder next to your work with `new --here`, and the
current one is remembered, so you name a building once.

## What comes out

A plain 24 floor tower is one GLB of about 29 kB: three meshes, three nodes, three materials, 204 triangles,
most of the file being its own facade texture. Dress the same tower with cut windows, greebles, ribs and roof
clutter and it costs 14k triangles. Detail is a property of the section, so a background building can be
`flat` top to bottom, with windows and their glow living in the texture, while a foreground one carries real
geometry where it is seen.

The facade texture is written from code and seeded from the building's name, so every building gets its own
window grid, dark with a few lit rooms, and the geometry cuts its panes where the picture draws them.

## Faces are grids

Every face of a section divides into 10 cm cells. A window, a door, a balcony, a panel or a lit screen is a
rectangle of them, and an element claims the cells it stands on, so two of them can never overlap and nothing
is ever placed by coordinate. A cell is asked for by column and row and comes back on the real face, so a
section that twists, tapers or curves needs no special case.

A balcony keeps its slab and its two side rails and leaves the middle open, which is exactly the space the
door onto it needs:

```
. o x x x o .
. o x x x o .
. o o o o o .   the slab, which is the floor the door stands on
```

Ducts, pipes and cables are one builder: a path of points carrying a ring, mitred onto the plane bisecting
the two runs at every corner. The cross section holds the whole way, and a turn too sharp to mitre is refused
with the point named.

## Nothing is written until it is proved

Every section is measured before the file exists: it has to land on the one below, close into a solid with
positive volume, agree with its own normals, keep every part it wears reaching out of it and not drifting off
it, and stay inside the triangle budget its tier promises. Then the Khronos validator runs on the bytes. That
combination is what stops inverted roofs, invisible walls, buried balconies and files an engine silently
mangles.

## The preview

`buildings preview` serves a blueprint of the current building: sections coloured by kind, floor outlines,
sizes in metres, and the built model on a toggle. Click a bay and it prints its id. Drag a rectangle in zone
mode and every bay inside it that faces the camera is selected, so the far side is never caught by accident.
Picks land in the project's `selection.json`, which the agent reads to know what "here" means.

## How it is built

Ten boxes, each a folder with a `CONTRACT.md` that is enough to use it without reading its code. Start at
[docs/INDEX.md](docs/INDEX.md).

`spec` holds the document and the closed error set, in whole millimetres so every comparison is exact.
`assemble` lays it out. `kit` builds the geometry and the runs. `facade` is the cell grid on every face.
`materials` writes the textures. `check` proves the stack. `glb` writes and proves the file. `preview` is the
editor. `cli` is the agent's surface.

Run everything with `npm test`.

## Driven by an agent

The skill is a resolver over fat parts, and the work splits into two passes that never need each other in
context: an architect settles the massing in metres and sections and proves it stands, then one facade job
per section works in cells on its own grid. The document is the only thing between them.

## Status

Working today: the document model, sections with their shapes (step, slide, turn, twist, taper, round plans,
arcs, bowed faces), faces as cell grids with windows, doors, balconies, panels and screens, runs of duct,
pipe and cable, greebles, columns, the roof deck, generated facade textures, the proofs, the GLB writer, the
preview editor, named projects, and the skill. Next up, in [docs/PLAN.md](docs/PLAN.md): composing from the
preview, export profiles and LODs.

MIT licensed.
