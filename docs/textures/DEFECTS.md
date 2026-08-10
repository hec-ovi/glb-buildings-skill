# What is wrong with the pack today, file by file

Every entry names the file, the building it was seen on, the screenshot it is visible in, what is
wrong measured rather than guessed, and the prompt to generate the replacement with.

Nine buildings were built from the packs to produce this: three by Opus, three by Haiku, three by
the local model. Which picture a building wears comes from its own name, so each defect below is
tied to the building that happened to pick it.

## How each fault was measured

- **Seam.** Every tiling picture repeats, so its left edge meets its right edge and its top meets
  its bottom. The number is how different that join is against how different two neighbouring rows
  or columns normally are inside the picture. **1 is perfect, over 3 is a seam you can see** on the
  building as a broken line every few metres.
- **Mean brightness.** 0 is black, 1 is white, measured over the whole picture. The `cyber` family
  sits at 0.05 to 0.20 and is consistent. The `modern` family is **not**: it runs from 0.09 to
  0.76, which is the difference between a night photograph and a daylight one, and both end up on
  the same tower.
- **Emissive.** Whether a `<file>-emissive.png` exists beside it. A wall without one is a building
  with every light off.

## The four rules these break

1. **A tiling picture has to tile.** Both edges, both axes, mid-feature: mid-mullion across, mid
   spandrel band down.
2. **One family, one time of day.** A `modern` building is at night. A daylight photograph dropped
   into it reads as a lit panel next to dark ones.
3. **The picture is of the thing named.** A `window` is one window unit. A `wall` is a wall. Not a
   shopfront, not a lobby, not a sky.
4. **No baked light.** No sun streak, no lens flare, no LED dot grid, no scanlines. The renderer
   does the lighting; anything painted in fights it and repeats identically on every element.

---

## 1. `cyber/screen_1.jpg` and `cyber/screen_1-emissive.png`

**Seen on:** `neon-haiku`, the screen on the east face.
**Screenshot:** `removeneonhaikuimagepresetad.png`.

The picture is a glitch-art figure with an **LED dot matrix, scanlines and magenta and green glitch
bands baked into it**. Stretched over seven floors every one of those becomes metre-wide, and the
toolkit then puts its own dotted glass in front, so two dot grids at different pitches beat against
each other. The result reads as coloured noise rather than a sign.

It is also the wrong job for the file: `screen` is the finish for a **sign panel composed on a
face**, a metre or two across, not for the big screens that hang off a tower. Those get an ad now
(see the end of this file).

**Replace it with a plain lit sign panel:**

```
Hyper realistic, extreme realism, photographic. Photograph of a blank backlit sign panel on a
building at night, seen dead-on, filling the frame edge to edge with no bezel and no border. A flat
translucent white acrylic face lit evenly from behind, slightly brighter across the middle, with the
faint ghost of the LED strips behind it and a thin dark seam where two panels meet. One narrow cool
grey graphic band across the lower third. NO text, NO letters, NO logo, NO figure, NO person, NO
pixel grid, NO dot matrix, NO scanlines, NO glitch, NO chromatic aberration, NO colour fringing. The
subject fills the frame edge to edge, its own frame running right to the edge of the picture:
nothing cropped, no background and no margin around it. Hyper realistic, hyper realism, extreme
realist.
```

*Emissive:* the same image at full brightness on black.

## 2. `modern/window_1.jpg`

**Seen on:** `parkrow-haiku`, every composed window on the south face.
**Screenshot:** `parkrow issues texture ugly, door strange too smal, windows too big.png`.

Three faults at once. It is a **daylight** photograph (mean 0.46) on a family of night buildings. It
has a **hard diagonal sun streak** painted across it, which then repeats identically on every window
of every floor, and two lens ghosts with it. And the subject is a **whole two-pane shopfront with
its own frame**, so used as one window unit you get a window drawn inside a window.

**Replace it with one window unit at night:**

```
Hyper realistic, extreme realism, photographic. Photograph of ONE window unit of a modern office
building at night, seen dead-on with a long telephoto, filling the frame edge to edge. A single pane
of dark blue-green low-e glass in a slim champagne anodised aluminium frame, one vertical mullion at
one side, a thin stone sill at the bottom. The glass is dark and closed, holding a faint reflection
of the city and nothing else: NO interior, NO room, NO desk, NO lamp, NO person, NO curtain. NO
sunlight, NO sun streak, NO diagonal highlight, NO lens flare, NO ghost, NO reflection of the sun:
this is night. Even, flat lighting across the whole pane. The subject fills the frame edge to edge,
its own frame running right to the edge of the picture: nothing cropped, no background and no margin
around it. Hyper realistic, hyper realism, extreme realist.
```

## 3. `modern/window_2.jpg`

**Seen on:** `harborview-me` and `stonegate-qwen`.
**Screenshot:** `stonegate missing some dinwos effects` (the ground floor).

