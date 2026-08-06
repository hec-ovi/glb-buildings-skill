# Shaping the stack

A band is a run of identical floors. Editing a building means editing bands.

## Look first

```bash
buildings show
```

Every band comes back with its `kind`, `tier`, `template`, `floors`, `floorHeight`, `inset`, `rotation`, its
`base` (how high it starts, in metres), its `seam`, and `stacksOnBelow`. Work from that, not from memory.

## The three verbs

```bash
buildings add-band <id> --kind bulk --tier flat --template bulk-flat --floors 6 --after body
buildings set-band body --floors 20 --height 3.0
buildings remove-band sky
```

- `--after <id>` and `--before <id>` place the new band in the stack. Without either it goes on top.
- Omitted flags keep what the band already had.
- Lengths are metres.

## Choosing kind and tier

| kind | use it for | tier that fits |
| --- | --- | --- |
| `main` | the ground floor, once, at the bottom | `full` |
| `bulk` | the repeated middle, most of the height | `flat` for background, `light` when it is seen close |
| `custom` | one floor that breaks the rhythm: a sky lobby, a plant floor | `light` or `full` |
| `roof` | the crown, once, at the top | `light` |

A building needs one `main` band at the bottom and one `roof` band at the top: they carry the underside and the
deck that close the shell. `build` refuses without them.

## Seams, setbacks and turns

A band publishes the footprint and bay counts it shows its neighbours. Two bands stack when those match, which
`show` reports as `stacksOnBelow`.

- `--inset 1.5` pulls a band in 1.5 m on every side. Its seam no longer matches the band below, so the shell
  opens and `build` fails. Setbacks need a transition, which the kit does not have yet: leave `inset` at 0
  until it does.
- `--rotation 15` turns a band. Same story: a turned band does not meet its neighbours yet.

Say this plainly to the user rather than building something that fails.

## Height

Total height is the sum of every band's `floors x floorHeight`. To make a tower taller, add floors to a bulk
band rather than stretching floor heights past what `parts/dimensions.md` allows.

## Keeping it cheap

- One band with 20 floors costs one floor of geometry in the file. Twenty bands of one floor cost twenty.
  Prefer few bands with many floors.
- `flat` is roughly 8 triangles a floor, `light` and `full` more. A background building should be `flat` all
  the way up.
- `buildings build` reports `triangles`, `meshes`, `nodes` and `materials`. Watch those numbers; a background
  building over a few hundred triangles is doing something it should not.
