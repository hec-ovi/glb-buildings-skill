# preview

Shows a building to a human and carries what they picked back to the CLI. A local server serves the viewer,
the placed scene and the built GLB; the viewer draws a blueprint over the model, and every click or dragged
rectangle lands in `selection.json`.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `new PreviewServer(options)` | see below | server |
| `server.start()` | | the URL, once it is listening |
| `server.url` | | where it is serving |
| `server.close()` | | resolves when the port is free |
| `new Project(dir)` | project folder | reader and writer for that folder |
| `project.readDocument()` | | `BuildingDocument` |
| `project.readSelection()` | | `Selection`, empty when nothing was picked yet |
| `project.writeSelection(sel)` | selection without a timestamp | the stored selection, stamped |
| `watchTree(root, onChange)` | a folder, a callback | a function that stops watching |

`PreviewOptions` is `{ dir }` for one fixed project, or `{ resolve, watchRoot }` to follow whichever project
is current: `resolve` runs per request, `watchRoot` is the tree whose changes trigger a reload. Add
`projects` (`list`, `current`, `use`, `dirOf`) to let the page navigate between buildings, and `remove` on
top of those to let it delete one. `port` defaults to
4321, `host` to 127.0.0.1, and `log` prints one line per request.

## The project folder

```
building.json      the document
build/model.glb    the built file, when there is one
selection.json     what the human last picked
```

## HTTP

| Route | Gives |
| --- | --- |
| `GET /` | the viewer page |
| `GET /viewer.js` | the bundled viewer |
| `GET /api/ping` | a line, so a server that is up can be told from a page that will not load |
| `GET /api/health` | whether it can do its job: the document, a built file, the page bundle, the watcher. 503 when not |
| `GET /api/scene` | `{ document, scene, hasModel }` |
| `GET /api/model.glb` | the built file, or 404 before the first build |
| `GET /api/selection` | the current selection |
| `POST /api/selection` | stores it, stamps `at`, gives it back |
| `DELETE /api/projects` | takes a building away and moves to whatever is left. Only when the caller passed `remove` |
| `GET /api/projects` | `{ projects, current }`, one `ProjectCard` per building (name, brief, floors, sections, height, what it reads as, whether it is built) |
| `POST /api/projects` | `{ name }` makes that building current |
| `GET /api/events` | server sent events, `changed` when the document or the build file changes |

Failures answer 400 with the `BuildingError` shape: `{ code, message, at }`.

## The viewer

Two panels around the stage. `Models` down the side is the navigator, `Bar` along the bottom is the building
that is open.

**Models.** One row per building: its name, whether it is built, its floors, sections and height, the brief
it was asked for in the words it was asked in, and the line `describeBuilding` reads off its document. The
open one carries the accent. Clicking a row makes that building current, for the page and for the CLI alike.
The foot counts what the store holds.

**Bar.** Three columns. The building's name, its size spoken, the brief it was asked for, and under them the
two things you can do to the whole building: **download** over **delete**, labels right against their icons.
Delete arms on the first click and reads `sure?`, so the one action that cannot be undone takes two.
Download hands over the built file as `<name>.glb` and is offered only once a build exists.

Then **one** section at a time with arrows to step through them; then the view and what is selected, which
are the same question asked twice. The section on screen is brought forward in the drawing and the rest
fade, so the name in the bar and the part of the building it means are obviously the same thing. That
marking is off in `final`, which draws nothing over the building.

A click selects the bay under the cursor; **shift and drag** marks a zone, taking every bay whose centre is
inside the rectangle and whose face turns toward the camera, so the far side is never caught. The gesture
decides, so there is no mode to remember.

**View** is three ways to look at the same building:

| view | what is on screen |
| --- | --- |
| `blueprint` | the drawing on its own: bay panels and section outlines, no model |
| `model` | `build/model.glb` with the section outlines over it, panels hidden so the two never fight over depth |
| `final` | the building on its own, nothing drawn over it. What the file actually looks like |

Section outlines are coloured by kind, amber for `main`, cyan for `bulk`, pink for `custom`, green for
`roof`. None of it is in the exported file.

**The stage.** Hold left to pan, hold right to orbit, wheel to zoom; W A S D move, Q E turn, R F rise and
fall. A turn swings around whatever the camera is looking at, so panning first is how you choose what to
orbit. Only the primary button picks, so driving the camera never changes the selection. The blueprint is
instanced, one draw per section, so a 40 floor tower stays interactive. Evening light, so a dark facade stays
dark and its lit windows are the brightest thing on it. Anything brighter than a lamp bleeds into the air
around it: neon, lit windows and the highlights of a screen, and nothing else, which is what keeps the
picture on a screen a picture rather than one glowing rectangle.

`?building=<name>` opens the page straight onto one, which is what makes a link worth sharing. It is honoured
once, on the first load, so switching afterwards is not fought by the address bar.

The page reloads its scene when the document changes on disk, keeping the camera and the selection where they
were. Opening another building from the navigator is the exception: it frames the new one whole. Every failure is written into the bar, so a browser without WebGL or a document that will not parse
shows a sentence instead of a blank page.

## The selection

```jsonc
{
  "mode": "zone",
  "at": "2026-08-06T13:40:11.284Z",
  "bandIds": ["body"],
  "floorIds": ["body.f3"],
  "bayIds": ["body.f3.S1", "body.f3.S2"],
  "box": { "min": [-9000, 9600, 6800], "max": [-3000, 12800, 7000] }
}
```

`box` is in the section's own frame, in millimetres. The ids are what the CLI acts on.

## Errors

`E_DOC_INVALID` and `E_DOC_VERSION` from reading the document. The viewer shows the message in its panel.

## Invariants

- A stored selection always carries the server's timestamp, never the client's.
- The viewer never writes the document; it reads the scene, posts selections, and switches which building is
  current.
- Bay ids in a selection exist in the scene the viewer was showing.
- A building whose document will not parse still gets a row in the navigator, carrying the reason.
- Nothing in the page is rounded.

## Depends on

`#spec`, `#assemble`.
