# Texture prompt pack

Three families of building textures, generated with an image model and dropped into the kit: **modern**,
**fifties**, **cyber**. Every family covers the same nine surfaces, so a building can be switched from one
family to another without touching geometry.

Read section 1 before generating anything: the facade tile has to land on an exact grid or the windows will
not line up with the geometry that cuts them.

---

## 1. What the kit does with these

### The facade tile is a grid, not a picture of a building

The wall lays its own UVs: **one row of the tile per floor, one bay per 3 m of face**. The default tile is
**8 bays across by 4 floors down**, so one tile covers 24 m by 12.8 m of wall and repeats from there.

So the image must be a clean 8 by 4 grid of identical-sized cells, seamless left to right and top to bottom.
A photo of a real tower does not work: the perspective, the corner and the sky are all baked in.

### Where the glass sits inside a cell

Geometry that cuts a real window uses the same rectangle the texture draws, so drawn glass and cut glass are
the same window. At **2048 x 1024** each cell is **256 x 256 px**, and inside a cell, measured from its own
top-left corner:

| Part | X | Y |
| --- | --- | --- |
| glass pane | 23 to 233 (210 wide) | 51 to 159 (108 tall) |
| spandrel band under the glass | 0 to 256 | 159 to 241 |
| floor line / head band | 0 to 256 | 241 to 256, and 0 to 51 |
| mullion, each side of the glass | 0 to 23 and 233 to 256 | full height |

Cell `c,r` starts at `x = c * 256` (c is 0 to 7) and `y = r * 256` (r is 0 to 3). Halve every number for a
1024 x 512 tile. These proportions come from `pane` in `boxes/materials`, and they can be changed there if a
family wants a different window shape, as long as texture and code agree.

### Two maps, pixel for pixel

- **Colour**: the wall, the mullions, the spandrel, the glass. Lit windows appear here too.
- **Emissive**: pure black everywhere except the lit panes, which carry the light colour. This is what makes
  a window glow at night while the wall stays flat.

Generate the colour map first, then build the emissive from it: the pane rectangles are at known pixel
coordinates, so mask them out, keep the lit ones, and fill everything else with black. That guarantees the
two maps register. Generating the emissive as a second free image never lines up.

**No bloom, no glare, no lens flare in the map.** The halo around a light belongs to the renderer. Baked in,
it repeats every 24 m and reads as a pattern.

---

## 2. How to prompt a tileable texture

What holds across every tool:

1. Say **seamless** and **tileable** in the prompt, and say what it is a texture *of*, never a scene.
2. **Orthographic, flat, straight-on view.** No perspective, no camera angle, no horizon, no sky, no ground.
3. **Even lighting, no light direction.** A texture with a light source baked in fights the engine's own.
4. **Even detail across the frame.** Anything the model puts in the middle becomes a polka dot when it tiles.
5. **State the scale** ("a 3 metre square of", "eight window bays wide"). Models default to a close-up.
6. **1:1 tiles best.** For the facade tile, 2:1 is worth the small extra work because the bays stay square.
7. **Do not upscale a tile.** Upscalers repaint the edges and the seam comes back. Generate at final size.
8. Generate the maps you can see. **Normal, roughness, height and AO come afterwards** from the colour map.

Per tool:

- **Midjourney v7**: `--tile` for real edge matching, works with `--ar 2:1`. Skip the upscale step.
- **Local (SDXL, Flux, ComfyUI)**: asymmetric tiling / circular padding patched into the UNet and the VAE,
  with per-axis control. This is the one to use for the facade tile, where X and Y both have to wrap.
- **Anything else**: generate at 2x, then fix the seam by hand with an offset filter and a heal pass.

Deriving the rest of the maps from the colour map is reliable now on photographic input: Substance Sampler,
Materialize, or any of the current image-to-PBR services. Do not ask the image model for a normal map.

### The technical suffix

Append to every prompt in this pack:

```
seamless tileable texture, orthographic front view, flat even ambient lighting, no directional light,
no cast shadows, no perspective, no vignette, uniform detail across the whole frame, edge to edge pattern,
photorealistic material study, sharp focus, no depth of field
```

### The negative prompt

```
perspective, camera angle, horizon, sky, ground, street, people, cars, trees, vignette, border, frame,
watermark, text overlay, signature, blur, depth of field, bokeh, lens flare, bloom, glare, HDR glow,
dramatic lighting, sunset, cast shadow, tilted, curved, fisheye, collage, seams, mismatched edges
```

