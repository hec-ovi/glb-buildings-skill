# Materials: `concrete`, `metal`, `pipe`, `antenna`, `roof`

Read `parts/textures.md` first: the five rules, the words to append, the negative prompt and the
family table are there and every skeleton below assumes them.

These are the easiest to generate and the easiest to get wrong. They are **not architecture
photographs**. They are pure material fields for UV tiling: one continuous surface with fine even
detail, and nothing in them that a person would call a feature.

| Finish | What it is | Covers |
| --- | --- | --- |
| `concrete` | cast panel, slab, dead wall | 3 m |
| `metal` | plate: shutters, louvres, housings | 1.5 m |
| `pipe` | painted service pipe | wraps across, 1 m of run down |
| `antenna` | galvanised steel | 0.6 m |
| `roof` | membrane, seen from above | 3 m |

## Monotonous is the requirement

An image model wants to make a photograph interesting. Every interesting thing it adds becomes a
polka dot repeating every three metres across the whole building. So the prompt has to say, in as
many words as it takes, that there is nothing to look at:

```
Strictly monotonous seamless PBR albedo tile of material alone. The entire frame is one continuous
surface with only fine, even micro-detail. No objects, no screws, no bolts, no rivets, no flanges,
no labels, no text, no numbers, no warning stripes, no colour bands, no logos, no hardware, no
puddles, no cracks as a hero feature, no centered marks, no borders, no frames, no vignette, no
colour blocks, no gradient shapes, no composition. Darker low-key exposure. High quality
photographic grain of the material, nothing else.
```

Append that block to every prompt in this batch, on top of the negative prompt. If what comes back
has one bolt, one stain or one crack that the eye finds, generate it again: it will find that same
thing forty times on the finished building.

## Say how much wall it covers

These tile by the metre, and the default is 3 m. If the picture is a close-up, say so, or the detail
comes out the wrong size:

```bash
buildings add-texture concrete ~/out/concrete.png            # 3 m of wall, the default
buildings add-texture wall ~/out/brick.png --metres 1.6      # 21 courses of brick, not 3 m of it
buildings add-texture metal ~/out/plate.png --metres 1.5
```

Count something you know the size of. Brick courses are 75 mm. A standard plate is 1.2 by 2.4 m.

## The skeleton

```
Hyper realistic, extreme realism, photographic. Pure seamless tile of [material] only, [colour and
finish], [the fine even detail: grain, aggregate, brush lines, weathering], filling the whole frame.
Evenly the same all over. Photographed dead flat-on with a long telephoto in flat light. NO window,
NO opening, NO text, NO number, NO hazard marking, NO logo, NO hardware. The picture starts and ends
mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it
repeats the join is invisible. [The monotonous block above.] Hyper realistic, hyper realism, extreme
realist.
```

## The two that are not flat squares

**`pipe`** wraps around the pipe across the picture and runs one metre along it down the picture. So
it is a strip, not a square: the middle band is the lit side of the pipe, the outer thirds fall into
shadow, and the top and bottom edges must join. Say *the picture starts and ends midway between two
collars, so where it repeats along the run the join is invisible and no fitting is cut in half*. One
band or one flange in the picture is fine here, because it lands once a metre, which is where a
flange belongs.

**`roof`** is seen from above, so ask for a top-down photograph of membrane or gravel. Same rules:
no weld seam as a feature, no puddle ring, no leaves, no drain, no plant. Anything on a roof is a
deck part, and deck parts are geometry.

## Per family

The same skeleton, different words. `modern` concrete is pale precast with a fine sand finish;
`cyber` concrete is dark stained, with water staining down it. `modern` metal is brushed stainless,
clean; `cyber` metal is scuffed dark gunmetal with condensation on it. The material is the same
material: what changes is its colour, its wear and how much light it gives back.
