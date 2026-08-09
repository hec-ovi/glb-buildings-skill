# Plan

Build order, box by box. Each milestone ends with a file you can open in an engine.

## Done

**1. The fake building end to end.** `spec`, `assemble`, `kit`, `glb`, and the `cli` verbs that drive them. An
all `flat` tower writes one mesh per section, two materials, and passes the Khronos validator.

**2. The editor.** `preview`: three.js blueprint with click picking and dragged zones, selections carried back
to the CLI through `selection.json`.

**3. The agent surface.** Named projects, `SKILL.md` with its fat parts, plugin manifests, install docs, and a
drift test that keeps the skill honest about the verbs.

**4. Sections.** A section is the loft between the footprint it starts on and the one it ends on, so a step,
a slide, a turn, a twist and a taper are one operation and no transition piece is needed. Round plans, arcs,
bowed faces, filleted corners and chamfered edges, each proved convex.

**5. The proofs.** Support share per section in `check`, and per section as it is built: winding against
normals, a closed solid with positive volume, nothing buried, nothing adrift, triangle budget per tier.

**6. The parts.** Windows as cut panes, greebles, columns, balconies, cables, and a roof deck laid out by
named cell with `deck`, `place` and `unplace`.

**7. Facade textures.** Written from code and seeded from the building's name: a window grid in colour and
emissive, tiled one row per floor and one bay per 3 m, carried by both the facade and the glass material.

**8. Faces as grids.** Every face divides into 10 cm cells. A window, a door, a balcony or a screen is a
rectangle of them, claimed so two elements can never overlap, with a clear border all round. A balcony holds
its slab and rails and leaves the middle open for the door onto it.

**9. Runs.** A duct, a pipe and a cable are one thing: a path of points carrying a ring, mitred at every
corner. The composer gives points and a profile and never works out a joint.

## Next

**10. The preview composes.** A zone dragged on a face becomes a cell rectangle, so "put a window there"
resolves without anyone typing numbers.

**11. Export profiles and LODs.** `general`, `unreal`, `unity`, `threejs`. LOD chains ship as separate files
with a manifest, because `MSFT_lod` is unsupported in all three engines.

## Later

The human size table as a build gate, envelope limits per section, Unreal collision meshes, a second UV set
for lightmaps, city scale batch export.
