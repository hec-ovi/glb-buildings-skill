# Generating the pictures a building wears

Use this when you have an image tool of your own and the building needs a look the pack does not
carry: an empty family, a second wall so a street is not one building repeated, a door that is not
the one that shipped.

You are writing prompts for an image model and then handing the files to the CLI. **Never put files
in the folder yourself.** `buildings add-texture` names them, pairs the emissive map and records
what grid the picture holds, which is the part that goes wrong when it is done by hand.

## The loop

```bash
buildings style                      # what this family already has, and the folder it lives in
# generate the picture with your image tool, save it to a file
buildings add-texture facade ~/out/facade.png --emissive ~/out/facade-lit.png --across 8 --down 4
buildings build                      # and look at it in the preview
```

`add-texture <finish> <file>` takes `--emissive <file>` for what glows, `--style` to fill a family
other than the one being edited, `--as 2` to replace a picture rather than add one, and either
`--across N --down N` or `--metres M` to say what the picture holds. It answers with where it went
and how many pictures that finish now has.

**Four pictures per finish is the ceiling and one is enough.** A building picks between them from
its own name, so a second and third wall is what stops a street looking like one building. Each one
is declared for itself, so they need not be the same shape or hold the same grid.

## Which part you need

| You want | Read |
| --- | --- |
| what every finish is, what the two families look like, how to save one and reuse it | `parts/textures-glossary.md` |
| a wall: the facade and its windows, a blank wall, the street level, a band of full glazing | `parts/textures-walls.md` |
| one thing on a wall: a window, a door, a balustrade, a sign panel | `parts/textures-elements.md` |
| a material: concrete, metal, pipe, antenna steel, roof membrane | `parts/textures-materials.md` |
| an ad for a screen on a cyberpunk tower, and how to make it read as a light | `parts/textures-ads.md` |

**Read the glossary first if you are not sure which finish the thing you want to make is.** Half the
mistakes are a picture generated for the wrong name.

## The five rules

Every prompt in every batch obeys these. They are what separates a texture from a picture of a
building.

1. **Ask for a photograph, not a render.** "Flat even lighting, orthographic, uniform" is render
   language and comes back as a render. Say **long telephoto lens, dead flat-on** instead: same flat
   distortion-free wall, and it reads as a photograph.
2. **Name the material and its finish.** Not naming a colour gets neutral grey. Champagne anodised
   aluminium, blue-green low-e glass, near-black composite panel, dark gunmetal plate.
3. **Even detail across the whole frame.** Anything the model centres becomes a polka dot when it
   tiles. Say *evenly the same all over*.
4. **Nothing that belongs at one height.** A hazard band low down, a stencilled number, a stone
   band at the top: a tile has no top and no bottom, so each of those repeats up the whole wall.
   Anything that belongs at a particular place on a building belongs in the geometry, not the tile.
5. **State the scale.** "A 3 metre square of", "eight window bays across and four floors down".

## Append to every prompt

Open with the realism words, close with them, and say where the seam falls. Every batch's skeleton
already does. The rest is the same everywhere:

```
seamless tileable texture, shot dead flat-on with a long telephoto lens so there is no perspective
and no convergence, sharp across the whole frame, even detail edge to edge, no vignette, no depth
of field, hyper realistic, extreme realism
```

## The negative prompt

```
3d render, cgi, unreal engine, blender, octane, videogame asset, illustration, vector, matte
painting, perfectly uniform grid, identical repeated windows, symmetrical, perspective, camera
angle, horizon, sky, ground, street, people, cars, trees, vignette, border, frame, watermark, text,
signature, blur, bokeh, lens flare, bloom, cast shadow, tilted, fisheye, collage, visible seam
```

For a tiling material, add what cannot repeat:

```
hazard stripes, chevrons, stencilled text, numbers, signage, graffiti, a band across the picture
```

## The two families, in words

Every prompt is the same skeleton with this family's materials dropped into it.

| | `modern` | `cyber` |
| --- | --- | --- |
| the wall | champagne anodised aluminium curtain wall, blue-green low-e glass, pale precast spandrels | near-black composite panel, conduit and stencilled decals, deep reveals |
| the light inside | cool white offices, ceiling grids, a few desks | hard-edged bars of cyan, white, amber and red, no room behind them |
| concrete | pale precast, fine sand finish | dark stained concrete, water staining |
| metal | brushed stainless, clean | scuffed dark gunmetal, condensation |
| the mood | evening, clean, corporate | night, wet, almost black, drawn by its lights |

**The cyber wall sits at 8 to 12 out of 255.** Not dark grey. Anything that lifts it off black kills
the family, because the whole look is a black mass with a few bright things on it.

## Sizes

| Finish | Generate | Ship | Emissive |
| --- | --- | --- | --- |
| `facade`, `glass-band` | 2048 x 1024 | 1024 x 512 | yes |
| `wall`, `base`, `concrete`, `roof`, `metal` | 1024 x 1024 | 512 x 512 | no |
| `window`, `pipe`, `antenna` | 512 x 512 | 256 x 256 | no |
| `door` | 512 x 1024 | 256 x 512 | yes |
| `balcony`, `screen` | 1024 x 512 | 512 x 256 | yes for `screen` |

Colour maps as JPEG, emissive maps as PNG. Never upscale a tile: upscalers repaint the edges and
the seam comes back.

## What takes no picture at all

`neon`, `beacon` and `screen-glass`. A neon run and a beacon lens are lights, and a flat colour
emitting that colour is brighter and reads better at any distance than a photograph of a tube. The
dotted glass over a screen is mostly transparent, which an image model cannot give you.
`add-texture` refuses those three and says so.

## Before you install it

Lay the picture out 3 by 3 in your head, or in the tool if it can. A seam, or a feature that reads
as a polka dot, means generate it again rather than retouch it. Then check the darkness on a cyber
wall, and only then run `add-texture`.
