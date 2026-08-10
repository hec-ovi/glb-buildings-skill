# Texture prompt pack

Every texture the kit can wear, in three families: **modern**, **fifties**, **cyber**. One entry per file:
the path it has to be saved at, and the prompt.

Generate four of each and keep them all. A finish with several pictures is picked between per building, so a
street of towers does not wear one wall.

---

## 1. Naming

```
<home>/textures/<style>/<finish>_<n>.jpg
<home>/textures/<style>/<finish>_<n>-emissive.png
```

- **The folder is the style.** `cyber/facade_1.jpg` is the cyber family's wall. Nothing else says which
  family a picture belongs to.
- `_1` to `_4` are variants of the same finish. A building picks one from its own name, so the same building
  always looks the same and its neighbour does not.
- `-emissive` is the map of what glows, black everywhere else. Only some finishes have one.
- `<home>` is where projects live: run `buildings style` and it prints the exact path. `BUILDINGS_TEXTURES`
  overrides it.
- PNG and JPEG only. Colour maps as JPEG, emissive as PNG (black compresses to nothing).

**Nothing is required.** A folder with one file in it overrides that one finish; everything else stays drawn
from code. Generate a family a texture at a time and the build keeps working the whole way.

## 2. The wall tile has to land on a grid

The wall lays its own UVs: **one row of the tile per floor, one bay per 3 m of face**, on a tile of
**8 bays across by 4 floors down**. So `facade` and `glass-band` are a clean 8 by 4 grid of identical cells,
seamless left to right and top to bottom. A photograph of a real tower does not work: the perspective, the
corner and the sky are baked in.

Geometry that cuts a real window uses the same rectangle the texture draws it in. At **2048 x 1024** each
cell is **256 x 256 px**, and inside a cell, from its own top-left corner:

| Part | X | Y |
| --- | --- | --- |
| glass pane | 23 to 233 | 51 to 159 |
| spandrel band under the glass | 0 to 256 | 159 to 241 |
| floor line and head band | 0 to 256 | 241 to 256, and 0 to 51 |
| mullion, each side of the glass | 0 to 23 and 233 to 256 | full height |

Cell `c,r` starts at `x = c * 256` and `y = r * 256`. Halve everything for a 1024 x 512 tile.

### Where the seam falls

The 10 cm margin kept clear on the face grid is about things you **place** on a wall, so nothing lands on a
corner or a floor line. A texture has no margin: it repeats, and the join has to be invisible.

The tile is cut so the join lands on solid material rather than through a window. Read the numbers above:
the left edge of the tile carries 23 px of mullion and the right edge carries 23 px, so two tiles side by
side make one whole 46 px mullion. Top and bottom carry 51 px and 97 px of solid band, so two tiles stacked
make one 148 px band between two rows of glazing.

That only works if the picture is drawn to it, so every tiling prompt says it: **start and end in the middle
of a mullion, and in the middle of the band between two floors**. A picture that starts at the edge of a
pane cuts a window in half at every repeat, and no amount of blending hides it.

The same rule in plainer terms for the finishes that are not a grid: nothing may cross an edge, and the tone
must not drift toward any edge, or the repeat shows up as a chequerboard.

## 3. Sizes

| Finish | What it is | Generate | Ship | Emissive |
| --- | --- | --- | --- | --- |
| `facade` | the wall, 8 bays x 4 floors, seamless | 2048 x 1024 | 1024 x 512 | yes |
| `glass-band` | floors of nothing but glazing, same grid | 2048 x 1024 | 1024 x 512 | yes |
| `window` | one window unit, fills the element | 512 x 512 | 256 x 256 | no |
| `door` | one door leaf, fills the element | 512 x 1024 | 256 x 512 | yes |
| `balcony` | one balustrade, fills the element | 1024 x 512 | 512 x 256 | no |
| `concrete` | 3 m square, seamless | 1024 x 1024 | 512 x 512 | no |
| `metal` | 1.5 m square, seamless | 1024 x 1024 | 512 x 512 | no |
| `pipe` | wraps the pipe across, 1 m of run down, seamless | 512 x 512 | 256 x 256 | no |
| `antenna` | 0.6 m square, seamless | 512 x 512 | 256 x 256 | no |
| `roof` | 3 m square, seamless, seen from above | 1024 x 1024 | 512 x 512 | no |
| `screen` | one panel, fills the element | 1024 x 512 | 512 x 256 | yes |
| `neon` | wraps the tube across, 1 m of run down, seamless | 512 x 512 | 256 x 256 | yes |
| `beacon` | one lens, fills the element | 256 x 256 | 128 x 128 | yes |

