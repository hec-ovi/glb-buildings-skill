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
| `add-band <id> --kind --tier --template --floors [--height] [--inset] [--rotation] [--after id\|--before id]` | put a band into the stack |
| `set-band <id> [same flags]` | change a band |
| `remove-band <id>` | take a band out |
| `build [name]` | write the GLB, validated |
| `preview [name] [--port 4321]` | open the blueprint editor and stay up |
| `selection [name]` | what the human last picked in the preview |

Lengths on the command line are **metres**. Rotation is degrees.

## What a building is

A stack of **bands**, bottom to top, over one rectangular footprint. A band repeats one floor N times, so a
40 floor tower costs one floor of geometry in the file.

- `kind` says what the band is for: `main` (the ground floor), `bulk` (the repeated middle), `custom` (a floor
  that is different), `roof` (the crown).
- `tier` says how much geometry it carries: `flat` (a fake floor, windows live in the texture), `light` (bulk
  with shallow relief), `full` (real balconies, doors, landings).
- A whole building may be `flat` top to bottom. That is a real product, not a degraded one, and it is what
  fills a city.

## Rules that keep files openable

- Bands stack when their seams match. `show` tells you: `stacksOnBelow`. A band with an `inset` changes its
  seam, so it needs a transition band or it will not close.
- The building must close into one shell: a `main` band at the bottom (it carries the underside) and a `roof`
  band at the top (it carries the deck). `build` refuses otherwise, and says where.
- Setbacks (`--inset`) and turns (`--rotation`) do not stack yet: the kit has no transition part, so a band
  that is inset or turned leaves the shell open and `build` refuses. Keep both at 0 and say so rather than
  building something that fails.
- Keep the file plain: no compression extensions, one UV set, metres, Y up. The CLI already does this; do not
  ask for anything else.

## Never read the source

`buildings help`, `buildings show` and the error messages are the whole surface. Reading the repository's code
is never part of the job, and neither is editing any file: the verbs write everything.

## When a verb fails

Relay the `code` and `message`, fix the one thing it names, run the verb again. Do not work around a failure by
editing files, and do not run `build` in a loop hoping it changes.
