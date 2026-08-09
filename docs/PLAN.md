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

## Next

**8. Bay level editing.** A zone from the preview becomes a target for "put a window there": verbs that act on
bay ids, not just whole sections.

**9. Doors and the ground floor.** A real entrance: door, frame, awning, landing, the parts that make the
bottom two floors read as a place people walk into.

**10. Export profiles and LODs.** `general`, `unreal`, `unity`, `threejs`. LOD chains ship as separate files
with a manifest, because `MSFT_lod` is unsupported in all three engines.

## Later

The human size table as a build gate, envelope limits per section, Unreal collision meshes, a second UV set
for lightmaps, city scale batch export.
