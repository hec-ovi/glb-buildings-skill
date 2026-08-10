# Walls: `facade`, `wall`, `base`, `glass-band`

Read `parts/textures.md` first: the five rules, the words to append, the negative prompt and the
family table are there and every skeleton below assumes them.

These four are the mass of the building. `facade` is the wall with its windows in the picture, and
it does most of the work: a forty floor tower is that one image and eight triangles a floor.

| Finish | What it is | Declare |
| --- | --- | --- |
| `facade` | the wall and its windows, lit | `--across <bays> --down <floors>` |
| `glass-band` | four or five floors of nothing but glazing | `--across <bays> --down <floors>` |
| `wall` | the same wall with **no windows in it**, for a floor you compose on | `--metres` if it is not 3 m |
| `base` | the street level, no windows, heavier and scarred | `--metres` if it is not 3 m |

## The grid, which is the thing that goes wrong

A wall picture holds a number of window bays across and a number of floors down. The kit lays one
row of the picture on each floor and one bay per 3 m of face, so it has to be told the real numbers:

```bash
buildings add-texture facade ~/out/facade.png --emissive ~/out/lit.png --across 10 --down 3
```

**Count them by eye off the picture you got, not off what you asked for.** Image models draw
whatever grid they feel like. Count the mullions across and the floor bands down. Get it wrong and a
picture of 10 columns is stretched over 8, or a picture of 3 rows is sliced by every floor line,
which is what makes the top and bottom of a section look cut.

Each picture is declared for itself, so a second wall may hold a different grid from the first. Say
`--across` and `--down` every time you install a wall and none of them can be wrong.

`wall` and `base` hold no grid. They tile by the metre, 3 m by default. A picture of brick is not
3 m of wall: count the courses, 21 courses at 75 mm is 1.6 m, and say `--metres 1.6` or every brick
comes out the depth of a door.

## Where the seam falls

Say it in the prompt, every time:

```
The picture starts and ends in the middle of a mullion, and in the middle of the solid band between
two floors, so where it repeats the join makes one whole mullion and one whole floor band and never
cuts a window in half.
```

For `wall` and `base`, which have no windows:

```
The picture starts and ends mid-material, with no feature crossing an edge and no change of tone
toward any edge, so where it repeats the join is invisible.
```

## `facade`: the skeleton

Fill the brackets from the family table in `parts/textures.md`.

```
Hyper realistic, extreme realism, photographic. Night photograph of [the family's wall: material,
finish, colour] seen dead flat-on with a 400mm telephoto, filling the frame. Eight window bays
across and four floors down, [the family's window: frame, glass, sill or reveal]. The windows are
NOT all the same: some lit, most dark, and the lit ones differ in colour, brightness and how much of
the pane is lit. [The family's interior: what is behind a lit window.] [Weathering: what fifty
metres up actually looks like.] Evenly detailed edge to edge, no feature centred. [Where the seam
falls.] Hyper realistic, hyper realism, extreme realist.
```

**The one thing to be emphatic about: not every window is lit and not every window is the same.**
A wall with every window on and every window identical reads as noise from any distance, and the
band of glass floors, the neon and the screen have nothing quiet to stand against.

## The quiet walls, `_2` `_3` `_4`

Generate `facade_1` busy, then three progressively shut down. A building picks between them from its
own name, so a street runs one lit tower to three calm ones on its own. This is the cheapest thing
you can do for a skyline.

**Generate each one from `facade_1` as an image reference, not from the text alone.** The reference
carries the mullion spacing, the spandrel bands, the metal, the glass tint and the grid, so the four
pictures are the same building at four times of night rather than four different buildings.

`_2` **the quiet one**, still has an emissive map:

```
[Same wall as the reference image: identical mullion spacing, identical spandrels, identical
materials and glass tint, identical grid of 8 bays across and 4 floors down, same telephoto, dead
flat-on.] Change one thing only: SWITCH THE WINDOWS OFF. Almost every window is dark, closed and
empty, holding only a faint reflection. NO lit rooms, NO desks, NO lamps, NO ceiling grids, NO
people, NO furniture, NO visible interiors anywhere except the few named here. Only three or four
windows in the whole picture carry light, and they are deliberately uneven: one run of two or three
side by side lit as a single bar, one lone window far from it, one dim sliver. Two whole zones, each
three bays wide and two floors tall, are completely dead. [Where the seam falls.]
```

`_3` **shut**: the same prompt with one change, only **one** window in the whole picture is lit and
every other pane has a blind or a curtain drawn across it, so nothing can be seen through the glass.

`_4` **all off**, and **no emissive map at all**: every light off, every pane dark, closed and empty,
no glow anywhere. The frames and the bands catch a little ambient light so the wall is still
readable as a surface rather than a void. Install it with no `--emissive` and the finish stays dark,
which is exactly right.

## The emissive map

The colour map says what the wall is. The emissive map says which part of it is a light: the lit
panes, hot, and pure black everywhere else.

**It is a mask, not a dimmer.** Lit panes go in near white, whatever brightness they are in the
photograph, and everything else goes to black. How bright the window ends up on the building is the
material's job, not the map's, and a map whose lit panes are half grey gives a band of glass floors
that never reads as lit however the tower is looked at.

**Build it from the colour map rather than generating it fresh**, or the two will not line up: mask
the colour map to the pane rectangles, keep only the lit ones, fill the rest with black. If your
image tool cannot mask, ask for the same picture "on pure black, with only the lit windows visible,
everything else absolutely black" using the colour map as the reference image, then check that the
lit rectangles sit exactly where they sit in the colour map.

`facade` and `glass-band` want one. `wall` and `base` never do: they have no windows.

## `glass-band`: the skeleton

Four or five floors of nothing but glazing, lit, sitting in a mass that is otherwise dark. Same grid
rules, same seam, same emissive map.

```
Hyper realistic, extreme realism, photographic. Night photograph of a fully glazed curtain wall,
[the family's glass and framing], dead flat-on with a long telephoto. Nothing but glass: NO
spandrel, NO solid panel, NO brickwork, NO opening. Twelve bays across and three floors down. Every
floor is lit from inside but unevenly: some bays bright, some dim, a few dark, the light varying in
colour and warmth across the picture. [What is dimly visible inside.] [Where the seam falls.]
```

## `wall` and `base`: the skeletons

`wall` is the blank wall between the windows, for a floor you compose windows and balconies onto. It
has to be the same material as `facade` or the building changes halfway up.

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of [the family's wall
material] with NO WINDOWS in it, dead flat-on with a long telephoto. [Finish, colour, joints,
weathering.] Evenly the same all over. NO window, NO glass, NO opening, NO frame, NO sill, NO band:
this is the blank wall between the windows, with the windows taken away. [Where the seam falls.]
```

`base` is the same picture heavier: the part people walk past and touch. Scuffs, impact dents, grime
in the joints, a wet sheen. Still no hazard band, no stencilled number, no graffiti tag, no shutter,
no door: each of those belongs at one place on a building and this picture repeats every three
metres.
