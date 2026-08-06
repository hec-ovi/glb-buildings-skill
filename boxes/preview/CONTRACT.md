# preview

Shows a building to a human and carries what they picked back to the CLI. A local server serves the viewer,
the placed scene and the built GLB; the viewer draws a blueprint over the model, and every click or dragged
rectangle lands in `selection.json`.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `new PreviewServer({dir, port?, host?})` | project folder, port (4321), host (127.0.0.1) | server |
| `server.start()` | | the URL, once it is listening |
| `server.close()` | | resolves when the port is free |
| `new Project(dir)` | project folder | reader and writer for that folder |
| `project.readDocument()` | | `BuildingDocument` |
| `project.readSelection()` | | `Selection`, empty when nothing was picked yet |
| `project.writeSelection(sel)` | selection without a timestamp | the stored selection, stamped |

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
| `GET /api/scene` | `{ document, scene, hasModel }` |
| `GET /api/model.glb` | the built file, or 404 before the first build |
| `GET /api/selection` | the current selection |
| `POST /api/selection` | stores it, stamps `at`, gives it back |
| `GET /api/events` | server sent events, `changed` when the document or the build file changes |

Failures answer 400 with the `BuildingError` shape: `{ code, message, at }`.

## The viewer

- Orbit, pan and zoom. The blueprint is instanced, one draw per band, so a 40 floor tower stays interactive.
- Bands are coloured by kind, floors are outlined, the panel lists every band with its tier and floor height.
- `mode: pick` selects the bay under the cursor. `mode: zone` drags a rectangle and selects every bay whose
  centre is inside it and whose face turns toward the camera, so the far side of the building is never caught.
- `model: on` loads `build/model.glb` over the blueprint.
- The page reloads its scene when the document changes on disk, keeping the camera where it was.

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

`box` is in the band's own frame, in millimetres. The ids are what the CLI acts on.

## Errors

`E_DOC_INVALID` and `E_DOC_VERSION` from reading the document. The viewer shows the message in its panel.

## Invariants

- A stored selection always carries the server's timestamp, never the client's.
- The viewer never writes the document; it only reads the scene and posts selections.
- Bay ids in a selection exist in the scene the viewer was showing.

## Depends on

`#spec`, `#assemble`.
