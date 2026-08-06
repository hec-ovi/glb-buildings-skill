# Index

Start here. Open one box, read its `CONTRACT.md`, change its folder, run its tests.

| Need | Read |
|---|---|
| Hector's raw idea | [IDEA.md](IDEA.md) |
| Every request, raw and in order | [REQUIREMENTS.md](REQUIREMENTS.md) |
| How the whole thing fits together | [ARCHITECTURE.md](ARCHITECTURE.md) |
| What it is built on and why | [DECISIONS.md](DECISIONS.md) |
| Build order and what is left | [PLAN.md](PLAN.md) |
| Installing the CLI and the skill | [INSTALL.md](INSTALL.md) |

## Boxes

| Box | Purpose | Depends on |
|---|---|---|
| [`spec`](../boxes/spec/CONTRACT.md) | The building document: bands, floors, bays, the selection, integer millimetres, the closed error set | none |
| [`assemble`](../boxes/assemble/CONTRACT.md) | Document to placed scene: transforms, bays, seams | `spec` |
| [`kit`](../boxes/kit/CONTRACT.md) | The parts. Floor templates build geometry in metres, with the winding and normals engines expect | `spec` |
| [`glb`](../boxes/glb/CONTRACT.md) | Placed scene to GLB, then the shell proof, the budget and the Khronos validator | `spec`, `assemble`, `kit`, `check`, `materials` |
| [`preview`](../boxes/preview/CONTRACT.md) | three.js blueprint, click picking, drag zones, and the server that carries a selection back | `spec`, `assemble` |
| [`cli`](../boxes/cli/CONTRACT.md) | Named projects and the verbs an agent calls | every box above |
| [`skill`](../skills/glb-buildings/SKILL.md) | What an agent reads instead of the code: a resolver and four fat parts. `SKILL.md` is its contract | `cli` |
| [`materials`](../boxes/materials/CONTRACT.md) | Textures written from code: the window grid a facade carries, colour and emissive | none |
| [`check`](../boxes/check/CONTRACT.md) | The proofs on the document: what rests on what, and by how much | `spec`, `assemble` |

Edges run one way. `cli` is the only box that touches several: it is the agent's face onto all of them. A box
reaches another only through the `imports` map in `package.json` (`#spec`, `#kit`, and so on), so a deep import
is not expressible.

```bash
npm install
npm test                         # every box, one pass
node boxes/cli/bin/buildings.ts help
npm link && buildings new tower-a && buildings build && buildings preview
```

## Cross-cutting

| Thing | Where |
|---|---|
| The closed error set | `boxes/spec/errors.ts` |
| Units, grid and rounding rules | `boxes/spec/units.ts` |
| The CLI entry point | `boxes/cli/bin/buildings.ts` |
| The preview entry point | `boxes/preview/bin/preview.ts` |
| Skill copy at the root, and its drift check | `scripts/sync-skill.ts`, `boxes/cli/test/skill.test.ts` |
| Research findings behind the design | `.research/INDEX.md` (local, not committed) |

## Surfaces

| Surface | Where |
|---|---|
| The agent's instructions (canonical) | `skills/glb-buildings/SKILL.md` plus `parts/` |
| Root skill copy, for a plain checkout | `SKILL.md` (synced) |
| Claude Code plugin and marketplace entry | `.claude-plugin/` |