Wrong subject: it is a photograph of a **ground floor lobby entrance**, a whole glazed bay with a
reception desk and a doorway inside it. Used as the `window` finish it puts a lobby into every
window on the building.

**Regenerate it as a second night window unit**, same prompt as `window_1` above, changed to a
punched window in a stone reveal rather than a curtain wall pane, so the two variants differ.

## 4. `modern/wall_1.jpg`

**Seen on:** `stonegate-qwen`.

This is a photograph of **the sky at dawn**: a smooth pale blue to pink gradient with a faint grid
of lines over it. Mean brightness 0.71, the brightest picture in either family, on a wall that is
supposed to sit behind everything else. There is no wall in it at all.

**Replace it with the blank wall between the windows:**

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of a modern office
building's blank cladding at night, dead flat-on with a long telephoto. Champagne anodised aluminium
panels with fine recessed joints between them, a faint vertical brushed grain, a little grime
collected in the joints, dry. Evenly the same all over, low key, dark: the wall of a building at
night, not a lit one. NO window, NO glass, NO opening, NO frame, NO sill, NO sky, NO horizon, NO
cloud, NO gradient across the picture, NO light source. The picture starts and ends mid-material,
with no feature crossing an edge and no change of tone toward any edge, so where it repeats the join
is invisible. Hyper realistic, hyper realism, extreme realist.
```

## 5. `cyber/wall_2.jpg`

**Seen on:** `kabuki-me`, `neon-haiku`, `blackline-qwen`, `sector7-qwen`. The whole cyber family
uses it.

Same fault as `modern/wall_1`: it is a photograph of **a night sky with clouds and a horizon line**.
It is dark (mean 0.05) so it passes as a black wall from far away, but tiled it repeats a cloud
shape and a horizon every three metres.

**Replace it with the black glass monolith it was meant to be:**

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of a black glass
curtain wall with NO WINDOWS in it, at night, dead flat-on with a long telephoto. Large panes of
near-black obscured glass in a matte black frame with fine joints, the glass showing only a dim
smeared reflection of distant city light and a faint vertical rain streak. Almost featureless, very
dark, sitting at 10 to 16 out of 255. Evenly the same all over. NO window, NO opening, NO light
behind it, NO sky, NO cloud, NO horizon, NO moon, NO star, NO text, NO hazard marking. The picture
starts and ends mid-material, with no feature crossing an edge and no change of tone toward any
edge, so where it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

## 6. `modern/base_1.jpg`

**Seen on:** `parkrow-haiku` and `mercantile-haiku`, the street level.
**Screenshot:** `parkrow issues texture ugly, door strange too smal, windows too big.png`.

A **daylight** photograph (mean 0.51) of pale green-grey ashlar blocks, so the plinth glows against
a dark building. It also carries **a dirt smudge and a footprint in one corner**, which repeats
every three metres up and along the whole ground floor, and the block courses are laid out so the
horizontal joint lands differently at the top and bottom edges (vertical seam 3.9).

**Replace it with the street level at night:**

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of the stone cladding
at the base of a modern office building at night, dead flat-on with a long telephoto. Dark grey
honed granite panels in a regular running bond, fine recessed joints, a slight polish on the faces
catching a little street light, faint wear along the bottom. Evenly the same all over, low key,
dark. NO stain, NO smudge, NO footprint, NO puddle, NO graffiti, NO poster, NO sign, NO number, NO
hazard band, NO window, NO door, NO opening: each of those belongs at one place on a building and
this picture repeats every three metres. The picture starts and ends mid-material and mid-course,
with no feature crossing an edge and no change of tone toward any edge, so where it repeats the join
is invisible. Hyper realistic, hyper realism, extreme realist.
```

## 7. `modern/facade_11.jpg`

**Seen on:** `stonegate-qwen`, the whole tower.
**Screenshot:** `stonegate missing some dinwos effects`.

Two faults. **Vertical seam of 28**: where the picture repeats up the building, the spandrel band
changes thickness and a row of windows is cut, which is the banding visible up the tower. And it
carries **no emissive map**, so every window on the building is off. The local model built the
massing well and the tower still reads as dead because of this one file.

It is also the palest of the new facades (mean 0.28), a dusk photograph rather than a night one.

**Regenerate it from `modern/facade_5.jpg` as an image reference**, keeping the grid of 8 bays
across and 4 floors down, and change these things: shoot it at night rather than dusk, put the seam
in the middle of a spandrel band top and bottom, and **light a handful of windows**:

```
Hyper realistic, extreme realism, photographic. The same modern office curtain wall as the reference
image: identical mullion spacing, identical spandrels, identical materials and glass tint, identical
grid of 8 window bays across and 4 floors down, same telephoto, dead flat-on. Night, not dusk: the
sky is gone, the wall is dark, and the only light in the picture comes from inside the building.
Almost every pane is dark, closed and empty. Only four or five windows in the whole picture carry
light and they are deliberately uneven: one run of three side by side lit as a single cool white
bar, one lone warm amber window far from it, one dim blue-white sliver. NO lit rooms, NO desks, NO
lamps, NO ceiling grids, NO people, NO furniture anywhere except in those few. The picture starts
and ends in the middle of a mullion, and in the middle of the solid spandrel band between two
floors, so where it repeats the join makes one whole mullion and one whole floor band and never cuts
a window in half. Hyper realistic, hyper realism, extreme realist.
```

