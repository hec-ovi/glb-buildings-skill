# Plan

Build order, box by box. Each milestone ends with a file you can open in an engine.

## 1. The fake building end to end

`spec`, `kit` (flat box bay only), `assemble`, `glb`, `cli new` and `cli build`.

Output: an all `flat` tower, one material, one mesh reused per band, that opens in Unreal, Unity and three.js
and passes the Khronos validator. This is the whole low poly product, and it is the spine everything else hangs
from.

## 2. The proofs

`check`: support, overlap, envelope, human size table, seam match, triangle budget. Wired into `cli build` as a
gate, so nothing gets written until it passes.

## 3. Real floors

`kit` grows the parts that carry detail: window, door, frame, sill, balcony slab, railing, landing, awning, AC
unit, wire, cornice, roof cap. Main floor and roof become their own templates. `light` and `full` tiers.

## 4. Materials

`materials`: Hector's images become texture sets, packed into one atlas per building family, with baked UVs and
real world texel density.

## 5. The preview

`preview`: three.js viewer, blueprint overlay with metres, click picking, drag rectangle zones, and the local
server that carries the selection back to the CLI.

## 6. The agent

`skill`: the resolver and the fat sub-skills, plus the auto walk with a gate at every step, so one description
produces a finished building.

## Later

LOD chains as export output, Unreal collision meshes, second UV set for lightmaps, city scale batch export.
