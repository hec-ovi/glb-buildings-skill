# glb

Writes the file an engine opens, and proves it before anyone does. Core glTF 2.0 only: metres, Y up, one UV
set, PBR metallic roughness, no extensions, so one file serves Unreal, Unity and three.js.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `buildGlb(document)` | `BuildingDocument` | `{ glb, scene, supports, stats }` |
| `validateGlb(bytes)` | GLB bytes | `{ errors, warnings, infos }` from the Khronos validator |

`stats` is `{ meshes, nodes, triangles, materials, bytes }`, the numbers worth watching in CI. `supports` is
what each section rests on, from `#check`, passed through so a caller can report a cantilever. `validateGlb`
is a separate call: `buildGlb` builds and proves the bytes, the caller decides what to do with the report.

## How the file is shaped

- One mesh per section, one node per section. A section repeats one floor design, so a 40 floor tower costs
  one section of geometry however many floors it stacks.
- A section sinks 1 cm into the one below, so no two faces share a plane and nothing flickers along a junction.
- Nodes only translate up. Nothing is scaled, nothing is mirrored, so every transform keeps a positive
  determinant and no importer has to guess about winding.
- Three materials: `facade` and `glass` share the generated facade texture (colour and emissive) from
  `#materials`, so a drawn window and a cut one are the same window; `roof` is a plain grey. The texture is
  seeded from the building's name, so every building gets its own and the same name rebuilds the same one.
- `extensionsRequired` is empty. A file that requires an extension Unreal lacks does not load at all.

## Proofs before the write

Per building:

1. The bottom section is `main` and the top one is `roof`, so the building has an underside and a deck.
2. Every section lands on the one below (`#check`).

Per section, over what it builds and everything it wears:

3. Every stored normal agrees with its triangle's winding, and no triangle is degenerate.
4. The section is a closed shell with positive volume: no open edge, no unbalanced edge, nothing inside out.
5. Nothing it wears is buried: every part reaches at least 5 cm out of the section at its own height.
6. It stays inside its triangle budget: 120 a floor `flat`, 1200 `light`, 4000 `full`, and 4500 for a whole
   roof, which is judged as one section rather than per floor.
7. Nothing has drifted off it: no part reaches more than 3 m past the footprint or 12 m above the top.

Any failure throws instead of writing a file. The Khronos validator runs after, on the bytes, through
`validateGlb`; it reads structure, not geometry, which is why the seven above exist.

## Errors

`E_GLB_INVALID` (a section is open or lit the wrong way round, a material is missing, or the validator found
an error), `E_STACK_ENDS` (no main at the bottom, no roof on top), `E_OVERLAP` (a part is buried),
`E_BUDGET` (a section costs more than its tier allows), `E_FLOATING_PART` (a part has drifted off the
section), plus whatever `#check`, `#kit` and `#assemble` raise.

## Not here yet

Export profiles per engine, LOD chains, instancing. One plain file, one detail level.

## Depends on

`#spec`, `#assemble`, `#kit`, `#check`, `#materials`.
