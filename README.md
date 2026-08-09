# glb-buildings-skill

Procedural building GLBs for Unreal Engine, Unity and three.js.

A building is a JSON document of floor sections, not a mesh. You edit the ground floor and rebuild, and
nothing above it moves. What comes out is plain glTF 2.0: metres, Y up, one UV set, no extensions, one mesh
and one node per section.

It is three things that fit together, and you can use any one of them on its own:

| | what it is |
| --- | --- |
| **the toolkit** | `buildings`, a CLI. Every action is one verb that answers with one JSON object |
| **the service** | a local preview server, started by `buildings preview`. A three.js page on 127.0.0.1 |
| **the skill** | markdown an agent reads to drive the toolkit. No MCP, no plugin runtime: it shells out |

## Three drivers, two prompts

The same brief, handed to three different models, each driving the same CLI through the same
skill. Nothing was hand-modelled and no JSON was hand-edited: every one of these is verbs.

### Opus 5

> *"a tall futuristic tower that twists as it rises, lit screens at street level, a mast and dishes
> on the roof"*

![Opus 5 building the twisting tower](docs/showcase/opus5-spire.gif)

111 m, 5 sections, 34 composed elements, 5,512 triangles. A twisted run over a ribbed body, lit
screens on the street, a lattice mast and two dishes on the crown.

### Claude Haiku 4.5

> *"a six floor corner building with a glassy shop at street level, flats with balconies you can
> walk out onto above it, and plant on the roof"*

![Haiku building the corner block](docs/showcase/haiku-market.gif)

21.4 m, 3 sections, balconies down the south face, plant on the roof, 2,232 triangles. Read the
skill, ran 21 commands, one failed, recovered, done in about two and a half minutes.

### A local model, on one machine

> *"A tall, thin office tower with a tapering top and some balconies"*

![the local model building its tower](docs/showcase/local-spire.gif)