Colour and emissive are sRGB. Normal, roughness and AO are derived afterwards and are linear.

## 4. Getting a photograph instead of a render

The first pass of these came out grey and CG. Two things cause that, and both are in the prompt:

- **"Flat even lighting, orthographic, uniform"** is render language. Models answer it with a render. Ask
  for a **long telephoto lens straight on** instead: it gives the same flat, distortion-free wall and it
  reads as a photograph.
- **Not naming a colour gets neutral grey.** Say the material *and* its finish: champagne anodised
  aluminium, bronze mullions, blue-green low-e glass, buff brick, oxidised copper. Never say "grey" unless
  grey is what you want.

The rest:

1. Say **seamless** and **tileable**, and say what it is a texture *of*, never a scene.
2. **Even detail across the frame.** Anything the model centres becomes a polka dot when it tiles.
3. **State the scale**: "a 3 metre square of", "eight window bays across".
4. **1:1 tiles best.** The wall tile is 2:1 and worth the extra work, because the bays stay square.
5. **Never upscale a tile.** Upscalers repaint the edges and the seam comes back.
6. **Ask only for what you can see.** Normal, roughness, height and AO come afterwards, from the colour map.

Per tool: Midjourney `--tile` (works with `--ar 2:1`, skip the upscale). Local SDXL or Flux: circular
padding in the UNet and the VAE, per axis. Anything else: generate at 2x and fix the seam by hand.

### Append to every prompt

Every prompt below already opens and closes on the realism words, and already says where its seam falls.
This is the rest, which is the same for all of them:

```
seamless tileable texture, shot dead flat-on with a long telephoto lens so there is no perspective and no
convergence, sharp across the whole frame, even detail edge to edge, no vignette, no depth of field,
hyper realistic, extreme realism
```

### The negative prompt

```
3d render, cgi, unreal engine, blender, octane, videogame asset, illustration, vector, matte painting,
perfectly uniform grid, identical repeated windows, symmetrical, perspective, camera angle, horizon, sky,
ground, street, people, cars, trees, vignette, border, frame, watermark, text, signature, blur, bokeh,
lens flare, bloom, cast shadow, tilted, fisheye, collage, visible seam
```

---

## 5. modern

A present day curtain wall tower. The trap is grey: name the metal and the glass tint every time.

### `modern/facade_1.jpg` + `modern/facade_1-emissive.png`

The wall, at night, eight bays across and four floors down.

```
Hyper realistic, extreme realism, photographic. Night photograph of a modern office curtain wall, taken with a
400mm telephoto from a neighbouring rooftop so the wall fills the frame dead flat-on. An exact grid of 8
window bays across and 4 floors down, every cell the same size. Each cell is a wide low pane of blue-green
low-iron glass between slim champagne anodised aluminium mullions, with a matte charcoal spandrel panel below
it and a thin bright aluminium floor line above. About a quarter of the offices are lit and every one is
different: a recessed ceiling grid glowing cool white, a warm desk lamp in a corner, a lit meeting room with a
table and stacked chairs, a floor where only the far end is on, venetian blinds half lowered cutting the glow
into a strip, a monitor left on throwing blue onto a partition. The dark panes carry the reflection of the
building opposite as faint charcoal shapes with tiny lit windows in them, and there are soft vertical rain
smears and dust collected in the frame corners. Deep black between the lights, no exterior light source at
all. The picture starts and ends in the middle of a mullion, and in the middle of the solid band between two
floors, so where it repeats the join makes one whole mullion and one whole floor band and never cuts a window
in half. Hyper realistic, hyper realism, extreme realist.
```

Vary the four: `_1` a quiet building, one office in six lit. `_2` busy, half of it lit, mostly cool white.
`_3` a warm one, tungsten and desk lamps, blinds down on many bays. `_4` two full floors lit and the rest
dark.

*Emissive:* pure black, the same 8 by 4 grid, only the lit panes carrying flat colour with no glow and no
bleed past the pane edges. Build it by masking the colour map to the pane rectangles.

### `modern/glass-band_1.jpg` + `modern/glass-band_1-emissive.png`

Four floors of a tower that are nothing but glazing, lit.

