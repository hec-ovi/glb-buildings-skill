# Plan

Build order, box by box. Each milestone ends with a file you can open in an engine.

## Done

**1. The fake building end to end.** `spec`, `assemble`, `kit`, `glb`, and the `cli` verbs that drive them. An
all `flat` tower writes one mesh per band, one node per floor, two materials, and passes the Khronos validator.

**2. The editor.** `preview`: three.js blueprint with click picking and dragged zones, selections carried back
to the CLI through `selection.json`.

**3. The agent surface.** Named projects, `SKILL.md` with four fat parts, plugin manifests, install docs, and a
drift test that keeps the skill honest about the verbs.

## Next

**4. The proofs (`check`).** Support, overlap, envelope, the human size table, seam match, triangle budget.
Wired into `build` as a gate. The mesh-level proofs already run (winding, closed shell); this is the document
level, where a floating balcony or an over-budget band gets caught with a part id.

**5. Real floors (`kit` grows).** Window, door, frame, sill, balcony slab, railing, landing, awning, AC unit,
wire, cornice. Sockets and quarter turns, so a part cannot be placed unattached. `light` and `full` tiers stop
being walls with a different label.

**6. Materials.** Hector's images become texture sets, packed into one atlas per building family, with baked UVs
and real world texel density. Unreal ignores `KHR_texture_transform`, so the UVs are baked, not offset.

**7. Bay level editing.** A zone from the preview becomes a target for "put a window there": the CLI gains
verbs that act on bay ids, not just bands.

**8. Export profiles and LODs.** `general`, `unreal`, `unity`, `threejs`. LOD chains ship as separate files with
a manifest, because `MSFT_lod` is unsupported in all three engines.

## Later

Transition bands so setbacks and turned bands stack, Unreal collision meshes, second UV set for lightmaps, city
scale batch export.
