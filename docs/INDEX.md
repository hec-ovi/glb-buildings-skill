# Index

Start here. Open one box, read its `CONTRACT.md`, change its folder, run its tests.

| Need | Read |
|---|---|
| Hector's raw idea | `IDEA.md` (local, not committed) |
| Every request, raw and in order | `REQUIREMENTS.md` (local, not committed) |
| How the whole thing fits together | [ARCHITECTURE.md](ARCHITECTURE.md) |
| What it is built on and why | [DECISIONS.md](DECISIONS.md) |
| Build order and what is left | [PLAN.md](PLAN.md) |
| Installing the CLI and the skill | [INSTALL.md](INSTALL.md) |
| Generating the texture sets with an image model | [textures/PROMPTS.md](textures/PROMPTS.md) |
| Generating the ads that go on the screens | [textures/ADS.md](textures/ADS.md) |

## Boxes

| Box | Purpose | Depends on |
|---|---|---|
| [`spec`](../boxes/spec/CONTRACT.md) | The building document: sections, floors, bays, the selection, integer millimetres, the closed error set | `materials` |
| [`assemble`](../boxes/assemble/CONTRACT.md) | Document to placed scene: footprints, transforms, bays | `spec` |
| [`kit`](../boxes/kit/CONTRACT.md) | The parts. Section templates build geometry in metres, with the winding and normals engines expect | `spec`, `materials` |
| [`glb`](../boxes/glb/CONTRACT.md) | Placed scene to GLB, then the geometry proofs, the budget and the Khronos validator | `spec`, `assemble`, `kit`, `check`, `facade`, `materials` |
| [`preview`](../boxes/preview/CONTRACT.md) | three.js blueprint, click picking, drag zones, and the server that carries a selection back | `spec`, `assemble` |
| [`cli`](../boxes/cli/CONTRACT.md) | Named projects and the verbs an agent calls | every box above |
| [`skill`](../skills/glb-buildings/SKILL.md) | What an agent reads instead of the code: a resolver and eight fat parts. `SKILL.md` is its contract | `cli` |
| [`facade`](../boxes/facade/CONTRACT.md) | Faces as grids of 10 cm cells: what stands where on a wall, and the geometry it becomes | `spec`, `kit`, `materials` |
| [`materials`](../boxes/materials/CONTRACT.md) | The finish library: what every named surface looks like, in either family, drawn from code or read from a pack | none |
| [`check`](../boxes/check/CONTRACT.md) | The proofs on the document: what rests on what, and by how much | `spec`, `assemble` |

Edges run one way. `cli` is the only box that touches several: it is the agent's face onto all of them. A box
reaches another only through the `imports` map in `package.json` (`#spec`, `#kit`, and so on), so a deep import
is not expressible.

```bash
npm install
npm test                         # every box, one pass
npm run typecheck                # types, and anything left unused
node boxes/cli/bin/buildings.ts help
npm link && buildings new tower-a && buildings build && buildings preview
```

## Cross-cutting

| Thing | Where |
|---|---|
| The closed error set | `boxes/spec/errors.ts` |
| Units, grid and rounding rules | `boxes/spec/units.ts` |
| Triangle budgets per tier | `boxes/glb/writer.ts` |
| The finishes, the two families, and the two modes | `boxes/materials/finishes.ts`, `boxes/materials/styles.ts` |
| Where generated image packs live | `boxes/cli/projects.ts` (`textures`), `BUILDINGS_TEXTURES` |
| Where projects live on disk | `boxes/cli/projects.ts` |
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