```
Hyper realistic, extreme realism, photographic. Night photograph of a fully glazed band of a modern tower,
400mm telephoto, dead flat-on. An exact grid of 8 panels across by 4 floors down and nothing but glass: no
spandrel, no wall, only slim dark bronze mullions and a thin floor line between rows. Two thirds of the panels
are lit from behind by cool white ceiling light, the interiors reading as pale depth with a suspended ceiling
grid and the silhouettes of partitions and columns, and the rest are dead black glass holding a dim reflection
of the city. The lit and dead panels group into an irregular block pattern with no symmetry. Slight unevenness
in the coating gives the glass a faint green cast at the panel edges. The picture starts and ends in the
middle of a mullion, and in the middle of the solid band between two floors, so where it repeats the join
makes one whole mullion and one whole floor band and never cuts a window in half. Hyper realistic, hyper
realism, extreme realist.
```

*Emissive:* the same layout, lit panels flat and even, everything else absolute black.

### `modern/window_1.jpg`

One curtain wall unit, close up. Fills the element, not tiled.

```
Hyper realistic, extreme realism, photographic. Photograph of a single modern curtain wall window unit seen
dead-on, filling the frame edge to edge. A slim brushed champagne aluminium frame around the outside, one
vertical mullion splitting it into two lights, blue-green tinted glass with a soft gradient from lighter at
the head to near black at the sill, one long diagonal reflection of a bright sky, and the faint ghost of a
suspended ceiling and a partition behind it. Fine dust along the bottom of the frame and two dried rain spots
on the glass. The subject fills the frame edge to edge, its own frame running right to the edge of the
picture: nothing cropped, no background and no margin around it. Hyper realistic, hyper realism, extreme
realist.
```

### `modern/door_1.jpg` + `modern/door_1-emissive.png`

One entrance leaf. Fills the element.

```
Hyper realistic, extreme realism, photographic. Photograph of one modern glazed entrance door leaf seen
dead-on, filling the frame edge to edge. A brushed stainless steel frame all the way round, a single sheet of
clear glass showing a warm lit lobby behind it with the edge of a reception desk, a polished stone floor and a
wall light, a full height brushed steel pull bar on the left, and a stainless kick plate across the bottom.
Fingerprints and a smear on the glass near the handle. The subject fills the frame edge to edge, its own frame
running right to the edge of the picture: nothing cropped, no background and no margin around it. Hyper
realistic, hyper realism, extreme realist.
```

*Emissive:* black, with a soft warm rectangle where the lobby shows through the glass.

### `modern/balcony_1.jpg`

One balustrade. Fills the element.

```
Hyper realistic, extreme realism, photographic. Photograph of one modern balcony balustrade seen dead-on from
outside, filling the frame edge to edge. A brushed stainless handrail across the top, below it a frameless
panel of clear laminated glass with a green edge tint held by small stainless point fixings, and the dark of
the balcony behind it. Water spots and a faint tide mark low on the glass. No slab, no building around it. The
subject fills the frame edge to edge, its own frame running right to the edge of the picture: nothing cropped,
no background and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

### `modern/concrete_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of smooth precast architectural
concrete panel in flat overcast daylight, warm pale grey with a faint sandy cast, very fine aggregate,
straight vertical form-board lines, small round tie holes in a regular grid, light even mottling from the
pour, one hairline shrinkage crack. New and clean, almost no staining. Seamless and tileable. The picture
starts and ends mid-material, with no feature crossing an edge and no change of tone toward any edge, so where
it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `modern/metal_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 1.5 metre square of brushed stainless steel
cladding panel in flat overcast daylight, cool silver with fine horizontal brush lines, a straight recessed
panel joint crossing it, a row of small countersunk fixings along the joint, faint fingerprints and a very
slight blue cast from the sky. Seamless and tileable. The picture starts and ends mid-material, with no
feature crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible.
Hyper realistic, hyper realism, extreme realist.
```

### `modern/pipe_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of the surface of a painted steel service pipe, one
metre of pipe running from the top of the frame to the bottom and wrapping around from left to right, flat
overcast daylight. Even mid blue-grey powder coat, a raised bolted flange collar crossing near the top, a
painted royal blue identification band below it, faint circular tooling marks, and a soft shading gradient
that is lighter down the middle and darker at both edges so it reads as round. Clean, new, no rust. Seamless
top to bottom and left to right. The picture starts and ends midway between two collars, so where it repeats
along the run the join is invisible and no fitting is cut in half. Hyper realistic, hyper realism, extreme
realist.
```

### `modern/antenna_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 0.6 metre square of hot dip galvanised steel
from a rooftop antenna mast, flat overcast daylight, bright cool grey with the crystalline spangle pattern of
fresh galvanising, faint drip marks, weld spatter, a hex bolt and washer, and one narrow orange-red aviation
warning band crossing the frame. Clean, no rust. Seamless and tileable. The picture starts and ends
mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it repeats the
join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `modern/roof_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph looking straight down at a 3 metre square of light
grey PVC single-ply roofing membrane in flat overcast daylight, faintly textured surface, straight hot-welded
seams crossing at wide even spacing with a slightly raised edge, a scatter of dirt specks, one shallow puddle
stain ringed with silt. Seamless and tileable. The picture starts and ends mid-material, with no feature
crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible. Hyper
realistic, hyper realism, extreme realist.
```