---

## 3. Dimensions

| Surface | Layout | Generate at | Ship at | Maps |
| --- | --- | --- | --- | --- |
| facade | 8 bays x 4 floors, seamless both axes | 2048 x 1024 | 1024 x 512 | colour, emissive |
| window pane | one window, fills the element, not tiled | 512 x 512 | 256 x 256 | colour |
| concrete | 3 m square, seamless | 1024 x 1024 | 512 x 512 | colour |
| pipe | wraps around the pipe on X, 1 m of run on Y, seamless | 512 x 512 | 256 x 256 | colour |
| antenna | 0.6 m square, seamless | 512 x 512 | 256 x 256 | colour |
| door | one door leaf, not tiled | 512 x 1024 | 256 x 512 | colour, emissive |
| balcony | one balustrade, not tiled | 1024 x 512 | 512 x 256 | colour |
| roof deck | 3 m square, seamless | 1024 x 1024 | 512 x 512 | colour |
| sign | one panel, not tiled | 1024 x 512 | 512 x 256 | colour, emissive |

**Shipping sizes matter here.** These textures are embedded in the GLB and the file gets placed by the
thousand. Colour maps ship as JPEG, emissive as PNG (black compresses to nothing), and both stay in core
glTF: WebP needs an extension, and this project keeps `extensionsRequired` empty. Budget roughly 150 kB of
texture per building for a hero, 40 kB for one in the crowd.

Colour and emissive are sRGB. Normal, roughness and AO are linear.

---

## 4. Modern

A curtain wall tower, present day. Cold, flat, machined. The wall is mostly glass and the glass is mostly
dark, which is what makes the lit windows read.

**Style suffix for this family:** `contemporary commercial architecture, anodised aluminium and low-iron
glass, precise machined edges, cool neutral grey palette, clean and unweathered`

### 4.1 Facade, colour

*A flat sheet of curtain wall: four floors of glazing, eight bays across, aluminium mullions, a dark spandrel
band under each row of glass, most panes dark and a scattering of them lit from inside.*

```
Seamless tileable texture of a modern glass curtain wall facade, arranged as an exact grid of 8 window bays
across and 4 floors down, every cell identical in size. Each cell has a wide low horizontal glass pane set
between slim brushed aluminium mullions, a matte dark grey spandrel panel below the glass, and a thin
aluminium floor line above it. The glass is very dark blue-grey low-emissivity glazing, near black, with a
faint cool sheen at the top of each pane where it catches the sky and a slight green tint at the edges.
About a quarter of the panes are lit from inside at night: cool white office light showing a ceiling grid
and desks as soft blocks, a few warmer, some with venetian blinds half lowered so only the lower half glows,
some lit only at one end. No two lit windows the same brightness or colour. The rest of the panes are dark
with dim grey reflections. Flat frontal elevation, no building edges, no sky, no roof.
```

### 4.2 Facade, emissive

*The same grid, pure black, with only the lit panes carrying colour.*

```
Seamless tileable emissive light map for a modern office facade, pure black background, 8 columns by 4 rows
of window rectangles in the same positions as the colour map. Only about one pane in four carries light. The
lit rectangles are flat blocks of colour with no glow, no halo and no bleed past the pane edges: mostly cool
white at 4500 Kelvin, some warm white at 2900 Kelvin, a few pale green fluorescent, one or two dim blue from
a screen. Brightness varies widely from pane to pane, some almost blown out white and others barely visible.
Several panes are only partly lit, a horizontal sliver at the top or the bottom of the rectangle. Everything
outside the window rectangles is absolute black.
```

### 4.3 Window pane

*One curtain wall unit, close up: frame, mullion, glass with a soft sky gradient.*

```
Texture of one modern curtain wall window unit seen straight on, filling the frame edge to edge. A slim
brushed aluminium frame runs around the outside, a single vertical mullion splits the unit into two lights,
and the glass is dark blue-grey with a faint cool gradient from lighter at the top to near black at the
bottom, one soft diagonal reflection streak, and the ghost of a ceiling line visible behind it. Sharp clean
metal, no dirt, no rain marks.
```

### 4.4 Concrete

*Precast panel, smooth, pale grey, faint form lines and tie holes.*

