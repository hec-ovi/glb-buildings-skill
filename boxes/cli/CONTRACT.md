# cli

The verbs an agent calls. Named projects on disk, one of them current, and one JSON object out of every verb.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `run(argv, projects?)` | the words after `buildings` | `Answer`: `{ ok: true, verb, ...data }` or `{ ok: false, code, message, at }` |
| `new Projects(root?)` | projects root, default `BUILDINGS_HOME` or `~/.glb-buildings` | the store |
| `projects.open(name?)` | a name, or nothing for the current one | `{ name, project }` |

The binary is `boxes/cli/bin/buildings.ts`. It prints the answer as JSON and exits 1 when `ok` is false.

## Projects

```
$BUILDINGS_HOME/            default ~/.glb-buildings
  current                   the name of the building being edited
  projects/<name>/
    building.json           the document
    build/model.glb         the built file
    selection.json          what the human last picked in the preview
```

A name is letters, digits, dash and underscore, up to 64 characters. `new` creates and selects in one step, so
a session names the building once and every later verb knows what it means.

## Verbs

| Verb | Does |
| --- | --- |
| `new <name> [--width] [--depth] [--floors]` | start a building, in metres, and make it current |
| `list` | every building, and which is current |
| `use <name>` | switch the current building |
| `show [name]` | the stack band by band, with seams and whether each stacks on the one below |
| `templates` | the floor templates the kit can build |
| `add-band <id> [flags]` | put a band into the stack, `--after` or `--before` another |
| `set-band <id> [flags]` | change a band; omitted flags keep what was there |
| `remove-band <id>` | take a band out |
| `build [name]` | write the GLB, validated, and report the numbers |
| `preview [name] [--port]` | serve the blueprint editor, and stay up |
| `selection [name]` | what the human last picked |
| `help` | every verb with its usage |

Band flags: `--kind main\|bulk\|custom\|roof`, `--tier flat\|light\|full`, `--template <id>`, `--floors <n>`,
`--height <metres>`, `--inset <metres>`, `--rotation <degrees>`.

Lengths on the command line are metres; the document stores millimetres.

## Invariants

- Every verb answers with exactly one JSON object, and a failure carries a code from the closed set.
- Every write goes through `parseDocument`, so a verb cannot leave an invalid document on disk.
- No path from a home directory is baked in: the root comes from `BUILDINGS_HOME` or the OS home.

## Errors

`E_DOC_INVALID` (bad flags, unknown project, unknown band), `E_BAND_ID_DUPLICATE`, `E_UNKNOWN_TEMPLATE`,
`E_GLB_INVALID`, plus whatever the boxes below raise.

## Depends on

`#spec`, `#assemble`, `#kit`, `#glb`, `#preview`.
