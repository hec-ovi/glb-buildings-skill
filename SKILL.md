---
name: glb-buildings
description: Generate building GLBs for Unreal Engine, Unity and three.js by editing a named project through the `buildings` CLI. Stacks of floor bands become one validated glTF file, cheap enough to place by the thousand, with a blueprint preview the human can click. Use whenever the user wants to create, edit, rebuild or preview a building, a tower, a facade, a city block, or a GLB of any structure.
---

# glb-buildings (resolver)

Build and edit buildings by calling ONE CLI: `buildings <verb>`. Never write `building.json` by hand, never
edit the repo. Every action is a verb, and every verb answers with one JSON object.

Match the request to a row, open the file it names (next to this one), then run the verbs.

| The user wants | Read |
| --- | --- |
| a building from a description, start to finish | `parts/auto.md` |
| to shape the stack: floors, heights, setbacks, the roof | `parts/stack.md` |
| to change what is already there, using what they clicked in the preview | `parts/editing.md` |
| to break up a run of identical floors | `parts/enhance.md` |
| to lay out a roof: turbines, pipes, tanks, masts | `parts/roof.md` |
| sizes that look right: floor heights, doors, guards, bays | `parts/dimensions.md` |

## Always

0. **Set up once, if the home is not writable.** `buildings new <name> --here` keeps projects in a
   `.buildings` folder next to your work, which is what a sandboxed agent needs. Every later verb finds it on
   its own, with no environment variable to repeat. `buildings show` prints the `home` it is using.
1. **Know which building you are editing.** `buildings list` shows the projects and the current one.
   `buildings new <name>` starts one and makes it current; `buildings use <name>` switches. Every other verb
   works on the current project, so you say the name once.
2. **Read before you write.** `buildings show` prints the stack band by band with heights, seams and whether
   each band stacks on the one below.
3. **Build to check your work.** `buildings build` writes the GLB and runs the Khronos validator. A build that
   answers `"ok": false` did not write a file; fix what the message says and build again.
4. **Report the file path and the numbers** (floors, height, triangles) when you are done.

## The verbs

Run `buildings help` for the current list. Today:

| Verb | What it does |
| --- | --- |
| `new <name> [--width 18] [--depth 14] [--floors 14]` | start a building, in metres, and make it current |
| `list` | every building, and which is current |
| `use <name>` | switch the current building |
| `show [name]` | the stack band by band |
| `templates` | the floor templates the kit can build |
| `add-band <id> --kind --tier --template --floors [--height] [--width] [--depth] [--inset] [--shift-x] [--shift-z] [--rotation] [--twist] [--taper] [--wires] [--after id\|--before id]` | put a section into the stack |
| `set-band <id> [same flags]` | change a section |
| `remove-band <id>` | take a section out |
| `enhance [floorId ...] [--style ledge\|notch\|twist\|taper\|cables] [--side S]` | give one floor a shape of its own, so a section stops being uniform. With no floor named it uses what the human picked |
| `deck [section]` | the roof as a grid of cells, what stands in each, and the parts you can use |
| `place <part> <cell ...> [--section id] [--turn 45]` | put a part in one or more cells |
| `unplace <cell ...> [--section id]` | clear cells |
| `build [name]` | write the GLB, validated |
| `preview [name] [--port 4321]` | open the blueprint editor and stay up |
| `selection [name]` | what the human last picked in the preview |

Lengths on the command line are **metres**. Rotation is degrees.

## What a building is

A stack of **sections**, bottom to top: a base, some floors, a roof. A section is the design unit. It repeats
one floor N times and owns its own footprint, so a 40 floor tower costs one section of geometry per design, and
anything special (a twist, a cantilever, cables crossing floors) belongs to one section and stops there.

- `kind` says what the section is for: `main` (the base), `bulk` (the repeated middle), `custom` (a section
  that breaks the rhythm), `roof` (the crown).
- `tier` says how much geometry it carries: `flat` (walls, everything else in the texture), `light`, `full`.
- Shape it with `--width` `--depth` (its own footprint), `--shape box\|round` (a round section is a cylinder),
  `--inset` (step in, or out with a negative), `--shift-x` `--shift-z` (slide), `--rotation` (turn), `--twist`
  (turn across the section), `--taper` (pull in toward the top).
- Dress it with `--greebles 0.4` (fake parts standing off the faces, which is what stops a bulk section
  reading as a box), `--columns corners\|ribs\|partial` (uprights), `--balconies S` (a slab with a rounded
  front, one per floor), `--wires S` (cables up one face).
- A whole building may be `flat` top to bottom. That is a real product, not a degraded one, and it is what
  fills a city.

## Rules that keep files openable

- **Support is the friction.** A section has to land on the one below. `build` reports what each one rests on;
  under 20%, or with its middle out past the edge, it is refused and named. Slide it back, widen what is under
  it, or make it smaller.
- A **cantilever** (under half of it resting) is allowed and is often the point. Say so when you report.
- A section that is bigger in plan than the one under it is reported as `wider than it`. Fine for a platform,
  wrong for a tower: keep sections narrowing as they rise unless the user asked otherwise.
- `--inset` steps in from the section's own footprint, so `--width 12 --inset 2` gives 8. Use one or the other.
- The stack needs a `main` section at the bottom and a `roof` section on top. `build` refuses otherwise.
- Keep the file plain: no compression extensions, one UV set, metres, Y up. The CLI already does this; do not
  ask for anything else.

## Never read the source

`buildings help`, `buildings show` and the error messages are the whole surface. Reading the repository's code
is never part of the job, and neither is editing any file: the verbs write everything.

## When a verb fails

Relay the `code` and `message`, fix the one thing it names, run the verb again. Do not work around a failure by
editing files, and do not run `build` in a loop hoping it changes.