106 m, 5 sections, 14 composed elements, 4,340 triangles, validator clean. Built by
**gemma-4-26b-a4b-qat-q4** served locally on `llama.cpp`, driven by
[noob-cli](https://github.com/hec-ovi/noob-cli) with the skill dropped into `.noob/skills/`.
Note the brief: it was handed one and wrote its own, then built it.

## Benchmark

Two briefs, three drivers, isolated stores so nothing raced. Every file validator clean.

| driver | building | height | sections | elements | triangles | commands | failed | wall clock |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Opus 5 | spire-me | 111.1 m | 5 | 34 | 5,512 | ~30 | 1 | minutes |
| Opus 5 | market-me | 17.7 m | 3 | 18 | 2,856 | ~20 | 1 | minutes |
| Haiku 4.5 | spire-haiku | 82.6 m | 5 | 21 | 2,804 | 40 | 8 | 3m 28s |
| Haiku 4.5 | market-haiku | 21.4 m | 3 | 6 | 2,232 | 21 | 1 | 2m 28s |
| gemma-4-26b | spire-local | 105.9 m | 5 | 14 | 4,340 | — | — | ~35 min |
| gemma-4-26b | market-local | 18.2 m | 3 | 1 | 72 | — | — | ~35 min |

**What that says.** The toolkit and the skill run end to end on a local 26B model through
[noob-cli](https://github.com/hec-ovi/noob-cli), on one machine, with no cloud in the loop: it ran
`doctor`, read the answers, shaped a five section tower with a twist, composed a facade, laid out a
roof and produced a validated glTF file. It is slower and it gives up on detail sooner. Its weak
run stalled on cell arithmetic and shipped massing only, and said so plainly rather than pretending
it had not.

Every failure in that table taught the tool something. The benchmark is what found three real
defects: two sessions sharing one store could edit each other's buildings (now `--project`), a mast
could draw itself taller than the proof that keeps parts on a building (now capped), and placing
anything meant doing arithmetic against a grid you cannot see (now `put --row --wide --tall
--every`, where the face works out the columns and steps over what is taken). That last one is
aimed squarely at the small model.

## The agentic workflow

A building is not one prompt. It is two passes that never need each other in context:

**The architect** reads the description and settles the massing: the footprint, how many floors,
how the mass splits into sections, which one is the base and which the crown. It works in metres
and sections, and it builds once to prove the thing stands up before anyone draws a window. It
never looks at a facade.

**A facade job per section design** takes one section, reads its grid, and composes cells. It sees
its own 10 cm grid and nothing else. A forty floor tower is four to six of these jobs, not forty,
because a section repeats one floor design.

Then the roof, laid out as a floor plan of named cells, and the runs, which are paths of points.

Neither pass has to hold the other in its head, and the document on disk is the only seam between
them. That is what makes the work fit a small model: every context is a bounded, integer,
occupancy-checked space that refuses invalid input, so no pass has to review the pass before it.
The tool says no; the model does not have to be careful.

## Requirements

- **Node.js 24 or newer.** The CLI runs TypeScript directly, with no build step, which is a Node 24 feature.
  Check with `node --version`.
- **npm**, to install the four dependencies (glTF Transform, three.js, esbuild, zod).
- Nothing else. No GPU to build, no network, no service account, no database.

```bash
git clone https://github.com/hec-ovi/glb-buildings-skill
cd glb-buildings-skill
npm install
npm link            # puts `buildings` on your PATH
buildings doctor    # says whether this machine can build and preview
```

If `npm link` cannot write (it needs the npm prefix, often root), put a launcher on your own PATH instead, or
skip it and call `node boxes/cli/bin/buildings.ts` in place. Full routes are in [docs/INSTALL.md](docs/INSTALL.md).

## The toolkit

```bash
buildings new tower-a --brief "a glassy corner block with flats above a shop"
buildings set-band ground --height 4.5 --tier light --columns corners
buildings set-band body --floors 22 --height 3.0

buildings face body --side S                          # the face as a grid of 10 cm cells
buildings put window --row 9 --wide 1.4 --tall 1.5 --every 3   # it works out the columns
buildings put balcony 30,2 55,15 --section ground --depth 1.4  # or name the cells outright
buildings put door 38,4 47,20 --section ground

buildings place solar B2 --section crown
buildings build
```

`buildings help` lists every verb. `buildings show` prints the stack back, and every flag you can set comes
back out, so nothing is write only. Projects live in `~/.glb-buildings`, or in a `.buildings` folder beside
your work with `new --here`, or wherever `BUILDINGS_HOME` points.

## The service

```bash
buildings preview                  # or: npm run serve
buildings preview --port 5200      # any port you like
buildings link tower-a             # http://127.0.0.1:4321/?building=tower-a
```

A plain Node HTTP server on 127.0.0.1. It serves the viewer page, the placed scene, and the built file, and
it reloads the page when the document changes on disk.

The page is three panels: the **navigator** down the side lists every building you have, the **stage** draws
it, and the **bar** along the bottom says what it is, walks its sections one at a time, and hands you the
file. Three ways to look: `blueprint` is the drawing, `model` is the drawing over the built file, `final` is
the building on its own. Click a bay to select it, hold shift and drag to mark a zone, and either lands in
`selection.json` where the CLI reads it.

`GET /api/health` answers whether the service can do its job, so something watching does not have to load a
page to find out.

## The skill

The portable unit is [`skills/glb-buildings/`](skills/glb-buildings/): one `SKILL.md` resolver that routes an
intent to one of seven fat parts. An agent holds the resolver plus one part, never all of it.

Copy the folder into wherever your agent reads skills from, and it drives the CLI by shelling out. There is
no MCP server and no tool schema, so anything that can run a command can use it, including a small local
model.

## Faces are grids

Every face of a section divides into 10 cm cells. A window, a door, a balcony, a panel or a lit screen is a
rectangle of them, and an element claims the cells it stands on, so two of them can never overlap and nothing
is ever placed by coordinate. A cell is asked for by column and row and comes back on the real face, so a
section that twists, tapers or curves needs no special case.

A balcony keeps its slab and its two side rails and leaves the middle open, which is exactly the space the
door onto it needs:

```
. o x x x o .
. o x x x o .
. o o o o o .   the slab, which is the floor the door stands on
```

What the section already wears holds its cells too: a rib or a cable run is kept clear, so a panel cannot be
composed straight through an upright.

Ducts, pipes and cables are one builder: a path of points carrying a ring, mitred onto the plane bisecting the
two runs at every corner. The cross section holds the whole way, and a turn too sharp to mitre is refused with
the point named.

## Nothing is written until it is proved

Every section is measured before the file exists: it has to land on the one below, close into a solid with
positive volume, agree with its own normals, keep every part it wears reaching out of it and not drifting off
it, and stay inside the triangle budget its tier promises. Then the Khronos validator runs on the bytes.

That combination is what stops inverted roofs, invisible walls, buried balconies and files an engine silently
mangles.

## How it is built

Nine boxes, each a folder with a `CONTRACT.md` that is enough to use it without reading its code. Start
at [docs/INDEX.md](docs/INDEX.md).

`spec` holds the document and the closed error set, in whole millimetres so every comparison is exact.
`assemble` lays it out. `kit` builds the geometry, the runs and the roof parts. `facade` is the cell grid on
every face. `materials` writes the textures. `check` proves the stack. `glb` writes and proves the file.
`preview` is the service. `cli` is the toolkit.

```bash
npm test        # every box, one pass
npm run doctor  # can this machine build and preview
npm run serve   # start the preview service
```

MIT licensed.