```
Seamless tileable texture of a 3 metre square of smooth precast architectural concrete panel, pale warm
grey, very fine sandy aggregate, faint straight form-board lines running vertically, small round tie holes
in a regular grid, a light even mottling from the pour, one or two hairline shrinkage cracks. Clean and new,
almost no staining. Flat frontal view.
```

### 4.5 Pipe

*Painted steel service pipe: bands across, clean paint, a flange.*

```
Seamless tileable texture for the surface of a painted steel service pipe, one metre of pipe running from
the top of the image to the bottom, wrapping around from left to right. Even mid grey powder-coated paint,
a raised bolted flange collar crossing the image horizontally near the top, a thin painted identification
band in blue below it, faint circular tooling marks, a soft vertical shading gradient that is lighter down
the middle and darker at both edges so it reads as round. Clean, new, no rust.
```

### 4.6 Antenna

*Galvanised steel, hot dip mottle, one thin warning band.*

```
Seamless tileable texture of hot-dip galvanised steel used on a rooftop antenna mast, bright cool grey with
the crystalline spangle pattern of fresh galvanising, faint drip marks, a few small weld spatter dots, tiny
bolt heads, and one narrow orange-red aviation warning band crossing the image horizontally. Clean, sharp,
no rust.
```

### 4.7 Door

*A full-height glazed entrance leaf: stainless frame, kick plate, pull bar.*

```
Texture of one modern glazed entrance door leaf seen straight on, filling the frame. A brushed stainless
steel frame runs all the way around, the leaf is a single sheet of clear glass showing a dim warm lobby
behind it with a reception desk edge and a floor line, a full-height brushed steel pull bar sits on the left,
and a brushed steel kick plate runs across the bottom. Fingerprints on the glass near the handle. Flat
frontal elevation, no surroundings.
```

*Emissive for the door: black everywhere, a soft warm rectangle where the glass is, so an entrance reads at
night.*

### 4.8 Balcony

*Frameless glass balustrade with a stainless handrail on a concrete slab edge.*

```
Texture of one modern balcony balustrade seen straight on from outside, filling the frame. A brushed
stainless steel handrail runs across the top, below it a frameless panel of clear laminated glass with a
green edge tint and a few faint water spots, held by small stainless point fixings, and along the bottom a
pale grey concrete slab edge with a clean drip groove. The space behind the glass is dark. Flat frontal
elevation.
```

### 4.9 Roof deck

*Light PVC membrane with welded seams.*

```
Seamless tileable texture of a 3 metre square of light grey PVC single-ply roofing membrane, faintly
textured surface, straight welded seams crossing the image at wide even spacing with a slightly raised
edge, a scatter of small dirt specks and a few shallow puddle stains. Flat top-down view.
```

### 4.10 Sign

*A clean backlit corporate panel.*

```
Texture of one modern backlit sign panel seen straight on, filling the frame. Flat white acrylic face in a
slim brushed aluminium tray, evenly lit from behind with a faint darker band at the very edges, one
horizontal grey graphic bar across the middle. No text, no logo.
```

---

## 5. Fifties

A 1950s block: brick or render, punched windows in painted steel frames, coloured enamel spandrel panels,
and fifty years of weather on it. Warm, uneven, patched. The lights inside are tungsten, not fluorescent.

**Style suffix for this family:** `mid-century 1950s construction, buff brick and painted steel, muted
sage green and cream enamel panels, weathered and patched, soot streaks and rust bleed`

### 5.1 Facade, colour

*Four floors of punched windows in buff brick, painted steel frames divided into small lights, stone sills,
weathering under every opening.*

```
Seamless tileable texture of a 1950s apartment building facade, arranged as an exact grid of 8 window bays
across and 4 floors down, every cell identical in size. Each cell is a punched rectangular window in a wall
of buff yellow-brown brick laid in stretcher bond with pale mortar. The window is a painted steel frame,
cream paint gone chalky and flaking at the corners, divided by thin glazing bars into six small lights, with
a pale cast stone sill under it and a shallow brick soldier course over it. Below each sill a grey-brown
weathering streak runs down the brick. One window in five is a sage green enamel spandrel panel instead of
glass, faded and chalky. The glass is dull grey-green, some panes showing net curtains, some a drawn blind,
a few lit warm from inside. Soot darkening along the top of the image, small patched areas of newer brick,
a rusted bracket or two. Flat frontal elevation, no building edges, no sky.
```

### 5.2 Facade, emissive

*Sparser than modern, warmer, more uneven.*

