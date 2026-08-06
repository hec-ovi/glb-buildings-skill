# glb

Writes the file an engine opens, and proves it before anyone does. Core glTF 2.0 only: metres, Y up, one UV
set, PBR metallic roughness, no extensions, so one file serves Unreal, Unity and three.js.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `buildGlb(document)` | `BuildingDocument` | `{ glb, scene, stats }` |
| `validateGlb(bytes)` | GLB bytes | `{ errors, warnings, infos }` from the Khronos validator |

`stats` is `{ meshes, nodes, triangles, materials, bytes }`, the numbers worth watching in CI.

## How the file is shaped

- A band's floors are identical, so its mesh is written once and one node per floor points at it. A 40 floor
  tower costs one floor of geometry.
- Nodes carry translation, and rotation where a band is turned. Nothing is scaled, nothing is mirrored, so
  every node transform keeps a positive determinant and no importer has to guess about winding.
- Two materials: `facade` and `roof`, both metallic roughness, single sided.
- `extensionsRequired` is empty. A file that requires an extension Unreal lacks does not load at all.

## Proofs before the write

1. Every stored normal agrees with its triangle's winding (from `#kit`).
2. The building's meshes together form one closed shell with positive volume: no open edge, no doubled edge,
   nothing inside out.
3. The Khronos glTF validator reports no error. Warnings and infos are counted and passed back.

Any failure throws instead of writing a file.

## Errors

`E_GLB_INVALID` (the shell is open, a material is missing, or the validator found an error), `E_BAND_EMPTY`,
plus whatever `#kit` and `#assemble` raise.

## Not here yet

Export profiles per engine, LOD chains, textures, instancing. One plain file, one detail level.

## Depends on

`#spec`, `#assemble`, `#kit`.
