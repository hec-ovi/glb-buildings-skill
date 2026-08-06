# Editing what the human clicked

The preview is a blueprint of the current building. The human orbits it, clicks a bay or drags a zone, and that
pick lands where you can read it.

## Open it

```bash
buildings preview
```

It prints the URL and stays up, so run it in a second terminal or in the background. The page repaints itself
whenever you change the building, so the human sees your edits without touching anything.

## Read the pick

```bash
buildings selection
```

Comes back as:

```jsonc
{
  "mode": "zone",
  "bandIds": ["body"],
  "floorIds": ["body.f3"],
  "bayIds": ["body.f3.S1", "body.f3.S2"],
  "reads": "2 bays: body.f3.S1, body.f3.S2 | bands: body"
}
```

## What the ids mean

`body.f3.S2` is band `body`, its floor number 3 counting from the band's own bottom, side `S`, bay 2.

Sides: `S` faces +Z (the front, toward the default camera), `N` faces -Z, `E` faces +X, `W` faces -X. Bays run
along increasing X on N and S, increasing Z on E and W.

## Turning a pick into an edit

Today the kit edits whole bands, not single bays. So map the pick up to its band and act there:

| The human says, having picked | Do |
| --- | --- |
| "make these floors taller" | `set-band <bandId> --height <metres>` |
| "more floors like this" | `set-band <bandId> --floors <n>` |
| "this part should be plainer / heavier" | `set-band <bandId> --tier flat` or `--tier light` |
| "split this run" | `remove-band`, then two `add-band` calls with `--after` |
| "put a window / balcony / door here" | not in the kit yet. Say so plainly, and say what you can do instead |

Always rebuild after an edit so the preview and the file agree:

```bash
buildings build
```

## Do not

- Do not guess what was picked. Read `buildings selection` every time; it carries the server's timestamp.
- Do not edit `building.json`, `selection.json` or anything else on disk.
- Do not claim a bay-level change happened. Bay level editing arrives with the parts kit.