```
Seamless tileable emissive light map for a 1950s apartment facade, pure black background, 8 columns by 4
rows of window rectangles in the same positions as the colour map. Only about one window in six carries
light, and no two are alike. The lit rectangles are warm tungsten orange at 2400 to 2900 Kelvin, dim and
uneven, several partly blocked so only a corner or one small pane of the six glows, a couple dulled to a
soft brown by a curtain, one or two much colder pale green from a stairwell fluorescent tube, one flickering
blue-grey from a television. Flat blocks of colour, no glow, no halo, no bleed past the window edges.
Everything else absolute black.
```

### 5.3 Window pane

*One steel casement, six lights, peeling paint.*

```
Texture of one 1950s painted steel casement window seen straight on, filling the frame. A chunky steel frame
in chalky cream paint, flaking to red oxide primer and bare metal at the corners, thin glazing bars dividing
it into six small panes, a small brass handle and stay. The glass is old and slightly wavy, dull grey-green,
one pane showing the edge of a net curtain, another with a fine crack, dirt collected in the corners of the
putty. Flat frontal elevation.
```

### 5.4 Concrete

*Board-formed, weathered, rust bleed and patching.*

```
Seamless tileable texture of a 3 metre square of weathered 1950s board-formed concrete, warm grey going
brown, the horizontal grain of the timber shuttering pressed into the surface, misaligned board lines, a
line of tie holes some of them bleeding rust, patches of darker repair mortar, a scatter of blown surface
and exposed grey aggregate, faint green algae in the low areas, thin water streaks running down. Flat
frontal view.
```

### 5.5 Pipe

*Cast iron rainwater pipe, painted and gone.*

```
Seamless tileable texture for the surface of an old cast iron rainwater pipe, one metre of pipe running from
the top of the image to the bottom and wrapping around from left to right. Thick dark green paint applied
over many years, blistered and peeling in patches down to red-brown rust, a raised socket joint crossing the
image horizontally near the top with a lip of hardened lead caulking, rust streaks running down from it,
pale lime scale, a soft vertical shading gradient lighter in the middle and darker at both edges so it reads
as round.
```

### 5.6 Antenna

*Old aluminium aerial, oxidised, rusted fixings.*

```
Seamless tileable texture of the aluminium tubing of an old rooftop television aerial, dull chalky grey-white
oxidised metal, fine longitudinal drawing lines, pitting and white powdery corrosion in patches, a rusted
steel bolt and washer, a rusty stain running from it, remnants of a faded red painted band. Flat, even
lighting.
```

### 5.7 Door

*A panelled timber door, painted and worn, with a fanlight above.*

```
Texture of one 1950s panelled timber entrance door seen straight on, filling the frame. Six moulded panels,
painted a muted dark green, the paint worn back to bare wood around the handle and scuffed along the bottom
rail, a brass lever handle and letterplate gone dull, a small brass number, a glazed fanlight across the top
with a dim warm hallway light behind it. Grain showing through the paint, a scuff mark at boot height. Flat
frontal elevation.
```

*Emissive for the door: black everywhere, a dim warm rectangle at the fanlight only.*

### 5.8 Balcony

*Concrete slab with painted steel bar railing, rust bleeding down.*

```
Texture of one 1950s balcony balustrade seen straight on from outside, filling the frame. A painted steel
railing of thin vertical bars with a flat top rail and a flat bottom rail, pale blue paint chalked and
flaking to rust at every weld, set into a concrete slab edge that runs across the bottom of the image with
its arris chipped, rust stains bleeding down the concrete under each baluster, a patch of darker repair
render. The space behind the bars is dark. Flat frontal elevation.
```

### 5.9 Roof deck

*Tar and gravel, patched, blistered.*

```
Seamless tileable texture of a 3 metre square of old tar and gravel built-up roofing, grey-brown chippings
of uneven size pressed into black bitumen, bare patches where the chippings have washed away showing shiny
tar, a rectangular patch of newer black repair felt with a brush-applied edge, small blisters, a puddle
stain ringed with silt, a few dead leaves. Flat top-down view.
```

### 5.10 Sign

*A painted enamel advertising panel, faded.*

```
Texture of one 1950s enamel advertising sign panel seen straight on, filling the frame. Vitreous enamel on
steel, a faded cream ground with a wide muted red border band, the surface crazed and chipped to black
metal at the fixing holes at each corner, rust creeping in from the chips, one horizontal band of faded red
across the middle. No text, no logo.
```