### `modern/screen_1.jpg` + `modern/screen_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of a modern backlit sign panel seen dead-on,
filling the frame edge to edge with no bezel. A flat white acrylic face lit evenly from behind with a faint
darker band at the very edges and the ghost of the LED strips behind it, one horizontal cool grey graphic bar
across the middle. No text, no letters, no logo. The subject fills the frame edge to edge, its own frame
running right to the edge of the picture: nothing cropped, no background and no margin around it. Hyper
realistic, hyper realism, extreme realist.
```

*Emissive:* the same at full brightness on black.

### `modern/neon_1.jpg` + `modern/neon_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of the surface of an architectural LED strip light,
one metre of run from the top of the frame to the bottom, wrapping around from left to right. The middle third
of the frame is a frosted white diffuser lens glowing evenly and slightly brighter down its centre line; the
outer thirds are a dark anodised aluminium housing with fine longitudinal ribs and a thin dark gasket line
where it meets the lens. One slim mounting bracket crosses near the top. Neutral white light, no colour cast.
Seamless top to bottom. The picture starts and ends midway between two collars, so where it repeats along the
run the join is invisible and no fitting is cut in half. Hyper realistic, hyper realism, extreme realist.
```

*Emissive:* black, only the diffuser lit, flat neutral white edge to edge.

### `modern/beacon_1.jpg` + `modern/beacon_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of a small aviation obstruction beacon seen
dead-on, filling the frame. A ribbed fresnel lens of deep translucent red glowing hot at the centre and
falling off to a dark rim, set in a dark grey cage of four thin vertical guard bars with a machined base ring
below and a vented cap above. Condensation beading on the metal. The lens is the only bright thing in the
frame. The subject fills the frame edge to edge, its own frame running right to the edge of the picture:
nothing cropped, no background and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

*Emissive:* black, only the lens disc lit, hottest at the centre.

---

## 6. fifties

A 1950s block. Warm, uneven, patched, and fifty years of weather on it. The lights inside are tungsten.

### `fifties/facade_1.jpg` + `fifties/facade_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Night photograph of a 1950s apartment building facade, taken
with a 400mm telephoto from across the street so the wall fills the frame dead flat-on. An exact grid of 8
window bays across and 4 floors down, every cell the same size. Each cell is a punched rectangular window in
buff yellow brick laid in stretcher bond with pale lime mortar, the frame a painted steel casement in chalky
cream gone to bare metal at the corners, divided by thin glazing bars into six small panes, with a cast stone
sill under it and a brick soldier course over it. Under every sill a grey-brown weathering streak runs down
the brick. One window in five is a sage green vitreous enamel spandrel panel instead of glass, faded and
crazed. About one window in six is lit with warm tungsten light, and every one is different: net curtains
glowing amber, a bare bulb in a hallway, a room where only the top pane shows light, a cold green stairwell
fluorescent, a television flickering blue. Soot darkening along the top of the frame, patches of newer brick,
a rusted bracket. No exterior light source at all. The picture starts and ends in the middle of a mullion, and
in the middle of the solid band between two floors, so where it repeats the join makes one whole mullion and
one whole floor band and never cuts a window in half. Hyper realistic, hyper realism, extreme realist.
```

Vary the four: `_1` red brick instead of buff. `_2` cream render with painted panels. `_3` more enamel
spandrels, fewer windows lit. `_4` heavier soot and more patched brickwork.

*Emissive:* pure black, only the lit windows carrying warm colour, several with only one small pane of the
six glowing.

### `fifties/glass-band_1.jpg` + `fifties/glass-band_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Night photograph of a 1950s office building's glazed floors,
400mm telephoto, dead flat-on. An exact grid of 8 panels across by 4 floors down, steel framed, each panel a
large pane divided by one thin horizontal transom, the frames painted a chalky pale grey. Two thirds of the
panels are lit by warm tungsten and cold green fluorescent in roughly equal measure, the interiors showing
bare ceiling fittings and the silhouettes of filing cabinets and desks; the rest are dark glass with a dull
reflection. The lit and dark panels group irregularly. Old wavy glass, dirt in the frame corners. The picture
starts and ends in the middle of a mullion, and in the middle of the solid band between two floors, so where
it repeats the join makes one whole mullion and one whole floor band and never cuts a window in half. Hyper
realistic, hyper realism, extreme realist.
```

*Emissive:* the same layout, lit panels flat, everything else black.

### `fifties/window_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of one 1950s painted steel casement window seen
dead-on, filling the frame edge to edge. A chunky steel frame in chalky cream paint flaking to red oxide
primer and bare metal at the corners, thin glazing bars dividing it into six small panes, a small brass handle
and stay. The glass is old and slightly wavy, dull grey-green, one pane showing the edge of a net curtain,
another with a fine crack, hardened putty and collected dirt in the corners. The subject fills the frame edge
to edge, its own frame running right to the edge of the picture: nothing cropped, no background and no margin
around it. Hyper realistic, hyper realism, extreme realist.
```

### `fifties/door_1.jpg` + `fifties/door_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of one 1950s panelled timber entrance door seen
dead-on, filling the frame edge to edge. Six moulded panels painted a muted bottle green, the paint worn to
bare wood around the handle and scuffed along the bottom rail, a dulled brass lever handle, letterplate and
number, and a glazed fanlight across the top with a dim warm hallway light behind it. Grain showing through
the paint, a boot scuff low down. The subject fills the frame edge to edge, its own frame running right to the
edge of the picture: nothing cropped, no background and no margin around it. Hyper realistic, hyper realism,
extreme realist.
```

*Emissive:* black, a dim warm rectangle at the fanlight only.

### `fifties/balcony_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of one 1950s balcony balustrade seen dead-on from
outside, filling the frame edge to edge. A painted steel railing of thin vertical bars with a flat top rail
and a flat bottom rail, pale blue paint chalked and flaking to rust at every weld, rust stains bleeding down
from each baluster foot. The space behind the bars is dark. No slab, no building around it. The subject fills
the frame edge to edge, its own frame running right to the edge of the picture: nothing cropped, no background
and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

