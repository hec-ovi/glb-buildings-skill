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

| part | what it is | how much room |
| --- | --- | --- |
| `unit` | an air conditioning box, low and wide | one cell |
| `vent` | a round vent stack | one cell |
| `turbine` | a flat round turbine with a hub and blades | one cell |
| `pipe` | a pipe that bends over and drops to the level below | one cell, and it reaches past the edge |
| `panel` | a solar panel on short legs | one cell |
| `mast` | a mast with harness rings and spikes | one cell, 9 to 21 m tall |
| `tank` | a water tank on four legs | keep the four cells around it clear |
| `tower` | a small tower, the skyscraper on the skyscraper | keep the four cells around it clear |

`--turn` is degrees, for the parts that point somewhere: a pipe, a panel, a unit, a tower.

## Composing one

Think in rows and clusters, not in scatter.

- **One tall thing.** A mast or a tower, not both, unless the building is enormous. Put it off centre.
- **A row of the same part** reads as plant: `place turbine C2 C3 C4` beats three turbines in three corners.
- **Pipes go near an edge**, because they drop past it. `place pipe A2 A3` on the north edge looks like the
  building is plumbed; a pipe in the middle of the deck looks lost.
- **A tank wants space.** Give it a corner and leave its neighbours empty.
- **Leave half the deck empty.** A roof that is full reads as noise. Six to ten parts on a 20 x 16 m deck is
  plenty.

## When you want it filled fast

`buildings set-band <roof> --clutter 0.5` fills free cells with a seeded mix and adds the edge railing.
Anything you placed by hand stays where you put it, so the usual order is: clutter first for the base layer,
then `place` the two or three parts that make this roof different.

Each building's arrangement is seeded from its section name, so no two roofs come out the same and a rebuild
never reshuffles the one you have.