---

## 6. Cyber

The family in the screenshots. The mass is almost pure black and the building is drawn entirely by its
lights: hundreds of tiny hard-edged rectangles, no two the same, cool white and teal with amber, red and the
occasional magenta, plus long neon strip lines, whole panels lit as solid blocks, and wet horizontal
reflection streaks across the dark glass.

Four things carry this family, so they are worth saying in every prompt:

- **The wall is near black.** Not dark grey. The albedo of the wall sits around 8 to 12 out of 255. The
  whole style is contrast: the mass disappears and the lights draw the building. Anything that lifts the
  wall off black kills it, so pull the levels down before shipping and check against the darkest thing in
  the reference.
- **The windows are small, hard-edged and irregular.** Slits and short bars, clustered, with gaps. Not a
  neat grid of squares.
- **Every window is its own state.** Different colour, different brightness, half of them only partly lit.
- **The bright things are few and placed.** A band of full glass floors partway up, neon lines climbing one
  face, a screen standing off another, the crown lit round the parapet, a beacon on each mast tip. Every one
  of those reads because everything around it is black.

**Style suffix for this family:** `dark near-black composite panel megastructure, high density greeble
detail, neon strip lighting, hard-edged emissive rectangles in cyan white amber and red, wet reflective
surfaces, Blade Runner night city`

Two of the surfaces below, the **multi floor neon line** (6.12) and the **fat screen** (6.13), belong to
parts only this family has. Both go on over a face that carries nothing but its window texture: compose the
face plain on purpose, then run the lines up it and stand the screen off it.

### 6.1 Facade, colour

*Four floors of dark layered panel with narrow recessed window slits, thin neon lines at the floor edges,
decals and conduit.*

```
Seamless tileable texture of a futuristic megastructure facade at night, arranged as an exact grid of 8
window bays across and 4 floors down, every cell identical in size. The wall is near-black composite panel,
matte and slightly wet-looking, with fine panel joints, recessed service channels, bundled conduit running
vertically, small vents and stencilled maintenance decals in dim grey. Each cell has a narrow horizontal
window slit set deep into the panel behind a dark reveal, split by two thin black mullions into three
lights. A thin neon strip light runs along the floor line of each row, cold cyan on some rows and dim red on
others. Roughly half the window slits glow: hard-edged rectangles of light, some pure cold white, some
teal-cyan, some warm amber, a few deep red, one magenta, every one a different brightness, many only partly
lit so a sliver glows at one end. Long thin horizontal reflection streaks of distant city light cross the
dark glass. Extremely dark overall, the lights doing all the work. Flat frontal elevation, no building
edges, no sky.
```

### 6.2 Facade, emissive

*This is the map that matters most in this family. Dense, chaotic, no rhythm.*

```
Seamless tileable emissive light map for a futuristic night city facade, pure black background, 8 columns by
4 rows of narrow horizontal window slits in the same positions as the colour map, each slit split into three
small lights. About half of them carry light and no two are the same. Colours: cold white, pale cyan, teal
green, warm amber, deep orange-red, and one or two magenta. Brightness ranges from almost pure white blown
out down to barely visible. Many slits are only partly lit, one of the three lights on and the other two
black, or a thin sliver along the top edge. The lit ones cluster irregularly with runs of complete darkness
between them, never in a rhythm and never two identical neighbours. A continuous thin cyan neon line runs
across the image at each floor line and a dim red one on one of the four. Flat hard-edged blocks of colour,
no glow, no halo, no bleed outside the rectangles. Everything else absolute black.
```

### 6.3 Full glass floors

*The block in the second screenshot: four or five floors of a tower that are nothing but glazing, no wall
between them, the whole band lit while the hundred floors above and below stay black. Panels are big, some
burning bright, some dimmed right down, some dead. This is a section of its own in the stack, not a variant
of the ordinary wall, so it is generated as its own tile: 8 panels across by 4 floors down, seamless, and
the section it dresses is 4 or 5 floors tall.*

Generate one per colour the towers use. Red-orange is the one in the screenshot; cyan and cold white are the
other two worth having.

