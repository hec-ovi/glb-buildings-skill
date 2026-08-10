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
| `splitName(name)` | `neon:cyan` | the base finish and the colour asked for |
| `loadPack(root, style)` | a folder and a style | the generated images for that family |
| `loadImage(path)` | a PNG or JPEG path | its bytes and mime type |
| `sheet(style)` | a style | the colours and wear that family is drawn from |
| `facadeTexture(style)` | a partial wall style | the wall tile, both maps, and how many windows are lit |
| `png({ width, height, rgba })` | RGBA pixels | PNG bytes |

`Look` is `{ mode, style, seed, pack? }`. `Finish` is `{ colour, metallic, roughness, emissive?, fit, tile,
image? }`, where `image` is `{ key, load() }` and `key` is what the file names the texture, so two materials
over one picture share it.

## The two modes

- `textured`: every finish carries its pictures.
- `plain`: no images at all. Every finish is a flat colour, and the file is a set of named slots an engine
  drops its own materials onto. A section with no cut windows reads as a plain mass, since the windows lived
  in the picture.

## The three families

`modern` is a present day curtain wall tower, `fifties` a 1950s block, `cyber` a near black mass drawn by
its lights. A style is a sheet of colours and a wear number, and every template reads what it needs from it,
so one set of templates draws all three without a branch anywhere.

## The finishes

`facade` and `glass` share the wall tile. `glass-band` is a band of nothing but lit glazing. `window`,
`door`, `balcony`, `concrete`, `metal`, `screen`, `pipe`, `antenna` and `neon` are what a part can be given
by name, and `beacon` is the lens on a mast tip. A name may carry a colour, `neon:cyan` or `beacon:#ff2f88`:
the tile stays the one white picture and the colour tints it.

## The wall tile

One tile is `down` floors tall and `across` bays wide, and `bay` says what that is in metres, so the kit can
lay a wall's UVs against it: one row of the tile per floor, one bay per 3 m of face. Get that wrong and a
3 m patch of wall carries the whole tile, which reads as a christmas tree.

The colour map carries the wall, the band under each row of windows and the glazing. The emissive map
carries the lit windows and nothing else. No two lit windows are alike: colour, brightness and how much of
the pane is lit are drawn per window.

## Packs

A pack is a folder per style holding `<finish>.png` and `<finish>-emissive.png` (JPEG works for colour).
Anything the folder carries stands in for the drawn tile; anything it lacks stays drawn, so a set can be
generated one texture at a time and the build never stops working.

A finish may carry several pictures, `facade_1.png` to `facade_4.png`, and a building picks one of them from
its own seed, so a street of towers does not wear one wall. The emissive map of a variant is named after it:
`facade_2-emissive.png`. Where the folder is comes from the caller. Generating them is
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
