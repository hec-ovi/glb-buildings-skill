# glb-buildings-skill

Procedural building GLBs for Unreal Engine, Unity and three.js. A building is a JSON document of floor bands,
not a mesh, so you edit the ground floor and rebuild without touching anything above it. The file that comes
out is plain glTF 2.0: metres, Y up, one UV set, no extensions, one mesh per band with one node per floor.

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
buildings set-band ground --height 4.5      # taller lobby
buildings set-band body --floors 22 --height 3.0
buildings build
buildings preview                            # blueprint editor at 127.0.0.1:4321
```

`buildings show` prints the stack band by band. Projects live in `~/.glb-buildings/projects/`, or wherever
`BUILDINGS_HOME` points, and the current one is remembered, so you name a building once.

## What comes out

A 24 floor tower is one GLB of a few kilobytes: three meshes, one node per floor, two materials, about 200
triangles. Detail is a property of the band, so a background building can be `flat` top to bottom, with windows
living in the texture, while a foreground one carries real geometry where it is seen.

Nothing is written until it is proved. Every stored normal has to agree with its triangle's winding, the
building has to close into one shell with positive volume, and the Khronos glTF validator has to report no
error. That combination is what stops inverted roofs, invisible walls and files an engine silently mangles.

## The preview

`buildings preview` serves a blueprint of the current building: bands coloured by kind, floor outlines, sizes in
metres. Click a bay and it prints its id. Drag a rectangle in zone mode and every bay inside it that faces the
camera is selected, so the far side is never caught by accident. Picks land in the project's `selection.json`,
which the agent reads to know what "here" means.

## How it is built

Nine boxes, each a folder with a `CONTRACT.md` that is enough to use it without reading its code. Start at
[docs/INDEX.md](docs/INDEX.md).

`spec` holds the document and the closed error set, in whole millimetres so contact and seams are exact integer
comparisons. `assemble` lays it out. `kit` builds the geometry. `glb` writes and proves the file. `preview` is
the editor. `cli` is the agent's surface.

Run everything with `npm test`.

## Status

Working today: the document model, the stack, the fake and light tiers, the GLB writer with its proofs, the
preview editor, named projects, and the skill. Next up, in [docs/PLAN.md](docs/PLAN.md): the document level
proofs, real parts (windows, doors, balconies, railings, roof clutter), textures, and bay level editing.

MIT licensed.