```
Seamless tileable texture of a fully glazed band of a tower, an exact grid of 8 panels across by 4 floors
down and nothing but glazing, no wall and no spandrel. Each panel is a large flat sheet of glass in a slim
near-black mullion frame with a visible gasket line and a thin floor line between rows. About two thirds of
the panels are lit from behind a saturated warm red-orange, flat and even across the panel with one faint
brighter streak near the top where the glass catches the light; a few of those are dimmed far down to a deep
dull ember, and the rest are dead black glass with a faint grey reflection. The lit, dimmed and dead panels
form an irregular blocky pattern with no symmetry and no repeating rhythm, several lit panels touching to
make larger blocks. The frame between panels is near black. Flat frontal elevation, no perspective, no glow
outside the panels.
```

*Emissive: identical layout, the lit panels flat red-orange at full brightness, the dimmed ones at about a
fifth of it, the dead ones and every mullion absolute black.*

### 6.4 Window pane

*One deep-set slit, close up.*

```
Texture of one recessed futuristic window unit seen straight on, filling the frame. A near-black machined
frame with a deep reveal casting the pane back into shadow, two thin mullions splitting it into three
lights, dark glass with a faint teal tint, one long horizontal streak of reflected city light across it, a
thin cyan LED line along the bottom edge of the frame, a small stencilled code and two hex bolts on the
frame. Very dark, high contrast, wet-looking.
```

### 6.5 Concrete

*Megastructure concrete: dark, stained, tagged.*

```
Seamless tileable texture of a 3 metre square of dark stained megastructure concrete, cool near-black grey,
coarse board-form lines, long vertical water streaks and chemical staining, patches of damp, a scatter of
small drill holes and anchor stubs, torn remnants of a poster, a faded spray-painted tag in dull magenta,
fine grit and dust in the recesses. Wet sheen in places. Flat frontal view.
```

### 6.6 Pipe

*Bundled conduit with a luminous coolant line and hazard marking.*

```
Seamless tileable texture for the surface of an industrial conduit, one metre of run from the top of the
image to the bottom, wrapping around from left to right. Dark gunmetal grey armoured sheath with fine
longitudinal ribbing, a heavy machined collar crossing the image horizontally with hex bolts, a black and
yellow hazard chevron band below it, a thin glowing cyan coolant line running the full length of the pipe,
stencilled serial codes in dim white, oil staining and condensation beading. A soft vertical shading
gradient lighter in the middle and darker at both edges so it reads as round.
```

*Emissive for the pipe: black, with only the cyan coolant line lit.*

### 6.7 Antenna

*Black lattice steel with warning bands and marker light housings.*

```
Seamless tileable texture of the dark anodised steel of a rooftop antenna array, near-black matte metal with
fine machining lines, a red-orange aviation warning band crossing the image horizontally, stencilled white
warning glyphs, hex bolts and welded gusset plates, a small recessed marker light housing glowing teal,
condensation and thin rust bleed at the welds. Flat, even lighting.
```

### 6.8 Door

*A heavy sliding hatch with a lit strip and a keypad.*

```
Texture of one heavy sliding blast door seen straight on, filling the frame. Near-black armoured panel
split down the middle into two leaves with a deep shadow gap between them, recessed hex bolts around the
edge, a black and yellow hazard chevron band across the bottom, a stencilled unit number, a thin cyan LED
strip running down each side of the gap and a small amber keypad panel at waist height on the right. Scuffed
metal, oil marks near the bottom, wet sheen. Flat frontal elevation.
```

*Emissive for the door: black, with the two cyan side strips and the amber keypad lit.*

### 6.9 Balcony

*A steel mesh cage with a neon underlight.*

```
Texture of one futuristic balcony balustrade seen straight on from outside, filling the frame. A dark steel
frame filled with fine perforated mesh, a flat top rail with a thin magenta neon tube run along its
underside, vertical stiffener ribs, a stencilled code plate, cable ties and a bundled cable running along
the bottom rail, a dark grating slab edge across the bottom of the image. The space behind the mesh is
black. Wet sheen on the metal. Flat frontal elevation.
```

### 6.10 Roof deck

*Dark membrane, condensate, painted marks.*

```
Seamless tileable texture of a 3 metre square of dark grey industrial roof membrane, near-black with a fine
grain, straight welded seams, standing water and condensate pooling with an oily rainbow sheen, faded
painted yellow deck markings and a stencilled number partly worn away, cable runs pinned flat to the
surface, grit and dust in the low areas. Flat top-down view.
```

### 6.11 Sign

*A big animated advertising panel, the thing that lights the street.*

