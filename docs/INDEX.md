# Index

Start here. Open one box, read its `CONTRACT.md`, change its folder, run its tests.

| Need | Read |
|---|---|
| Hector's raw idea | [IDEA.md](IDEA.md) |
| Every request, raw and in order | [REQUIREMENTS.md](REQUIREMENTS.md) |
| How the whole thing fits together | [ARCHITECTURE.md](ARCHITECTURE.md) |
| What it is built on and why | [DECISIONS.md](DECISIONS.md) |
| Build order and what is left | [PLAN.md](PLAN.md) |

## Boxes

| Box | Purpose | Depends on |
|---|---|---|
| [`spec`](../boxes/spec/CONTRACT.md) | The building document: bands, floors, bays, sockets, seams, in integer millimetres | none |
| [`kit`](../boxes/kit/CONTRACT.md) | The parts. Each one returns geometry, sockets, a collision box and material slots, at three detail tiers | `spec` |
| [`materials`](../boxes/materials/CONTRACT.md) | Texture sets to materials: atlas packing, baked UVs, real world texel density | `spec` |
| [`assemble`](../boxes/assemble/CONTRACT.md) | Document plus kit to a placed scene: world transforms, repeated bands, mesh reuse groups | `spec`, `kit` |
| [`check`](../boxes/check/CONTRACT.md) | The proofs: support, overlap, envelope, human proportions, seam match, triangle budget | `spec`, `kit` |
| [`glb`](../boxes/glb/CONTRACT.md) | Placed scene plus materials to a GLB per export profile, then the Khronos validator | `spec`, `assemble`, `materials` |
| [`preview`](../boxes/preview/CONTRACT.md) | three.js viewer, blueprint overlay, click picking, drag zones, and the local server that carries a selection back | `spec` |
| [`cli`](../boxes/cli/CONTRACT.md) | The verbs an agent calls, and the build walk with its gates | every box above |
| [`skill`](../boxes/skill/CONTRACT.md) | The resolver and the fat sub-skills an agent reads | `cli` |

Edges run one way. `cli` is the only box that touches several: it is the agent's face onto all of them. A box
reaches another only through the `imports` map in `package.json` (`#spec`, `#kit`, and so on), so a deep import
is not expressible.

## Cross-cutting

| Thing | Where |
|---|---|
| The closed error set | `boxes/spec/errors.ts` |
| Units, grid and rounding rules | `boxes/spec/units.ts` |
| Human size table | `boxes/check/rules/` |
| The CLI entry point | `boxes/cli/bin/buildings.ts` |
| Skill copies and the drift check | `scripts/sync-skill.ts` |

## Surfaces

| Surface | Where |
|---|---|
| The agent's instructions (canonical) | `skills/glb-buildings/SKILL.md` plus its sub-skills |
| Root skill copy, for a plain checkout | `SKILL.md` (synced) |
| Claude plugin | `plugins/glb-buildings/` (synced) |
