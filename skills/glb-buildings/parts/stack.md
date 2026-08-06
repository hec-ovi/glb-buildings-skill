# Shaping the stack

A building is sections stacked bottom to top. A **section** is the design unit: a run of floors that owns its
own footprint, its own shape and its own features. Anything unusual belongs to one section and stops there, so
you can give three floors a twist without touching the twenty below them.

## Look first

```bash
buildings show
```

Every section comes back with its `kind`, `tier`, `template`, `floors`, `floorHeight`, its footprint, its step,
slide, turn, twist and taper, its `base` (how high it starts, in metres) and what it rests on. Work from that,
not from memory.

## The three verbs

```bash
buildings add-band <id> --kind bulk --tier flat --template bulk-flat --floors 5 --after body
buildings set-band body --floors 20 --height 3.0
buildings remove-band pad
```

`--after <id>` and `--before <id>` place the new section in the stack; without either it goes on top. Omitted
flags keep what the section already had. Lengths are metres, turns are degrees.

## Shaping one section

| Flag | What it does |
| --- | --- |
| `--width` `--depth` | this section's own footprint, instead of the building's |
| `--inset` | step every side in by this much; a negative hangs the section out over the one below |
| `--shift-x` `--shift-z` | slide the section east or west, north or south |
| `--rotation` | turn the whole section about the building's axis |
| `--twist` | extra turn added across the section, so the mass turns as it rises |
| `--taper` | how much it pulls in by the time it reaches its top |
| `--wires` | cables climbing one face: `N`, `E`, `S`, `W` |
| `--floors` `--height` | how many floors and how tall each one is |

A section is built as the loft between the footprint it starts on and the one it ends on, closed at both ends,
sitting slightly into the section below. That is why a step, a slide, a 45 degree turn and a twist all work the
same way and none of them needs a transition piece.

## Support is the thing that matters

Every section has to land on the one below it. `build` measures it and tells you:

- **rests on 100%**: ordinary stacking.
- **cantilevers: only 40% lands**: allowed, and often what you want for a platform or an overhang. Say so when
  you report.
- **under 20%, or the middle hanging past the edge**: refused, with the section named. Slide it back with
  `--shift-x` or `--shift-z`, widen the section below, or make this one smaller.

So a wide base with a narrower tower on it works; a tower sliding off its base does not.

## Two traps

- **`--inset` applies on top of `--width`.** A section given `--width 12 --inset 2` ends up 8 wide. Use one or
  the other: `--width` to say the size outright, `--inset` to step in from what the section already had.
- **A building gets narrower as it rises.** If a section is bigger in plan than the one carrying it, `show` and
  `build` say `and is wider than it`. That is right for a deliberate platform or an overhang and wrong
  everywhere else: a tower that widens toward the top reads upside down. Check the line before you report.

## Base, bulk, top

The three parts of a building do different jobs, and mixing them up is what makes a tower look wrong.

- **The base** carries weight: taller floors, often wider, `--columns corners`.
- **The bulk** is repetitive on purpose. It is meant to be similar and fake: `--greebles 0.3` to `0.5` so it
  is not a bare box, `--columns ribs` or `partial`, `--balconies S`, and a step or two between runs. Do not
  make every bulk section different; two or three variations, repeated, is what reads as a building.
- **The top** is where the silhouette is made, and no two roofs should look the same. `--clutter` decides how
  much stands there: a railing and units from 0.2, a water tank from 0.25, a pole with its cable harness from
  0.35, solar panels and a small tower from 0.5. Each roof is seeded from its own section name, so two
  buildings never get the same arrangement. This is the one place to spend detail.

## Dressing a section

| Flag | What it adds |
| --- | --- |
| `--greebles 0.0 to 1.0` | fake parts standing off the faces: panels, vents, blank signage |
| `--columns corners\|ribs\|partial` | uprights: at the corners, every few metres, or only in gaps |
| `--balconies N\|E\|S\|W` | a slab with a rounded front, one per floor of the section |
| `--wires N\|E\|S\|W` | cables climbing one face, tying the section together |
| `--clutter 0.0 to 1.0` | on a roof section: edge railing, mast with harness rings and spikes, water tank on legs, AC units, solar panels, a utility pole with drooping cables, a small tower |
| `--shape round --segments 20` | the whole section becomes a cylinder |
| `--corner 0.6` | rounds the upright corners of the footprint, the way a chamfered box does |
| `--chamfer 0.25` | bevels the top and bottom edges, so they catch the light instead of reading as a hard line |

All of them are seeded from the section's name, so a rebuild keeps the same arrangement and an edit elsewhere
never reshuffles it.

`--corner` and `--chamfer` together are what stop a section reading as a raw box: a small fillet on the
uprights and a 0.2 to 0.3 m bevel top and bottom cost a handful of triangles and change the whole silhouette.
Use a larger corner on the base and smaller ones as the building rises.

## Reaching the look

- **Sections, not one extruded box.** Three to six sections make a building read as a building. Vary their
  height, footprint and step.
- **A ledge** appears wherever a section is narrower than the one below: the lower section's top shows around
  it. `--inset 0.6` on a section is the usual way to draw a horizontal line across a facade.
- **An overhang** is a negative inset, or a wider `--width` on the section above.
- **A platform** is a short section that is wide in one direction and shifted: `--floors 1 --height 1.2
  --width 22 --depth 8 --shift-z -3`.
- **A twisted crown** is `--rotation 45` on the roof section, or `--twist` across a mid section.
- **Cables** with `--wires S` cross the whole section, which is what makes a run of floors read as one piece.

## Keeping it cheap

- One section with 20 floors is one mesh. Twenty sections of one floor are twenty. Prefer few sections with
  many floors.
- A plain section is about 8 triangles a floor plus 4 to close it. `build` reports `triangles`, `meshes`,
  `nodes` and `materials`; a background building over a few hundred triangles is doing something it should not.
- Cables and turned masses cost more. Spend them on the sections that are seen.