```
Texture of one large futuristic advertising panel seen straight on, filling the frame. A dense grid of fine
LED pixels behind a dark glass face, showing a blocky abstract pattern in saturated magenta, cyan and deep
blue with horizontal scanline banding and a few dead black pixel rows, a slim dark metal bezel with vent
slots. No text, no logo, no readable characters.
```

*Emissive for the sign: the same pattern at full brightness on black, bezel excluded.*

### 6.12 Neon line, multi floor

Not a facade texture. This one wraps a **run**: a bright line climbing many floors on one face, several of
them at different positions across the face, laid over a wall that carries nothing but its window texture.
The run already exists in the kit as a mitred tube, so this is the surface it wears.

**Generate it white and tint it per line.** One neutral texture plus a colour on the material gives cyan,
magenta, red, amber and green without five more images. Generate at 512 x 512, ship at 256 x 256, colour
plus emissive, seamless top to bottom (along the run) and left to right (around the tube).

```
Seamless tileable texture for the surface of a neon strip light in a housing, one metre of run from the top
of the image to the bottom, wrapping around from left to right. The left third and right third of the image
are a dark gunmetal extruded aluminium housing with fine longitudinal ribs, small hex bolts and a stencilled
code; the middle third is a frosted white diffuser lens glowing evenly, slightly brighter down its centre
line, with a faint even speckle in the diffuser and a thin dark gasket line down each side where it meets
the housing. A slim mounting bracket crosses the image horizontally near the top. Pure neutral white light,
no colour cast. Clean, wet sheen on the housing.
```

*Emissive: black, with only the middle third lit flat neutral white, edge to edge top to bottom, no glow
past the diffuser edges.*

### 6.13 Fat screen, tall

The big one: a screen standing off a face, spanning many floors. It does not tile and it does not repeat per
floor, so it is generated once per screen at the aspect the screen actually is.

| Screen | World size | Generate at | Ship at |
| --- | --- | --- | --- |
| tall, 5 to 8 floors | about 6 m wide by 20 m tall | 1024 x 3072 | 512 x 1536 |
| very tall, 10 or more floors | about 6 m wide by 35 m tall | 1024 x 4096 | 512 x 2048 |
| wide band, 2 to 3 floors | about 18 m wide by 8 m tall | 3072 x 1365 | 1024 x 455 |

Generate the panel content edge to edge with no bezel: the frame is geometry. Colour and emissive are the
same image, the emissive at full brightness, so the screen lights itself and the engine's bloom does the
rest. Name the material slot per screen so an engine can bind a video to it later; the GLB itself carries
the still.

**screen1, the advert.** A single subject, huge, holding the whole panel.

```
A giant vertical advertising screen, portrait orientation, filling the frame edge to edge with no border and
no bezel. A single stylised subject rendered in flat saturated colour holds the whole panel: a face in
profile in deep magenta and cyan against a black ground, simplified into large blocks of colour with hard
edges. Fine horizontal LED scanline banding runs across the whole image, a subtle RGB pixel grid is visible
up close, one horizontal band of colour tearing sits a third of the way down, a few dead black pixel rows,
faint chromatic fringing on the high contrast edges, and a soft uneven brightness falloff toward the bottom
corners. Very high contrast, black is truly black. No text, no letters, no logo, no watermark.
```

**screen2, the data wall.** Motion and information rather than a subject.

```
A giant vertical information screen, portrait orientation, filling the frame edge to edge with no border and
no bezel. Dense stacked rows of abstract data: thin horizontal bars of cyan and white at varying lengths, a
scrolling waveform, blocks of unreadable glyph-like marks that suggest characters without being any real
alphabet, a column of small square status indicators in amber and red, and one large flat cyan block a third
of the way down. Deep black ground. Fine horizontal LED scanline banding across the whole image, a visible
RGB pixel grid, faint chromatic fringing, a couple of dead pixel rows, a soft horizontal refresh band. Very
high contrast. No readable text, no real letters, no logo, no watermark.
```

**screen3, the wide band.** For the two or three floor strip that wraps a base.

```
A wide horizontal advertising screen, landscape banner orientation, filling the frame edge to edge with no
border and no bezel. A flowing abstract gradient of magenta into deep blue with hard-edged geometric shapes
cutting across it and one bright cyan horizontal rule. Deep black at both ends. Fine horizontal LED scanline
banding, a visible RGB pixel grid, faint chromatic fringing, one dead pixel row, a soft refresh band drifting
through. Very high contrast. No text, no letters, no logo, no watermark.
```