*Emissive:* build it from this colour map, masked to the lit panes only, each pane carrying its
own pixels from the photograph at their own brightness, black everywhere else. A pane pushed to
near white sits above the preview's bloom threshold and the whole wall blooms into one cloud.

## 8. `modern/facade_7.jpg`

**Seen on:** `harborview-me`, the body of the tower.
**Screenshot:** `brokenlinesharborview.png`.

**Horizontal seam of 10.6.** Where the picture repeats across the face, the bay rhythm breaks: one
column comes out narrower than the rest and the mullion line doubles. On a 28 m face that happens
every 24 m, which is the broken line in the screenshot.

The picture itself is good: night, correct exposure, an even scatter of lit offices. It only needs
its left and right edges to meet.

**Regenerate it from itself as an image reference**, same prompt, with this added and nothing else
changed: *the picture starts and ends in the exact middle of a mullion, so the left edge and the
right edge join into one whole mullion of the same width as every other mullion in the picture, with
no narrow bay at either edge.*

The same fault, smaller, is in `modern/facade_5` (9.4), `modern/facade_8` (25.6), `cyber/facade_3`
(11.4) and `cyber/facade_4` (12.6). Fix them the same way.

## 9. `modern/glass-band_1-emissive.png`

**Seen on:** `harborview-me`, the band of glass floors under the crown.
**Screenshot:** `brokenlinesharborview.png`, the white shapes near the top.

The colour map is fine. The **emissive map is wrong in shape**: it was made by thresholding the
colour map, so what it holds is a set of **soft irregular blobs following the bright ceilings**,
not the rectangles of the panes. On the building those blobs float across the mullions and read as
white smears rather than lit floors.

**It is not an image generation job.** Build it from `modern/glass-band_1.jpg`: take the pane
rectangles of the 14 by 4 grid, keep the ones that are lit, fill each one **edge to edge, to its
own mullion lines** with the pane's own pixels from the colour map, and make everything else pure
black. Hard edges, no feathering past the rectangle, no glow. A lit pane is a rectangle, because a
window is a rectangle, and it keeps the photograph's brightness: near white times the finish's
glow of 1.6 sits far above the preview's bloom threshold and the band becomes the cloud again.

## 10. `modern/wall_3.jpg`

**Seen on:** `parkrow-haiku` and `mercantile-haiku`.

A flat, featureless dark grey field: no joints, no grain, no variation of any kind (its internal
detail measures near zero). It is not wrong so much as empty, and a composed floor wearing it reads
as plastic.

Take the `modern/wall_1` replacement prompt above and change the material to dark grey-green
granite panels so the family has two walls that differ.

## 11. `modern/screen_1.jpg`

**Not seen on a building yet**, but it is the `screen` finish for the modern family and it is a
near-white panel (mean 0.76) with an emissive map to match. Under the material's own light that is a
lamp, not a sign.

Use the replacement prompt from entry 1, and keep the mean of the picture under about 0.4 so its
lit areas have somewhere to go.

---

## The pack-level fault: more than half the modern family is dark

`buildings style` now reports it directly:

```
"has": [ "facade x13 (6 lit)" ],
"dark": [ "facade: 7 of 13 carry no lights" ]
```

`modern/facade_4`, `_8`, `_9`, `_10`, `_11`, `_12` and `_13` carry no emissive map at all. A
building picks its wall by name, so **seven times in thirteen a modern tower comes out with every
window off**, which is what happened to `stonegate-qwen`.

Two ways to change the balance, both fine:

- Generate emissive maps for three or four of them, lighting five to ten windows each, using the
  masking rule from entry 9. This keeps the pictures and gives the family a spread of quiet towers.
- Or generate three or four more **lit** facades, which is the same work as one wall each.

The target is roughly two lit walls for every dark one. A city where every tower is lit reads as
noise, and one where none is reads as a power cut.

The `cyber` family is in better shape: 3 of 4 facades carry lights.

---

## What was fixed in the toolkit instead of the pictures

These were mechanics, not textures, and they are already done:

- **A screen with no `--image` now wears one of the family's ads**, picked from
  `textures/<style>/ads/` by the building's name and how many screens it already carries. Before, it
  fell back to the `screen` finish, which is why `neon-haiku` had that glitch tile stretched over
  seven floors.
- **A band of glass floors is lit, not white.** Its picture now drops to the family's tint like any
  other surface and its emissive map does the lighting, so a photograph of white ceilings no longer
  arrives as a white wall as well as a light.
- **`buildings style` reports which pictures carry lights**, so a pack that is going dark is
  visible before nine buildings are built from it.
