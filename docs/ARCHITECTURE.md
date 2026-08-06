# Architecture

## The one idea

A building is a **document**, not a mesh. The document says "band of 6 bulk floors on template B, then a custom
floor with a landing, then the roof". Meshes are derived from it. Because the mesh is derived, editing the main
floor and rebuilding leaves every other band byte-identical, and a band can be swapped without touching its
neighbours.

```
document.json ──► assemble ──► placed scene ──► check ──► glb ──► building.glb
   (edits)                     (transforms)   (proofs)   (write)      │
       ▲                                                              ▼
     cli verbs ◄──────────── selection ◄──────────────────────────  preview
```

## Why things stop floating and overlapping

Free placement is the bug. The document cannot express it.

- **Sockets, not coordinates.** A part is never given an x,y,z. It is bound to a named socket on a host part
  (a bay's window opening, a balcony's rail line, a wall's top edge). No socket, no placement. A part with a
  bound socket is by construction attached to something.
- **Integer millimetres.** Every size, offset and socket lives in whole millimetres. Contact is an exact
  integer equality, not a float comparison with a tolerance that has to be tuned. Metres appear once, at export.
- **Quarter turns on the grid.** Parts rotate in 90 degree steps inside the bay frame, so their boxes stay
  axis aligned and the overlap test is an exact integer AABB test. Free rotation exists at band level only.
- **Every part carries a box.** Overlap is a sweep over the floor's boxes. Touching faces are contact, not
  overlap. Interpenetration is an error with both part ids.
- **Envelope.** Each floor declares how far anything may stick out per side. A balcony deeper than the envelope,
  or an AC unit hanging over the lot line, is an error before geometry exists.
- **Human sizes are rules, not habits.** Door 2.10 m, rail 1.05 to 1.20 m, clear walking width 0.90 m, floor
  2.70 to 4.00 m, step rise 0.15 to 0.19 m, balcony depth 1.20 to 2.00 m. `check` holds the table and every
  build is measured against it.

## Why blocks stack block by block

Every band exposes a **seam**: the footprint polygon of its top face and the bay count per edge, both in
millimetres. Two bands stack when the lower band's top seam equals the upper band's bottom seam. That is one
integer comparison, so "is this block compatible with that one" has an exact answer, and a rotated or narrower
band either declares a matching seam or gets a transition slab between them.

## Why thousands of these run in one scene

Detail is a property of the band, not of the building.

| Tier | What it is | Rough budget per floor |
| --- | --- | --- |
| `flat` | Fake floor. A box with facade texture, windows and balconies live in the image only | under 100 tris |
| `light` | Bulk floor with shallow relief: recessed windows, a sill, a slab line | 300 to 1200 tris |
| `full` | Main floor, roof, and custom floors with real balconies, doors, landings, AC units, wires | 3000 to 8000 tris |

A whole building may be `flat` top to bottom, with no real floor in it at all. That is a supported product, not
a degraded one, and it is what fills the far half of a city.

On top of the tiers:

- **One mesh, many nodes.** A repeated floor is written once as a glTF mesh and referenced by many nodes. That
  is core glTF, so Unreal, Unity and three.js all reuse it without a vendor extension.
- **Few materials.** Textures pack into one atlas per building family, so a building is one or two materials
  (opaque, glass). Atlas UVs are baked into the mesh, because Unreal's importer ignores `KHR_texture_transform`.
- **LODs are the tier machine run again.** LOD1 rebuilds `full` bands as `light`, LOD2 rebuilds everything as
  `flat`. Same document, same code path.
- **Budgets are checked.** Triangle count per band kind is an invariant `check` enforces, so bloat fails the
  build instead of reaching the scene.

## Export profiles

One document, four writes. All of them are plain glTF 2.0: metres, Y up, right handed, one UV set, PBR metallic
roughness, no Draco, no meshopt, no texture transform. Profiles differ only where the engines differ.

| Profile | What it adds |
| --- | --- |
| `general` | Core glTF only. The safest file, opens anywhere |
| `unreal` | `UCX_` collision meshes, `_LOD0/1/2` naming, optional second UV set for lightmaps |
| `unity` | LOD group naming, optional second UV set |
| `threejs` | Merged draw calls, optional `EXT_mesh_gpu_instancing` |

Every written file goes through three gates: normals must agree with winding, the building must close into one
shell with positive volume, and the Khronos glTF validator must report no error. The validator alone would not
catch any of the geometry failures, which is why the first two exist.

One building is one mesh per band with one node per floor, and its parts are primitives inside those meshes.
That is the portable unit: Unreal turns it into one Static Mesh with material slots, Unity into one Mesh with
submeshes, three.js into a Group.

## The preview loop

The viewer is not a screenshot. It reads the same document and shows a blueprint over the mesh: band bands,
floor lines, bay grid, dimensions in metres. Click picks a part or a bay and prints its id. A drag rectangle
marks an active zone, which is a set of bay ids plus a box in building coordinates. The zone is handed back to
the CLI, so "put a window there" resolves to bay ids the agent can name in a verb.

## The agent's surface

The agent never edits the document by hand and never touches the repo. It calls verbs. The skill is a resolver
that routes an intent to one fat sub-skill (main floor, bulk band, custom floor, roof, materials, auto build),
and the sub-skill runs the verbs. Auto build walks main floor, bulk, custom floors, bulk, roof in order, with a
`check` gate at every step, so a one shot description like "high tech cyberpunk mega building" produces a file
that already passed every proof.