### `fifties/concrete_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of weathered 1950s board-formed
concrete in flat overcast daylight, warm grey going brown, the horizontal grain of the timber shuttering
pressed into the surface, misaligned board lines, a line of tie holes with rust bleeding from some of them,
patches of darker repair mortar, blown surface showing grey aggregate, green algae in the low areas, water
streaks running down. Seamless and tileable. The picture starts and ends mid-material, with no feature
crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible. Hyper
realistic, hyper realism, extreme realist.
```

### `fifties/metal_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 1.5 metre square of old painted steel sheet in
flat overcast daylight, chalky pale blue paint over red oxide primer, blistering and peeling in patches to
orange rust, a riveted lap joint crossing the frame with round rivet heads, rust bleeding from every rivet, a
dent. Seamless and tileable. The picture starts and ends mid-material, with no feature crossing an edge and no
change of tone toward any edge, so where it repeats the join is invisible. Hyper realistic, hyper realism,
extreme realist.
```

### `fifties/pipe_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of the surface of an old cast iron rainwater pipe,
one metre of pipe from the top of the frame to the bottom, wrapping around from left to right, flat overcast
daylight. Thick dark green paint applied over many years, blistered and peeling to red-brown rust, a raised
socket joint crossing near the top with a lip of hardened lead caulking, rust streaks running down from it,
pale limescale, and a soft shading gradient lighter in the middle and darker at both edges so it reads as
round. Seamless top to bottom. The picture starts and ends midway between two collars, so where it repeats
along the run the join is invisible and no fitting is cut in half. Hyper realistic, hyper realism, extreme
realist.
```

### `fifties/antenna_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 0.6 metre square of old aluminium television
aerial tubing in flat overcast daylight, dull chalky grey-white oxidised metal, fine longitudinal drawing
lines, pitting and white powdery corrosion in patches, a rusted steel bolt and washer with a rust stain
running from it, remnants of a faded red painted band. Seamless and tileable. The picture starts and ends
mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it repeats the
join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `fifties/roof_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph looking straight down at a 3 metre square of old
tar and gravel built-up roofing in flat overcast daylight, grey-brown chippings of uneven size pressed into
black bitumen, bare patches where the chippings have washed away showing shiny tar, a rectangular patch of
newer black repair felt with a brushed edge, small blisters, a puddle stain ringed with silt, a few dead
leaves. Seamless and tileable. The picture starts and ends mid-material, with no feature crossing an edge and
no change of tone toward any edge, so where it repeats the join is invisible. Hyper realistic, hyper realism,
extreme realist.
```

