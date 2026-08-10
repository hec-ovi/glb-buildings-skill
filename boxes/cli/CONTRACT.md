# cli

The verbs an agent calls. Named projects on disk, one of them current, and one JSON object out of every verb.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `run(argv, projects?)` | the words after `buildings` | `Answer`: `{ ok: true, verb, ...data }` or `{ ok: false, code, message, at }` |
| `new Projects(root?)` | a projects root | the store |
| `projects.remove(name)` | a name | takes that building away, with its build and its last pick |
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

./textures/<style>/         generated images (visible next to the work), `<finish>_<n>.jpg`
./textures/<style>/pack.json  what each picture holds: `{"facade_2": {"across": 8, "down": 4}}`
./textures/<style>/ads/     pictures for screens, passed to `screen --image` by path
```

Nothing has to be put there by hand. `add-texture` names the file, pairs `-emissive`, picks the next free
variant number and writes `pack.json`, which is the part that goes wrong when a folder is filled by hand. It
refuses a finish that is a light (`neon`, `beacon`): a flat colour emitting that colour is the whole material
and a picture of one would never be read.

The home is the first of these that applies: `BUILDINGS_HOME`, a `.buildings` folder in the current directory,
then `~/.glb-buildings`. Image packs live in a visible `textures/<style>/` next to the work when the home is
that hidden default, or under `<home>/textures` when the home is an explicit root (tests, a custom
`BUILDINGS_HOME`). `BUILDINGS_TEXTURES` overrides either. `new <name> --here` makes the middle home, which is
what an agent that cannot write outside its workspace uses: it says `--here` once and every later verb finds
the folder on its own. Every verb that opens a project reports the `home` it used.

A name is letters, digits, dash and underscore, up to 64 characters. `new` creates and selects in one step, so
a session names the building once and every later verb knows what it means.

## Verbs

| Verb | Does |
| --- | --- |
| `doctor [--port]` | whether this machine can build and preview: node, the home, the bundler, the service. Every failing check carries the command that fixes it |
| `link [name] [--port]` | the address that opens one building in the preview |
| `new <name> [--brief] [--width] [--depth] [--floors] [--style] [--textures] [--here]` | start a building, in metres, and make it current. `--here` is refused when `BUILDINGS_HOME` is set, since the two disagree about where to look |
| `style [modern\|cyber]` | which family of finishes the building wears, and what the pack for it holds |
| `textures [on\|off]` | whether the file carries its pictures, or flat colours an engine can replace |
| `add-texture <finish> [file] [--emissive] [--across --down] [--metres] [--dim] [--style] [--as]` | put a generated picture into a style pack: copies it in under the name the loader reads, pairs its emissive map, and records what grid it holds, how many metres it covers, or how far to drop it. With no file it declares a picture that is already there |
| `brief ["what it should be"]` | what the building was asked for; kept in the document and shown in the preview |
| `list` | every building, whether it is built, and which is current |
| `use <name>` | switch the current building |
| `remove <name>` | take a building away, with its build and its last pick. Named outright, never the current one by default |
| `show [name]` | the stack section by section: sizes, plan, what each wears, what it rests on |
| `templates` | the section templates the kit can build |
| `add-band <id> [flags]` | put a section into the stack, `--after` or `--before` another |
| `set-band <id> [flags]` | change a section; omitted flags keep what was there |
| `remove-band <id>` | take a section out |
| `enhance [floorId ...] [--style ledge\|notch\|twist\|taper\|cables] [--side S]` | split a run of identical floors so one of them has a shape of its own. With no floor named it uses the last pick |
| `face <section> [--side S] [--draw]` | the face as a grid of 10 cm cells, and what stands on it |
| `put <kind> <from> <to> [--section] [--side] [--material] [--depth] [--every 3]` | put a window, door, panel or balcony on a face, in cells |
| `put <kind> --row 9 --wide 1.4 --tall 1.5 [--every 3]` | the same from a shape: the face works out the columns, steps across on the pitch, and skips what is taken. Without `--every` a window or a panel takes the face's own bay, and a door or a balcony is placed once, centred |
| `clear [n ...] [--section] [--side] [--all]` | take elements off a face |
| `run <x,y,z> <x,y,z> [more ...] [--section] [--profile] [--thickness] [--material]` | a duct, pipe or cable along a path, mitred at every corner |
| `line <section> [--side] [--count] [--spacing] [--along] [--from] [--to] [--colours]` | lit lines climbing one face across many floors |
| `screen <section> [--side] --along --width [--from] [--to] [--stand] [--image]` | a screen standing off a face, spanning many floors, with its own picture |
| `crown [section] [--colour] [--off]` | a lit run round the top of a section |
| `unlight <section> [--lines] [--screens] [--all]` | take the lit parts off a section |
| `deck [section]` | the roof as a grid of cells, what stands in each, and the parts available |
| `place <part> <cell ...> [--section id] [--turn 45]` | put a part in one or more deck cells |
| `unplace <cell ...> [--section id]` | clear deck cells |
| `build [name] [--all]` | write the GLB, proved and validated, and report the numbers, plus `missing`: what is legal but almost certainly wrong, a building with no door or a wall picture with no lit windows. `--all` builds every building |
| `preview [name] [--port]` | start the preview service and stay up; answers with a link per building |
| `selection [name]` | what the human last picked |
| `help` | every verb with its usage |

Section flags: `--kind main|bulk|custom|roof`, `--tier flat|light|full`, `--template <id>`, `--floors <n>`,
`--height <m>`, `--width <m>`, `--depth <m>`, `--inset <m>`, `--shift-x <m>`, `--shift-z <m>`,
`--rotation <deg>`, `--twist <deg>`, `--taper <m>`, `--shape box|round`, `--segments <n>`, `--arc <deg>`,
`--bow NS`, `--corner <m>`, `--chamfer <m>`, `--greebles 0..1`, `--windows`,
`--columns corners|ribs|partial`, `--wires N|E|S|W`, `--clutter 0..1`.

What stands on a face is composed cell by cell with `face` and `put`, not with a section flag.

Lengths on the command line are metres; the document stores millimetres. Angles are degrees.

`--project <name>` works on every verb and pins that line to one building whatever is current. Without it a
verb follows the current project, which is right for a person and wrong for anything running beside something
else: two sessions sharing a store would otherwise edit each other's work, and the preview page changes the
current project when somebody clicks a row.

## Invariants

- Every verb answers with exactly one JSON object, and a failure carries a code from the closed set.
- `--project` pins a line to one building and never changes which one is current.
- Every write goes through `parseDocument`, so a verb cannot leave an invalid document on disk.
- Every flag `add-band` and `set-band` accept, `show` reads back, so nothing an agent sets is write only.
- No path from a home directory is baked in: the root comes from `BUILDINGS_HOME`, `.buildings` or the OS home.

## Errors

`E_DOC_INVALID` (bad flags, unknown project, unknown section, a port already in use),
`E_BAND_ID_DUPLICATE`, `E_UNKNOWN_TEMPLATE`, `E_GLB_INVALID`, plus whatever the boxes below raise.

## Depends on

`#spec`, `#assemble`, `#kit`, `#glb`, `#preview`, `#check`, `#facade`.
