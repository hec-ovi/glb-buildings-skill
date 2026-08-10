# Composing a face

One section, one face at a time. You are not modelling anything: you name rectangles of cells and
the tool builds the geometry, so you never work out a size, a position or a corner.

## Where composing belongs

**The plain floors are already solved by the wall texture.** A `flat` section carries its windows,
its spandrels and its floor lines in the picture, for about eight triangles a floor. Composing
windows on top of that gives the wall two window systems that disagree, and costs a hundred times
as much for a worse result.

So the rhythm is: **four or five plain floors, then one composed floor**, and repeat.

```bash
buildings enhance body.f11 --style ledge          # lift one floor into its own section
buildings put balcony --row 2 --wide 4.5 --tall 1.3 --section body-e11
buildings put door --row 4 --wide 0.9 --tall 2.1 --section body-e11
```

`enhance` splits the run: the floors below keep the section id, the chosen floor becomes
`<section>-e<floor>` with a section of its own, and the floors above become `<section>-a<floor>`.
Compose on the middle one. The two plain runs stay flat and stay free.

That is where balconies, doors, deep reveals, screens and landing decks go: on the one floor that
is meant to be looked at. It is also what keeps a forty floor tower under a thousand triangles.

**A rhythm lines up with the texture on its own.** Leave `--every` out: the face steps its own bay,
which is the pitch the wall texture draws, and starts in the middle of the first one. What you
compose on the worked floor sits directly under the windows the plain floors draw. `buildings face`
prints the bay if you want to see it.

**A door and a balcony come one at a time.** A building has an entrance, not a row of them, and a
balcony on every bay is a motel. Both are placed once, centred, unless you ask for `--every`.

## Read the face first

```bash
buildings face body --side S
buildings face body --side S --draw     # the grid as text, top row first
```

It answers with the grid (`cols` by `rows`), what one cell is worth, what is already on the face,
and every kind and material you can use. **Never place anything before reading it.**

## The grid

A cell is **10 cm**. Column 0 is the left end seen from outside, row 0 is the floor. So a 3.2 m
floor is 32 rows, and a 12 m face is 120 columns.

Keep **1 cell clear** all the way round: nothing may touch the border.

The design belongs to the face, so **every floor of the section gets it**. Compose one floor and a
twenty floor section carries it twenty times for one mesh.

## Put something on it

```bash
buildings put window 12,9 19,23 --section body --side S
buildings put window 12,9 19,23 --section body --side S --every 3
buildings put balcony 20,2 45,14 --section ground --side S --depth 1.4
buildings put door 28,4 37,20 --section ground --side S
buildings put panel 60,12 80,20 --section body --side S --material screen
buildings clear 3 --section body --side S
```

**Two ways to place.** Prefer the first: say what the thing should be and let the face work out
where it goes.

```bash
buildings put window --row 9 --wide 1.4 --tall 1.5 --every 3 --section body --side S
```

`--row` is the row it stands on, `--wide` and `--tall` are metres, `--every` is the pitch in
metres. The face starts after the margin, steps across on that pitch, and **skips anything already
taken** rather than failing, so a rhythm steps over the section's own ribs on its own. The answer
says how many it placed and how many places it stepped over. You never count a column.

The second way names both cells outright, for one deliberate thing in one place:

```bash
buildings put door 28,4 37,20 --section ground --side S
```

**Both ends are included**, so `12,9` to `19,23` is 8 cells wide and 15 tall, which is 0.8 by 1.5 m.

`put` answers with what the section's faces cost a floor and what its tier allows, so you know
before the build whether the tier can carry what you are composing.

| Kind | What it is | Default material |
| --- | --- | --- |
| `window` | a pane set in the face | `window` |
| `door` | a pane reaching a floor, a way in or out | `door` |
| `panel` | a flat plate: cladding, a sign, a shutter | `concrete` |
| `balcony` | a slab standing out with a solid balustrade round its three open sides | `balcony` |

A balcony always builds its slab in `concrete`, whatever its balustrade is made of, because it is a slab.

