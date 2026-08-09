# cli

The verbs an agent calls. Named projects on disk, one of them current, and one JSON object out of every verb.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `run(argv, projects?)` | the words after `buildings` | `Answer`: `{ ok: true, verb, ...data }` or `{ ok: false, code, message, at }` |
| `new Projects(root?)` | a projects root | the store |
| `projects.open(name?)` | a name, or nothing for the current one | `{ name, project }` |
| `home(cwd?)` | | the root the CLI would use from here |
| `VERBS` | | every verb with its name, summary and usage |

The binary is `boxes/cli/bin/buildings.ts`. It prints the answer as JSON and exits 1 when `ok` is false.

## Projects

```
<home>/
  current                   the name of the building being edited
  projects/<name>/
    building.json           the document
    build/model.glb         the built file
    selection.json          what the human last picked in the preview
```

The home is the first of these that applies: `BUILDINGS_HOME`, a `.buildings` folder in the current directory,
then `~/.glb-buildings`. `new <name> --here` makes that middle one, which is what an agent that cannot write
outside its workspace uses: it says `--here` once and every later verb finds the folder on its own. Every verb
that opens a project reports the `home` it used.

A name is letters, digits, dash and underscore, up to 64 characters. `new` creates and selects in one step, so
a session names the building once and every later verb knows what it means.

## Verbs

| Verb | Does |
| --- | --- |
| `new <name> [--width] [--depth] [--floors] [--here]` | start a building, in metres, and make it current. `--here` is refused when `BUILDINGS_HOME` is set, since the two disagree about where to look |
| `list` | every building, whether it is built, and which is current |
| `use <name>` | switch the current building |
| `show [name]` | the stack section by section: sizes, plan, what each wears, what it rests on |
| `templates` | the section templates the kit can build |
| `add-band <id> [flags]` | put a section into the stack, `--after` or `--before` another |
| `set-band <id> [flags]` | change a section; omitted flags keep what was there |
| `remove-band <id>` | take a section out |
| `enhance [floorId ...] [--style ledge\|notch\|twist\|taper\|cables] [--side S]` | split a run of identical floors so one of them has a shape of its own. With no floor named it uses the last pick |
| `face <section> [--side S] [--draw]` | the face as a grid of 10 cm cells, and what stands on it |
| `put <kind> <from> <to> [--section] [--side] [--material] [--depth] [--every 3]` | put a window, door, panel or balcony on a face, in cells |
| `clear [n ...] [--section] [--side] [--all]` | take elements off a face |
| `run <x,y,z> <x,y,z> [more ...] [--section] [--profile] [--thickness] [--material]` | a duct, pipe or cable along a path, mitred at every corner |
| `deck [section]` | the roof as a grid of cells, what stands in each, and the parts available |
| `place <part> <cell ...> [--section id] [--turn 45]` | put a part in one or more deck cells |
| `unplace <cell ...> [--section id]` | clear deck cells |
| `build [name] [--all]` | write the GLB, proved and validated, and report the numbers. `--all` builds every building |
| `preview [name] [--port]` | serve the blueprint editor, and stay up |
| `selection [name]` | what the human last picked |
| `help` | every verb with its usage |

Section flags: `--kind main|bulk|custom|roof`, `--tier flat|light|full`, `--template <id>`, `--floors <n>`,
`--height <m>`, `--width <m>`, `--depth <m>`, `--inset <m>`, `--shift-x <m>`, `--shift-z <m>`,
`--rotation <deg>`, `--twist <deg>`, `--taper <m>`, `--shape box|round`, `--segments <n>`, `--arc <deg>`,
`--bow NS`, `--corner <m>`, `--chamfer <m>`, `--greebles 0..1`, `--windows`,
`--columns corners|ribs|partial`, `--wires N|E|S|W`, `--clutter 0..1`.

What stands on a face is composed cell by cell with `face` and `put`, not with a section flag.

Lengths on the command line are metres; the document stores millimetres. Angles are degrees.

## Invariants

- Every verb answers with exactly one JSON object, and a failure carries a code from the closed set.
- Every write goes through `parseDocument`, so a verb cannot leave an invalid document on disk.
- Every flag `add-band` and `set-band` accept, `show` reads back, so nothing an agent sets is write only.
- No path from a home directory is baked in: the root comes from `BUILDINGS_HOME`, `.buildings` or the OS home.

## Errors

`E_DOC_INVALID` (bad flags, unknown project, unknown section, a port already in use),
`E_BAND_ID_DUPLICATE`, `E_UNKNOWN_TEMPLATE`, `E_GLB_INVALID`, plus whatever the boxes below raise.

## Depends on

`#spec`, `#assemble`, `#kit`, `#glb`, `#preview`, `#check`, `#facade`.
