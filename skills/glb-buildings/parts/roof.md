# Laying out a roof

The roof is the one part of a building nobody copies from the one next door, and it is where the silhouette
comes from. It is not modelled: it is a **floor plan**. The deck is a grid of two metre cells and you decide
what stands in each.

```bash
buildings deck                    # the grid, what is in it, and the parts you can use
buildings place turbine C3 C4     # two turbines, side by side
buildings place pipe B2 --turn 90 # a pipe that bends and drops to the level below
buildings unplace C4
buildings build
```

`deck` with no section works on the top of the stack. Pass `--section <id>` to dress a lower roof, which is
what a stepped building wants.

## The parts

**Plant**

| part | what it is | room |
| --- | --- | --- |
| `unit` | an air conditioning box, low and wide | one cell |
| `vent` | a round vent stack | one cell |
| `turbine` | a flat round turbine with a hub and blades | one cell |
| `pipe` | a pipe that bends over and drops to the level below | one cell, reaches past the edge |
| `solar` | rows of tilted panels on a frame, all facing one way | 2x2 block, `--turn` aims them |
| `tank` | a drum on a leg frame, with a cap, a ladder and its outlet | 2x2 block |
| `tower` | a small tower, the skyscraper on the skyscraper | 2x2 block |

**Antennas** — pick one kind per roof, or the building reads as a radio farm.

| part | what it is | room |
| --- | --- | --- |
| `mast` | a lattice mast drawing in to a spire, guyed down to the deck. 7 to 12 m, the tall one | 2x2 block |
| `array` | a sector array: a pole with three panels facing out, like every cell site | one cell |
| `dish` | a dish on its mount, tilted at the sky | one cell, `--turn` aims it |
| `whip` | a cluster of thin aerials at different heights | one cell |

A 2x2 part stands on a block: name its bottom left cell and the CLI claims the other three. It refuses a cell
that is already held and a block that runs off the deck, so parts cannot end up inside each other and `deck`
always shows the truth.

`--turn` is degrees, for the parts that point somewhere: a dish, a solar array, a pipe, a unit, a tower.

## Composing one

Think in rows and clusters, not in scatter.

- **One tall thing.** A mast or a tower, not both, unless the building is enormous. Put it off centre.
- **A row of the same part** reads as plant: `place turbine C2 C3 C4` beats three turbines in three corners.
- **Solar goes in a run, all one way.** `place solar B2 --turn 180` faces the array south; two blocks side by
  side read as an installation, one alone reads as a table.
- **Antennas cluster.** A `mast` with a couple of `whip` beside it, or three `dish` in a row along one edge,
  is what a real roof looks like. One of each scattered about is not.
- **Pipes go near an edge**, because they drop past it. `place pipe A2 A3` on the north edge looks like the
  building is plumbed; a pipe in the middle of the deck looks lost.
- **A tank wants space.** Give it a corner and leave its neighbours empty.
- **Leave half the deck empty.** A roof that is full reads as noise. Six to ten parts on a 20 x 16 m deck is
  plenty, and `place` tells you how full the deck is after every call. Past about half, stop.

## When you want it filled fast

`buildings set-band <roof> --clutter 0.5` fills free cells with a seeded mix and adds the edge railing.
Anything you placed by hand stays where you put it, so the usual order is: clutter first for the base layer,
then `place` the two or three parts that make this roof different.

Each building's arrangement is seeded from its section name, so no two roofs come out the same and a rebuild
never reshuffles the one you have.