### `fifties/screen_1.jpg` + `fifties/screen_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of a 1950s vitreous enamel advertising panel seen
dead-on, filling the frame edge to edge with no bezel. Enamel on steel, a faded cream ground with a wide muted
red border band and one horizontal red band across the middle, the surface crazed and chipped to black metal
at the corner fixing holes with rust creeping in. No text, no letters, no logo. The subject fills the frame
edge to edge, its own frame running right to the edge of the picture: nothing cropped, no background and no
margin around it. Hyper realistic, hyper realism, extreme realist.
```

*Emissive:* black, or a very dim warm wash if the sign is meant to be lit from a lamp above.

### `fifties/neon_1.jpg` + `fifties/neon_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of the surface of an old neon tube in its bracket,
one metre of run from the top of the frame to the bottom, wrapping around from left to right. The middle third
is glass tubing glowing warm amber, hot down the centre line and falling off to the sides, with the faint dark
line of the electrode wire behind it; the outer thirds are a painted steel channel in flaking cream paint with
rust at the fixings. One bracket crosses near the top. Seamless top to bottom. The picture starts and ends
midway between two collars, so where it repeats along the run the join is invisible and no fitting is cut in
half. Hyper realistic, hyper realism, extreme realist.
```

*Emissive:* black, only the tube lit.

### `fifties/beacon_1.jpg` + `fifties/beacon_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of an old aviation obstruction light seen dead-on,
filling the frame. A ribbed red glass lens glowing warm at the centre, set in a painted cast aluminium cage of
four guard bars, the paint chalked and rusting at the base ring, condensation inside the glass. The lens is
the only bright thing in the frame. The subject fills the frame edge to edge, its own frame running right to
the edge of the picture: nothing cropped, no background and no margin around it. Hyper realistic, hyper
realism, extreme realist.
```

*Emissive:* black, only the lens disc lit.

---

## 7. cyber

The family in the references. The mass is almost pure black and the building is drawn entirely by its
lights: hundreds of tiny hard-edged rectangles, no two the same, cool white and teal with amber, red and the
occasional magenta.

**The wall sits around 8 to 12 out of 255.** Not dark grey. Pull the levels down before shipping and check
against the darkest thing in the reference. Anything that lifts the wall off black kills the whole family.

### `cyber/facade_1.jpg` + `cyber/facade_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Night photograph of a futuristic megastructure facade, taken
with a 600mm telephoto from a great distance so the wall fills the frame dead flat-on. An exact grid of 8
window bays across and 4 floors down, every cell the same size. The wall is near-black composite panel, matte
and slightly wet, with fine panel joints, recessed service channels, bundled conduit running vertically and
small stencilled maintenance decals in dim grey. Each cell holds a narrow horizontal window slit set deep
behind a dark reveal, split by two thin black mullions into three lights. About half the slits glow,
hard-edged and tiny: cold white, pale cyan, teal, warm amber, deep orange-red, one magenta, every one a
different brightness, many only partly lit so a single light of the three is on or a sliver glows along one
end. Long thin horizontal streaks of reflected city light cross the dark glass. Extremely dark overall, the
lights doing all the work, deep black between them. The picture starts and ends in the middle of a mullion,
and in the middle of the solid band between two floors, so where it repeats the join makes one whole mullion
and one whole floor band and never cuts a window in half. Hyper realistic, hyper realism, extreme realist.
```

Vary the four: `_1` mostly cold white and cyan. `_2` amber and red, denser. `_3` sparse, big runs of total
darkness. `_4` more conduit and decals on the panel, windows in tight clusters.

*Emissive:* pure black, the same grid, only the lit slits carrying flat hard-edged colour, no glow, no halo,
no bleed past the edges.

### `cyber/glass-band_1.jpg` + `cyber/glass-band_1-emissive.png`

The lit block partway up a black tower.

```
Hyper realistic, extreme realism, photographic. Night photograph of a wall of large backlit panels on a dark
tower, 600mm telephoto, dead flat-on. An exact grid of 8 panels across by 4 floors down, each panel a flat
rectangle of glass in a near-black mullion frame with a visible gasket line. Two thirds of the panels burn a
saturated warm red-orange, flat and even across the panel with one brighter streak near the top edge where the
glass catches its own light; a few are dimmed right down to a dull ember, and the rest are dead black with a
faint grey reflection. The lit, dimmed and dead panels form an irregular blocky pattern with no symmetry,
several lit panels touching to make larger blocks. The frame between panels is near black. The picture starts
and ends in the middle of a mullion, and in the middle of the solid band between two floors, so where it
repeats the join makes one whole mullion and one whole floor band and never cuts a window in half. Hyper
realistic, hyper realism, extreme realist.
```

Vary the four: `_1` red-orange. `_2` cold cyan-white. `_3` amber. `_4` magenta into deep blue.

*Emissive:* the same layout, lit panels at full brightness, dimmed ones at about a fifth, everything else
absolute black.

### `cyber/window_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of one recessed futuristic window unit seen
dead-on, filling the frame edge to edge. A near-black machined frame with a deep reveal throwing the pane into
shadow, two thin mullions splitting it into three lights, very dark glass with a faint teal tint, one long
horizontal streak of reflected city light across it, a thin cyan LED line along the bottom edge of the frame,
a small stencilled code and two hex bolts on the frame. Very dark, high contrast, wet looking. The subject
fills the frame edge to edge, its own frame running right to the edge of the picture: nothing cropped, no
background and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/door_1.jpg` + `cyber/door_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of one heavy sliding blast door seen dead-on,
filling the frame edge to edge. A near-black armoured panel split down the middle into two leaves with a deep
shadow gap between them, recessed hex bolts around the edge, a black and yellow hazard chevron band across the
bottom, a stencilled unit number, a thin cyan LED strip down each side of the gap and a small amber keypad at
waist height on the right. Scuffed metal, oil marks near the bottom, wet sheen. The subject fills the frame
edge to edge, its own frame running right to the edge of the picture: nothing cropped, no background and no
margin around it. Hyper realistic, hyper realism, extreme realist.
```

*Emissive:* black, only the two cyan strips and the amber keypad lit.

### `cyber/balcony_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of one futuristic balcony balustrade seen dead-on
from outside, filling the frame edge to edge. A dark steel frame filled with fine perforated mesh, a flat top
rail with a thin magenta neon tube run along its underside, vertical stiffener ribs, a stencilled code plate,
cable ties and a bundled cable along the bottom rail. The space behind the mesh is black. Wet sheen on the
metal. The subject fills the frame edge to edge, its own frame running right to the edge of the picture:
nothing cropped, no background and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/concrete_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of dark stained megastructure
concrete at night under weak ambient light, cool near-black grey, coarse board-form lines, long vertical water
streaks and chemical staining, patches of damp, drill holes and anchor stubs, a torn poster remnant, a faded
spray tag in dull magenta, grit in the recesses, wet sheen in places. Seamless and tileable. The picture
starts and ends mid-material, with no feature crossing an edge and no change of tone toward any edge, so where
it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/metal_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 1.5 metre square of dark gunmetal armoured
panel at night under weak ambient light, near black with fine machining lines, a recessed seam crossing the
frame with hex bolts along it, a stencilled serial code in dim white, oil staining, condensation beading, a
hazard chevron corner. Seamless and tileable. The picture starts and ends mid-material, with no feature
crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible. Hyper
realistic, hyper realism, extreme realist.
```

### `cyber/pipe_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of the surface of an industrial conduit at night,
one metre of run from the top of the frame to the bottom, wrapping around from left to right. Dark gunmetal
armoured sheath with fine longitudinal ribbing, a heavy machined collar crossing near the top with hex bolts,
a black and yellow hazard chevron band below it, a thin glowing cyan coolant line running the full length,
stencilled serial codes in dim white, oil staining and condensation, and a soft shading gradient lighter in
the middle and darker at both edges so it reads as round. Seamless top to bottom. The picture starts and ends
midway between two collars, so where it repeats along the run the join is invisible and no fitting is cut in
half. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/antenna_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph of a 0.6 metre square of dark anodised steel from a
rooftop antenna array at night, near-black matte metal with fine machining lines, a red-orange aviation
warning band crossing the frame, stencilled white warning glyphs, hex bolts and welded gusset plates, a small
recessed marker light housing glowing teal, condensation and thin rust bleed at the welds. Seamless and
tileable. The picture starts and ends mid-material, with no feature crossing an edge and no change of tone
toward any edge, so where it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/roof_1.jpg`

```
Hyper realistic, extreme realism, photographic. Photograph looking straight down at a 3 metre square of dark
industrial roof membrane at night, near black with a fine grain, straight welded seams, standing water and
condensate with an oily rainbow sheen, faded painted yellow deck markings and a stencilled number worn away,
cable runs pinned flat, grit in the low areas. Seamless and tileable. The picture starts and ends
mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it repeats the
join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/screen_1.jpg` + `cyber/screen_1-emissive.png`

The advertising panel. This is the loud one, so give the four variants different content.

```
Hyper realistic, extreme realism, photographic. Photograph of a large outdoor LED advertising screen at night
seen dead-on, filling the frame edge to edge with no bezel. A single stylised subject in flat saturated colour
fills the whole panel: an abstract figure in electric cyan and white against deep blue, simplified into large
blocks with hard edges, blooming out at its brightest. A visible halftone dot matrix over the whole image,
horizontal scanline banding, one band of colour tearing a third of the way down, a few dead black pixel rows,
faint chromatic fringing on the high contrast edges. Very high contrast, black is truly black. No text, no
letters, no logo. The subject fills the frame edge to edge, its own frame running right to the edge of the
picture: nothing cropped, no background and no margin around it. Hyper realistic, hyper realism, extreme
realist.
```

Vary the four: `_1` the figure above. `_2` a data wall: rows of cyan bars, a waveform, blocks of glyph-like
marks that suggest characters without being any alphabet, amber and red status squares. `_3` a magenta and
deep blue gradient with hard geometric shapes cutting across it. `_4` a mostly dark panel with one small
bright element and a lot of black.

*Emissive:* the same image at full brightness on black.

### `cyber/neon_1.jpg` + `cyber/neon_1-emissive.png`

Generate this white and let the material tint it: one picture gives cyan, magenta, red and amber.

```
Hyper realistic, extreme realism, photographic. Photograph of a thin architectural neon tube at night, one
metre of run from the top of the frame to the bottom, wrapping around from left to right. The middle of the
frame is the tube itself, a hot white core blowing out to pure white down its centre line and falling off
sharply to either side; the outer edges are a narrow dark matte housing that disappears against the night. One
slim mounting clip crosses near the top. Neutral white, no colour cast, no visible bracket detail beyond the
clip. Seamless top to bottom. The picture starts and ends midway between two collars, so where it repeats
along the run the join is invisible and no fitting is cut in half. Hyper realistic, hyper realism, extreme
realist.
```

*Emissive:* black, only the tube lit, a hot white core falling off to the sides.

### `cyber/beacon_1.jpg` + `cyber/beacon_1-emissive.png`

```
Hyper realistic, extreme realism, photographic. Photograph of an aviation obstruction beacon on a mast tip at
night, seen dead-on and filling the frame. A ribbed lens burning deep red, blown out to white at the centre
and falling off to a dark rim, set in a near-black cage of four thin guard bars with a machined base ring and
a vented cap. Condensation on the metal, everything except the lens almost black. The subject fills the frame
edge to edge, its own frame running right to the edge of the picture: nothing cropped, no background and no
margin around it. Hyper realistic, hyper realism, extreme realist.
```

Also make a teal version for roof corner markers: `cyber/beacon_2.jpg`, same prompt with the lens burning
teal-green.

*Emissive:* black, only the lens disc lit, hottest at the centre.

---

## 8. After generating

1. **Lay it out 3 by 3** before anything else. A seam, or a feature that reads as a polka dot, means
   regenerate rather than retouch.
2. **Check the grid** on `facade` and `glass-band`: the panes have to land on the pixel coordinates in
   section 2. Nudge with an offset if the model drifted a few pixels; regenerate if it did not build a clean
   8 by 4.
3. **Build the emissive from the colour map**, masked to the pane rectangles, black elsewhere. Generating it
   as a second free image never lines up.
4. **Derive normal, roughness and AO** from the colour map in Substance Sampler or Materialize. Keep normals
   shallow: these are seen from tens of metres and a strong normal reads as noise.
5. **Downsample to the ship size** in section 3. Colour to JPEG, emissive to PNG.
6. **Check the darkness** on the cyber family: the wall should sit around 8 to 12 out of 255.
7. **Drop them in** `<home>/textures/<style>/` and run `buildings style` to confirm they were picked up.

---

Sources for section 4: [Midjourney tile docs](https://docs.midjourney.com/docs/tile),
[Best prompts for Midjourney --tile](https://aituts.com/midjourney-tile/),
[Making seamless textures](https://virtuall.pro/blog/making-seamless-texture),
[ComfyUI seamless tiling nodes](https://www.runcomfy.com/comfyui-nodes/ComfyUI-seamless-tiling),
[Tiled Diffusion](https://arxiv.org/html/2412.15185v1),
[Image to game-ready PBR](https://www.playtex.ai/blog/converting-an-image-to-a-game-ready-texture-with-playtex-ai),
[AI seamless texture generators 2026](https://seamlesscanvas.com/blog/best-ai-seamless-texture-generators).
