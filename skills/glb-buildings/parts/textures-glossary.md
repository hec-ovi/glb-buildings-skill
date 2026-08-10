# What a family wears, and how to keep it

Every finish a building can wear, what each one is for, and what saving and reusing a picture means.
Read this before generating anything: half the work is knowing which of these names the thing you
want to make actually is.

## What the two families are

A **style** is a family of finishes, and a building wears one of them: `modern` or `cyber`. The same
finish name means the same part of a building in both, drawn from different materials.

| | `modern` | `cyber` |
| --- | --- | --- |
| what it is | a present day curtain wall tower, evening | a near black megastructure at night, drawn by its lights |
| the wall | champagne or silver mullions, blue-green glass, pale spandrels | near black composite panel, conduit, deep reveals, hard little lit slits |
| how dark | ordinary night exposure | the wall sits at 8 to 12 out of 255 |
| what carries the eye | a few lit offices in a mostly dark wall | neon lines, a screen, a band of glass floors, a lit crown |

```bash
buildings style              # which family this building wears, and what its pack holds today
buildings style cyber        # change it
```

**`buildings style` is the live inventory.** It lists every finish that has a picture, how many
pictures each has, and the folder they live in. Nothing else knows that, so read it before you
generate: the thing you were about to make may already be there.

## The finishes

| Finish | Where it lands | Tiles | Emissive map | Declare |
| --- | --- | --- | --- | --- |
| `facade` | the wall of a whole section, windows in the picture | one row per floor, one bay per 3 m | yes, the lit windows | `--across --down` |
| `glass-band` | a section of nothing but glazing, four or five floors | the same | yes | `--across --down` |
| `wall` | a floor you compose on, so the wall itself has no windows | by the metre, 3 m | no | `--metres` if not 3 m |
| `base` | street level, under the entrance | by the metre, 3 m | no | `--metres` if not 3 m |
| `window` | one pane cut into a face | fills the element | no | |
| `door` | the way in, at street level | fills the element | yes, the glass and the lobby behind it | |
| `balcony` | the balustrade round a balcony | fills the height, repeats along | no | |
| `screen` | a sign or video wall composed on a face | fills the element | yes, its own picture | |
| `concrete` | cast panels, slabs, dead walls, balcony slabs | by the metre, 3 m | no | `--metres` |
| `metal` | plate: shutters, louvres, housings, roof plant | by the metre, 1.5 m | no | `--metres` |
| `pipe` | service pipes and ducts, on a wall or a roof | wraps across, 1 m of run down | no | |
| `antenna` | masts, dishes, aerials | by the metre, 0.6 m | no | |
| `roof` | the deck, seen from above | by the metre, 3 m | no | `--metres` |

**Three finishes take no picture at all.** `neon` and `beacon` are lights: a flat colour emitting
that colour, tinted per line, which is brighter and cleaner at any distance than a photograph of a
tube. `screen-glass`, the dot matrix over a screen, is drawn from code because it is mostly
transparent. `add-texture` refuses all three.

**Ads are not finishes.** A picture for a screen standing off a tower is passed to the `screen` verb
by path and belongs to that one screen. See `parts/textures-ads.md`.

## Saving a picture

```bash
buildings add-texture <finish> <file> [--emissive file] [--across 8 --down 4] [--metres 1.6]
                                      [--style cyber] [--as 2]
```

It copies the file in under the name the loader reads, pairs the emissive map to it, takes the next
free variant number, and records what the picture holds in `pack.json`. Nothing has to be named by
hand.

- `--style` fills a family other than the one being edited. Left out, it is this building's family.
- `--as 2` replaces that picture instead of adding one.
- **With no file**, `--as` plus a declaration says what a picture already in the folder holds. That
  is what you run after counting the bays of something you installed earlier, or something that was
  dropped in by hand.

```bash
buildings add-texture facade --as 5 --across 8 --down 4     # count first, then say so
```

## Reusing them

**A pack belongs to the family, not to a building.** Every `cyber` building you ever make wears the
`cyber` folder. Generate a good wall once and every tower in the city has it.

**Variants are how one family carries a street.** A finish holds up to four pictures, `facade_1` to
`facade_4` and beyond, and a building picks one **from its own name**. So the same name always looks
the same, and its neighbour does not. Two buildings looking identical means the family has one
picture of that finish, not that anything is wrong.

**Each picture is declared for itself.** `facade_2` may hold a different grid from `facade_1`. That
is why the declaration key can be either the finish or one picture: say `--across` and `--down`
every time you install a wall and none of them can be wrong.

**Anything a folder lacks is drawn from code.** A half-generated family still builds. So generating
is always one texture at a time, and there is no state where the toolkit stops working.

## Where it all sits

```
textures/<style>/<finish>_<n>.jpg            the picture
textures/<style>/<finish>_<n>-emissive.png   what glows on it, black elsewhere
textures/<style>/pack.json                   what each picture holds
textures/<style>/ads/<name>.jpg              pictures for screens, passed by path
```

`buildings style` prints the exact folder. `BUILDINGS_TEXTURES` moves it.

## A building, from a family that already has pictures

Nothing special: the pictures are picked up by the build.

```bash
buildings new spire --style cyber --width 24 --depth 20 --floors 40
buildings build
```

If it looks wrong, the usual causes in order:

1. **Windows sliced by the floor lines, or too many small windows.** The wall picture's grid is not
   declared, or is declared wrong. Count the bays and the floors off the picture and say so.
2. **Bricks the size of doors, or a material that reads as wallpaper.** A tile that is not 3 m has
   to say `--metres`.
3. **Nothing glows at night.** The emissive map is missing, or it was generated fresh instead of
   built from the colour map, so its lit pixels do not sit where the windows are.
4. **The tower reads as noise.** Every window in the picture is lit. Generate the quiet variants:
   `parts/textures-walls.md`.
