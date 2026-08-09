# Decisions

What the project is built on, each with its reason. Current choices only.

## Language and runtime

**TypeScript on Node 24, one codebase for the builder and the viewer.** The blueprint overlay draws the same
footprints, bays and sizes the builder places, so sharing the code means the preview cannot disagree with the
mesh. Node 24 runs TypeScript directly, so the CLI has no build step.

**Boxes are folders reached through the `imports` map** (`#spec`, `#kit`). A deep import into another box's
source is not expressible.

**Vitest for tests**, with Testing Library and user-event for the viewer, so the preview's picking and zone
selection are tested on a simulated DOM and never skipped.

## Geometry

**Integer millimetres in the document.** Sizes, offsets and footprints compare exactly, with no tolerance to
tune. Metres appear once, when the GLB is written.

**A section is a loft between two footprints.** One operation covers a step, a slide, a turn, a twist and a
taper, and a section closes into its own solid, so any two of them meet without a transition piece.

**Parts anchor to the plan, never to coordinates.** A column takes a corner or a face, a balcony takes a wall
and a floor line, a deck part takes a named cell. Which way is out is measured from the footprint at the
part's own height, so a taper or a twist cannot push a part into a wall.

**Contact is proved, not assumed.** Everything bites a centimetre into what it stands on, and the build
refuses a part that does not reach 5 cm out of its section or that drifts more than 3 m off it. That pair
replaces a tolerance nobody can tune.

## glTF

**glTF Transform 4.4 writes the files.** It is the glTF 2.0 SDK with a document API, so nodes, meshes,
materials and accessors are authored directly rather than round tripped through a scene library.

**Core glTF 2.0 only, by default.** Metres, Y up, right handed, one UV set, PBR metallic roughness. UVs are
baked into the mesh, because Unreal's importer ignores `KHR_texture_transform`. `EXT_mesh_gpu_instancing`
belongs to the three.js profile, where Unity glTFast and three.js both read it.

**One mesh per section, one node per section.** A section repeats one floor design, so a 40 floor tower costs
one section of geometry however many floors it stacks, with no vendor extension involved.

**The facade texture is written from code, seeded from the building's name.** Bands of glazing in a near black
wall is a picture a few lines of pixel work make better than a photograph: it tiles exactly, it costs under
40 kB, and every building gets its own. The colour and emissive maps come out of one grid, so a window that
glows is a window that is lit, and the geometry cuts its panes where the picture draws them.

**The Khronos glTF validator gates every write.** A file that reports an error is not a product. It is not
enough on its own: it checks structure, not geometry, so a valid file can still import inside out. The
geometry proofs run first, per section: winding against stored normals, a closed solid with positive volume,
nothing buried, nothing adrift, and the tier's triangle budget.

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
