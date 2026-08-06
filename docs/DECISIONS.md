# Decisions

What the project is built on, each with its reason. Current choices only.

## Language and runtime

**TypeScript on Node 24, one codebase for the builder and the viewer.** The blueprint overlay draws the same
sockets, boxes and sizes the builder places, so sharing the code means the preview cannot disagree with the
mesh. Node 24 runs TypeScript directly, so the CLI has no build step.

**Boxes are npm workspace packages, reached through the `imports` map** (`#spec`, `#kit`). A deep import into
another box's source is not expressible.

**Vitest for tests**, with Testing Library and user-event for the viewer, so the preview's picking and zone
selection are tested on a simulated DOM and never skipped.

## Geometry

**Integer millimetres in the document.** Contact, overlap and seam matching become exact integer comparisons
with no tolerance to tune. Metres appear once, when the GLB is written.

**Sockets instead of coordinates.** A part is bound to a named socket on a host part, so an unattached part is
not a thing the document can hold.

**Quarter turns for parts, free rotation at band level.** Axis aligned boxes inside a bay keep the overlap test
exact, and the interesting rotations (a twisted stack of floors) happen where a seam contract still holds.

## glTF

**glTF Transform 4.4 writes the files.** It is the glTF 2.0 SDK with a document API, so nodes, meshes,
materials and accessors are authored directly rather than round tripped through a scene library.

**Core glTF 2.0 only, by default.** Metres, Y up, right handed, one UV set, PBR metallic roughness. Atlas UVs
are baked into the mesh, because Unreal's importer ignores `KHR_texture_transform`. `EXT_mesh_gpu_instancing`
belongs to the three.js profile, where Unity glTFast and three.js both read it.

**Repeated floors are one mesh referenced by many nodes.** Core glTF mesh reuse is understood by every engine,
so a 40 floor tower costs one floor of geometry.

**The Khronos glTF validator gates every write.** A file that reports an error is not a product. It is not
enough on its own: it checks structure, not geometry, so a valid file can still import inside out. Two proofs
run first, in `kit`: every stored normal agrees with its triangle's winding, and the building's meshes form one
closed shell with positive volume (no open edge, no doubled edge).

**Nothing is scaled and nothing is mirrored.** Every node keeps a positive determinant and a uniform scale, so
the only handedness flip in the pipeline is the one each importer does for itself, which all three get right.
Mirrored geometry is baked, never expressed as a negative scale.

**LOD chains ship as separate files with a manifest.** `MSFT_lod` is unsupported by three.js, Unity glTFast and
Unreal alike, so a glTF file cannot carry the intent.

## Preview

**three.js 0.185 in the browser, served by a small local server.** The server holds the current document, hands
the viewer the built GLB, and carries the selected zone back so the CLI agent can name the bays the human
clicked.

## Agent surface

**The agent operates through CLI verbs, never by editing the document.** Every write goes through validation, so
an agent cannot produce a building that skipped the proofs.

**One resolver plus fat sub-skills**, following the shape used in `censurado-web-brain`: the always loaded
`SKILL.md` routes an intent to one sub-skill file, and the sub-skill holds the whole method for main floor,
bulk band, custom floor, roof, materials or auto build.