### 6.14 Screen glass

The layer over a screen, if the screen is to read as glass rather than as a lit sticker. Optional: use it as
a second panel a few centimetres in front of the image, or skip it and let the engine's reflections do the
work.

```
Seamless tileable texture of the front glass of a large outdoor LED screen, near-black with a fine regular
RGB subpixel grid, a very faint diagonal reflection streak, dust and dried rain spots collected toward the
bottom, a few fine scratches. Almost entirely dark, the grid barely visible. Flat frontal view.
```

### 6.15 Crown neon and antenna beacon

The crown neon is the **same neon strip from 6.12**, laid along the parapet instead of up a face. It needs
no texture of its own: run it round the roof edge and tint it. That is the red chevron on the roof in the
screenshots, and it is doing most of the work of saying which building you are looking at.

The beacon is the small bright lens on the tip of a mast, and it is the one part of an antenna that is not
dark. Generate at 256 x 256, colour plus emissive, not tiled.

```
Texture of a small aviation obstruction beacon lens seen straight on, filling the frame. A ribbed fresnel
lens of deep translucent red glowing hot at the centre and falling off to a dark rim, set in a dark
gunmetal cage of four thin vertical guard bars with a machined base ring below and a vented cap above,
condensation beading on the metal. The lens is the only bright thing in the image.
```

*Emissive: black, with only the lens disc lit, hottest at the centre. Make a teal version as well: the
corner markers in the screenshots are teal, the mast tips are red.*

---

## 6b. Where the files go

A **pack** is a folder per family, and the CLI reads it at build time:

```
<home>/textures/modern/
<home>/textures/fifties/
<home>/textures/cyber/
```

`<home>` is where projects live (`buildings style` prints the exact path), or wherever `BUILDINGS_TEXTURES`
points. One file per finish, named after it:

```
facade.jpg            facade-emissive.png
glass-band.jpg        glass-band-emissive.png
window.jpg
door.jpg              door-emissive.png
balcony.jpg
concrete.jpg
metal.jpg
pipe.jpg
antenna.jpg
roof.jpg
screen.jpg            screen-emissive.png
neon.jpg              neon-emissive.png
beacon.png            beacon-emissive.png
```

PNG and JPEG only: glTF carries nothing else without an extension, and this project keeps
`extensionsRequired` empty. **Nothing is required.** A folder with one file in it overrides that one finish
and everything else stays drawn from code, so a family can be generated a texture at a time and the build
never stops working. `buildings style` lists what a folder currently carries.

Screens are different: a screen carries its own picture, given per screen with
`buildings screen ... --image path/to/screen1.png`, not through the pack.

## 7. After generating

1. **Check the tile.** Lay it out 3 by 3 before anything else. A seam or a feature that reads as a polka dot
   means regenerate, not retouch.
2. **Check the grid registration** on the facade tiles: the pane rectangles have to land on the pixel
   coordinates in section 1. Nudge with an offset if the model drifted a few pixels; regenerate if it did
   not build a clean 8 by 4.
3. **Build the emissive from the colour map**, masked to the pane rectangles, black elsewhere.
4. **Derive normal, roughness and AO** from the colour map in Substance Sampler or Materialize. Keep normals
   shallow: these are seen from tens of metres away and a strong normal reads as noise.
5. **Downsample to the ship size** in the table, colour to JPEG, emissive to PNG.
6. **Sanity check the darkness.** For the cyber family, the wall in the colour map should sit around 8 to 12
   out of 255. Models drift bright: pull the levels down before shipping.

---

Sources for section 2: [Midjourney tile docs](https://docs.midjourney.com/docs/tile),
[Best prompts for Midjourney --tile](https://aituts.com/midjourney-tile/),
[Making seamless textures](https://virtuall.pro/blog/making-seamless-texture),
[ComfyUI seamless tiling nodes](https://www.runcomfy.com/comfyui-nodes/ComfyUI-seamless-tiling),
[Tiled Diffusion](https://arxiv.org/html/2412.15185v1),
[Image to game-ready PBR](https://www.playtex.ai/blog/converting-an-image-to-a-game-ready-texture-with-playtex-ai),
[AI seamless texture generators 2026](https://seamlesscanvas.com/blog/best-ai-seamless-texture-generators).
