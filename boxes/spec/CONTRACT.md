# spec

The vocabulary every other box speaks: the building document, the preview selection, units and the closed
error set. It holds no geometry and touches no files.

## Units

Whole millimetres, everywhere. Sizes, offsets and footprints compare exactly, so no tolerance has to be
tuned. Metres appear once, when a GLB is written, and in text shown to a human.

Axes: X east, Y up, Z south. Side `S` faces +Z and is the front of the building.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `parseDocument(value)` | anything parsed from JSON | `BuildingDocument`, normalised, defaults filled |
| `newDocument(name, {width, depth, floors})` | metres, floor count | a three section starting document |
| `bandFloorHeight(doc, band)` | document, band | the floor to floor height that band uses, mm |
| `parseSelection(value)` | anything parsed from JSON | `Selection` |
| `describeSelection(selection)` | selection | one line an agent can read |
| `partition(total, count)` | mm, count | whole millimetre parts summing back to `total` exactly |
| `bayCount(side, targetBay)` | mm, mm | how many bays fit, at least one |
| `toMetres(mm)` / `toMm(metres)` | mm / metres | metres / mm |

Schemas live in [`document.ts`](document.ts) (`documentSchema`) and [`selection.ts`](selection.ts)
(`selectionSchema`). Both are zod schemas, so the shape and the validator are the same object.

## Section and band

One word, two spellings. The design unit is a **section**: a run of floors that owns its shape, which is what
the docs and the skill call it. On disk and in the API it is spelled `band`: the document key is `bands`, the
type is `Band`, and the verbs are `add-band`, `set-band`, `remove-band`. Same thing throughout.

## The document

```jsonc
{
  "version": 1,
  "name": "tower-a",
  "footprint": { "kind": "rect", "width": 18000, "depth": 14000 },
  "grid": { "bay": 3000, "floorHeight": 3200 },
  "bands": [
    { "id": "ground", "kind": "main", "tier": "full",  "floors": 1,  "floorHeight": 4500, "template": "main-plain",   "windows": true },
    { "id": "body",   "kind": "bulk", "tier": "flat",  "floors": 12,                      "template": "bulk-flat",    "greebles": 0.4, "balconies": "S" },
    { "id": "crown",  "kind": "roof", "tier": "light", "floors": 1,  "floorHeight": 900,  "template": "roof-parapet", "deck": [{ "cell": "B3", "part": "tank", "turn": 0 }] }
  ]
}
```

Sections are listed bottom to top, and every field below `template` has a default, so the three lines above
are a whole building. `kind` says what the section is for (`main`, `bulk`, `custom`, `roof`), `tier` says how
much geometry it carries (`flat` is a fake floor whose windows live in the texture, `light` is bulk with
shallow relief, `full` carries real openings and parts). A building may be `flat` top to bottom.

| Field | What it does |
| --- | --- |
| `width`, `depth` | the section's own footprint, falling back to the building's |
| `shape`, `segments`, `arc`, `bow`, `corner`, `chamfer` | the plan it is drawn on |
| `inset`, `shiftX`, `shiftZ`, `rotation`, `twist`, `taper` | where it sits and how it moves as it rises |
| `windows`, `greebles`, `balconies`, `columns`, `wires` | what it wears |
| `clutter`, `deck` | what stands on it, when it is the roof |

A section's plan is `shape` (`box` or `round`) plus one way of rounding it: `corner` fillets a box's uprights,
`bow` bulges named faces of a box out into a round end (`"NS"`), `arc` sweeps part of a round instead of all
of it. Asking for two of them at once is refused rather than resolved, and so is asking for one the shape
cannot use.

## Errors

Every box throws `BuildingError` with a code from this set and nothing else:

`E_DOC_INVALID`, `E_DOC_VERSION`, `E_BAND_ID_DUPLICATE`, `E_FLOATING_PART`, `E_OVERLAP`, `E_STACK_ENDS`,
`E_BUDGET`, `E_UNKNOWN_TEMPLATE`, `E_GLB_INVALID`. `ERRORS` maps each to the sentence that says what it
means, and nothing throws a code outside the set.

Each carries `code`, a plain sentence, and `at`, the path where it happened.

## Invariants

- Every length in a parsed document is a whole millimetre.
- `partition(total, n)` sums to `total` exactly, for every `total` and `n >= 1`.
- Section ids are unique inside a document.
- A document that parses is a document that can be assembled.

## Depends on

Nothing.