| Material | What it looks like |
| --- | --- |
| `window` | glazing: a framed pane with a mullion |
| `door` | a door leaf, glazed over a solid panel, lit from the lobby behind it |
| `balcony` | a balustrade: a rail and the balusters under it |
| `concrete` | a flat cast panel: cladding, a slab, a dead wall |
| `metal` | plate: shutters, louvres, housings |
| `screen` | a lit screen, for signs and video walls |
| `pipe` | painted service pipe, with a flange and a marking band |
| `antenna` | galvanised steel with an aviation band |
| `neon` | a lit tube in a housing. Give it a colour: `neon:cyan`, `neon:#ff2f88` |

What each one actually looks like depends on the building's `style`: the same `concrete` is pale precast on
a `modern` tower and dark stained concrete on a `cyber` one. Run `buildings style` to see which family
this building wears.

## Sizes in cells

A cell is 10 cm, so a metre is 10 cells and these are just the real sizes counted out.

| Thing | Cells | Why |
| --- | --- | --- |
| floor to floor | 28 to 32 | 2.8 to 3.2 m |
| window sill | row 8 to 9 | 0.8 to 0.9 m off the floor |
| window head | row 22 to 24 | 2.2 to 2.4 m, under the slab |
| window width | 10 to 16 | 1.0 to 1.6 m, a curtain wall module |
| door | 9 wide, 21 tall | 0.9 by 2.1 m clear |
| balcony | 12 to 25 wide, 11 to 13 tall | 1.2 to 2.5 m of frontage, and the balustrade rises to the top of what you claim |
| bay pitch | 30 | 3 m, which is what `--every 3` steps |

## A balcony and the door onto it

A balcony fills the cells it claims: the slab sits on the bottom of them and the balustrade rises
to the top of them, so what you claim is what you get. It only holds its slab and its two side
rails, and leaves the middle open. That open middle is the space the door needs, so the two go
together and nothing else may sit on the rail:

```
. o x x x o .
. o x x x o .
. o o o o o .   <- the slab, which is the floor the door stands on
```

Put the balcony first, then the door starting on the row the slab reaches (2 above the balcony's
own bottom row). A door anywhere else has to start at row 1, on the building's own floor.

## Runs: ducts, pipes and cables

```bash
buildings run 5,20,7.3 5,6,7.3 3,6,7.3 --section body --profile round --thickness 0.25
```

Points are `x,y,z` in metres, in the building's own frame, and the run bends at every point
between. `--profile round` is a pipe, `square` is a duct or, thin enough, a wire. Corners are
mitred for you. A turn that doubles back is refused, with the point named.

**A run has to be outside the section it hangs on.** The building is centred on x and z, so an
18 by 14 m plan spans x -9 to 9 and z -7 to 7, and a pipe down its front sits at z just past 7.
A run inside the building is refused, and the message says exactly where that section stands.

## Rules that hold

- **Two things cannot share a cell.** A clash is refused and names both, so you never have to
  check for one yourself.
- **What the section already wears holds its cells.** `--columns` and `--wires` are built by the
  kit, not composed here, and the grid keeps their cells: `put` refuses a rectangle that lands on
  a rib or a cable run. Read the face with `--draw` first and compose in the bays between them.
  A rib stands every 3.5 m, so a rhythm on the face's own bay pitch never meets one.
- **Nothing reaches the border.** One clear cell all round.
- **Composing turns greebles off.** A section that carries anything on a face stops wearing scattered
  panel noise, since the two only fight. Keep greebles for the plain sections.
- **A tier is a budget.** `flat` is 120 triangles a floor, `light` 1200, `full` 4000. A window,
  door or panel costs 12 a floor and a balcony 48, so `light` carries about a hundred elements and
  `flat` carries none: move the section to `light` or `full` before composing it.
- Build when you are done with a face. `buildings build` proves the lot and reports the numbers.

## What good looks like

- **A rhythm, then one break in it.** Windows every 3 m across the whole face, then a balcony or a
  screen where the eye should land. All-different reads as noise.
- **The bottom two floors are seen and the rest is not.** Spend the elements on the `main`
  section, keep the bulk to a rhythm of windows.
- **Screens belong low and large**, on the street, not scattered up a tower.
