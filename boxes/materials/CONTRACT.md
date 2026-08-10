# materials

The finish library: what every named surface looks like. A finish is a flat colour and, when the building
carries pictures, a tile drawn from code or read from a folder of generated images.

Textures written from code cost nothing to ship, tile exactly, and give every building its own, which is
what lets a scene carry thousands of them.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `finish(name, look)` | a finish name and how the building is dressed | `Finish`, or nothing if the name is unknown |
| `tileOf(name)` | a finish name | metres of surface one tile covers |
| `fits(name)` | a finish name | whether one picture fills one element instead of tiling |
| `bands(name)` | a finish name | whether one picture bands across an element and repeats along it |
| `gridded(name)` | a finish name | whether its picture is a grid of bays rather than metres of material |
| `known(name)` | a finish name | whether there is a finish by that name |
| `pictured(name)` | a finish name | whether it carries a picture at all, or is a flat colour |
| `splitName(name)` | `neon:cyan` | the base finish and the colour asked for |
| `loadPack(root, style)` | a folder and a style | the generated images for that family |
| `pack.get(finish, seed)` | a finish and a building's seed | the picture that building wears, and what glows on it |
| `pack.gridOf(finish, seed)` / `metresOf` / `dimOf` | the same | what that picture holds and how far to drop it, where the pack says so |
| `loadImage(path)` | a PNG or JPEG path | its bytes and mime type |
| `sheet(style)` | a style | the colours and wear that family is drawn from |
| `facadeTexture(style)` | a partial wall style | the wall tile, both maps, and how many windows are lit |
| `png({ width, height, rgba })` | RGBA pixels | PNG bytes |

`Look` is `{ mode, style, seed, pack? }`. `Finish` is `{ colour, metallic, roughness, emissive?, lit, alpha,
glow, tint, fit, band, tile, image? }`, where `image` is `{ key, load() }` and `key` is what the file names
the texture, so two materials over one picture share it.

- `lit` is a surface that is itself a light: its own picture is what glows.
- `alpha` under 1 is see-through, `glow` past 1 is how much light it throws past a plain material's most.
- `tint` is how much of its picture's brightness a dead surface keeps. A photograph was lit for a
  photograph; dropped to the family's own tint it falls back to being a wall, and the lit things on the
  building become the brightest thing on it.
- `fit` fills one element with one picture, `band` runs the picture across an element and repeats it along,
  and everything else tiles every `tile` metres.

## The two modes

- `textured`: every finish carries its pictures.
- `plain`: no images at all. Every finish is a flat colour, and the file is a set of named slots an engine
  drops its own materials onto. A section with no cut windows reads as a plain mass, since the windows lived
  in the picture.

## The two families

`modern` is a present day curtain wall tower and `cyber` a near black mass drawn by its lights. A style is
a sheet of colours and a wear number, and every template reads what it needs from it, so one set of
templates draws both without a branch anywhere.

## The finishes

`facade` and `glass` share the wall tile. `glass-band` is a band of nothing but lit glazing. `wall` is the
same wall with no windows in it, for a floor that is composed rather than drawn, and `base` is the street
level of it. `window`, `door`, `balcony`, `concrete`, `metal`, `screen`, `pipe`, `antenna` and `neon` are
what a part can be given by name, `screen-glass` is the dotted glass over a screen, and `beacon` is the lens
on a mast tip.

`neon` and `beacon` carry no picture at all: a light is a flat colour emitting that colour, and a photograph
of a tube only dulls it. A name may carry a colour, `neon:cyan` or `beacon:#ff2f88`:
the tile stays the one white picture and the colour tints it.

## The wall tile

One tile is `down` floors tall and `across` bays wide, and `bay` says what that is in metres, so the kit can
lay a wall's UVs against it: one row of the tile per floor, one bay per 3 m of face. Get that wrong and a
3 m patch of wall carries the whole tile, which reads as a christmas tree.

The colour map carries the wall, the band under each row of windows and the glazing. The emissive map
carries the lit windows and nothing else. No two lit windows are alike: colour, brightness and how much of
the pane is lit are drawn per window.

## Packs

A pack is a folder per style holding `<finish>_<n>.jpg` and `<finish>_<n>-emissive.png`. Anything the folder
carries stands in for the drawn tile; anything it lacks stays drawn, so a set can be generated one texture at
a time and the build never stops working.

A finish may carry several pictures, `facade_1` to `facade_4`, and a building picks one of them from its own
seed, so a street of towers does not wear one wall.

A generated picture holds whatever grid the image model felt like drawing, and the only way to know is to be
told. `pack.json` beside the images says so, and the kit lays its UVs on the real one:

```json
{ "facade": { "across": 10, "down": 3 }, "facade_2": { "across": 8, "down": 4 },
  "wall": { "metres": 1.6 }, "wall_2": { "dim": 0.42 } }
```

`across` and `down` are the bays and floors a wall picture holds; `metres` is how much building one tile of a
material covers, which is what keeps 21 courses of brick at 1.6 m instead of the size of a door; `dim` is how
much of that one picture's brightness to keep, for a picture that came back brighter than the rest of its
family, and it stands in for the family's own tint.

A key names either a finish or one picture of it. Two pictures of one finish need not hold the same grid, so
`facade_2` wins over `facade` for the second picture, and a key naming the finish alone covers every picture
that says nothing for itself. Where the folder is comes from the caller. Generating them is
`docs/textures/PROMPTS.md`.

## Invariants

- The same seed gives the same picture, every build. A different building gives a different one.
- Both maps of a tile come out of the same grid, so a window that glows is a window that is lit.
- `pane` is where the glazing is drawn and where geometry cuts it, so a building never carries two window
  systems that disagree.
- Every tile stays under 40 kB, which is what makes it affordable on every building in a scene.
- `plain` mode returns no image for any finish.

## Depends on

Nothing.
