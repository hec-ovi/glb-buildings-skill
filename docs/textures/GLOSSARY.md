# Texture resource glossary

Every file under `textures/`, with a short description and the prompt (or source) used to make it.
Colour maps are JPEG. Emissive maps are PNG built from the colour map (lit pixels kept, rest black), not free-generated.

Pack root: `./textures/<style>/`. Ads: `./textures/cyber/ads/`. Override path: `BUILDINGS_TEXTURES`.

Primary prompt sources: [PROMPTS.md](PROMPTS.md), [ADS.md](ADS.md).

---

## Finish names

| Finish | Description |
| --- | --- |
| `facade` | Night curtain-wall tile: grid of window bays + spandrels, seamless, carries most of the tower face. |
| `glass-band` | Full-glaze floors only: lit/dead glass panels in a mullion grid, no solid wall. |
| `wall` | Blank cladding with NO windows: material of floors you punch openings into. |
| `base` | Street-level solid cladding, no openings: plinth under the entrance. |
| `window` | Single window unit filling an element (not a tiling wall). |
| `door` | Single door leaf filling an element; may glow through glass (emissive). |
| `balcony` | Balustrade / rail only, filling the balcony edge element. |
| `concrete` | Monotonous cast concrete field, tiles by the metre. |
| `metal` | Monotonous metal cladding field, tiles by the metre. |
| `pipe` | Service pipe surface wrap (cylindrical shade), seamless. |
| `antenna` | Mast / galvanised metal field, seamless. |
| `roof` | Roof membrane from above, seamless. |
| `screen` | LED / sign panel face filling the screen element (emissive). |
| `neon` | A lit tube. Takes no picture: flat colour emitting that colour, tinted per line. |
| `beacon` | The lens on a mast tip. Takes no picture either, same reason. |
| `ads/*` | Screen ad images (not pack finishes): path passed to `buildings screen ... --image`. |

---

## Shared prompt appends

### Colour / material generation (from PROMPTS.md)

```
seamless tileable texture, shot dead flat-on with a long telephoto lens so there is no perspective and no
convergence, sharp across the whole frame, even detail edge to edge, no vignette, no depth of field,
hyper realistic, extreme realism
```

### Extra for pure material tiles (concrete, metal, pipe, antenna, roof)

```
Strictly monotonous seamless PBR albedo tile of material alone. The entire frame is one continuous surface
with only fine, even micro-detail. No objects, no screws, no bolts, no rivets, no flanges, no labels, no text,
no numbers, no warning stripes, no colour bands, no logos, no hardware, no puddles, no cracks as a hero
feature, no centered marks, no borders, no frames, no vignette, no colour blocks, no gradient shapes, no
composition. Darker low-key exposure. High quality photographic grain of the material, nothing else.
```

### Ads (from ADS.md)

```
advertising image filling the frame edge to edge, no border, no bezel, no frame, no margin, deep black
background, very high contrast, hyper realistic, extreme realism, sharp, cinematic
```

---

## Inventory by style

## modern

### `modern/antenna_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless tile of hot-dip galvanised steel only, darker
cool grey crystalline spangle grain filling the whole frame evenly, no bolt, no washer, no weld blob, no
warning band, no stripe, no drip as a hero mark. Continuous metal field only. Seamless and tileable. Hyper
realistic, hyper realism, extreme realist.
```

### `modern/balcony_1.jpg`

**Description:** One balustrade. Fills the element.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of one modern balcony balustrade seen dead-on from
outside, filling the frame edge to edge. A brushed stainless handrail across the top, below it a frameless
panel of clear laminated glass with a green edge tint held by small stainless point fixings, and the dark of
the balcony behind it. Water spots and a faint tide mark low on the glass. No slab, no building around it. The
subject fills the frame edge to edge, its own frame running right to the edge of the picture: nothing cropped,
no background and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

### `modern/balcony_2.jpg`

**Description:** Super-monotonous glass balustrade + handrail.

**Prompt:**

```
One modern balcony balustrade dead-on filling the frame. SUPER monotonous: flat brushed stainless handrail and frameless clear glass panel only. No point fixings, no cables, no city, no slab. Dark void behind.
```

### `modern/balcony_3.jpg`

**Description:** Super-monotonous vertical bar balustrade.

**Prompt:**

```
One modern balcony balustrade dead-on. SUPER monotonous: thin vertical brushed stainless bars, flat top rail, even spacing. No rust, no decoration, dark void behind. No slab, no building.
```

### `modern/base_1.jpg`

**Description:** The street level wall, which is heavier and plainer than the floors above it and carries the entrance.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of the polished stone cladding at the base of a modern
tower, flat overcast daylight, dead flat-on with a long telephoto. Large honed grey-green granite panels with
fine open joints between them, faint crystalline flecks catching the light, a slightly darker panel among
them, dust and a scuff or two low down where people pass it. NO window, NO glass, NO opening, NO door: this
is the wall an entrance is cut into, not the entrance. The picture starts and ends mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `modern/base_2.jpg`

**Description:** Ground base block matching layer facade system: solid grey cladding, no openings.

**Prompt:**

```
Ground floor base of the same modern office building as the layer facade: silver mullion language, dark charcoal-grey solid cladding, square 1:1. Solid grey panels, NO windows, NO glass, NO doors, NO lights, NO text.
```

### `modern/base_3.jpg`

**Description:** Ground base alternate joint layout.

**Prompt:**

```
Ground floor base alternate of the same modern system: two tall solid grey cladding bays, fine recessed joints. NO windows, NO glass, NO door.
```

### `modern/base_4.jpg`

**Description:** Ground base with wider horizontal panel band.

**Prompt:**

```
Ground floor base third alternate: wide horizontal solid panel band, one vertical joint, matte even grey. NO windows, NO glass, NO door.
```

### `modern/beacon_1.jpg`

**Description:** Small red aviation obstruction beacon lens, fills the element.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of a small aviation obstruction beacon seen dead-on, filling the frame. A ribbed fresnel lens of deep translucent red glowing hot at the centre and falling off to a dark rim, set in a dark grey cage of four thin vertical guard bars with a machined base ring below and a vented cap above. Condensation beading on the metal. The lens is the only bright thing in the frame. The subject fills the frame edge to edge. Hyper realistic, hyper realism, extreme realist.
```


### `modern/beacon_1-emissive.png`

**Description:** Emissive map for `modern/beacon_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/concrete_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless tile of smooth architectural concrete only,
darker charcoal-grey with a faint warm cast, very fine aggregate, barely-there even pour mottling, no holes,
no form-board grid, no crack, no stain blotches. Entire frame is one flat continuous wall of concrete.
Seamless and tileable mid-material edges. Hyper realistic, hyper realism, extreme realist.
```

### `modern/door_1.jpg`

**Description:** One entrance leaf. Fills the element.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of one modern glazed entrance door leaf seen
dead-on, filling the frame edge to edge. A brushed stainless steel frame all the way round, a single sheet of
clear glass showing a warm lit lobby behind it with the edge of a reception desk, a polished stone floor and a
wall light, a full height brushed steel pull bar on the left, and a stainless kick plate across the bottom.
Fingerprints and a smear on the glass near the handle. The subject fills the frame edge to edge, its own frame
running right to the edge of the picture: nothing cropped, no background and no margin around it. Hyper
realistic, hyper realism, extreme realist.
```

**Notes:** Emissive: black, with a soft warm rectangle where the lobby shows through the glass.

### `modern/door_1-emissive.png`

**Description:** Emissive map for `modern/door_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/door_2.jpg`

**Description:** Lobby entrance door matching the layer facade system.

**Prompt:**

```
Single modern entrance door leaf matching the office curtain wall. Brushed silver-grey aluminium frame, full-height clear glass, warm lit lobby behind, slim pull bar, kick plate. NO industrial hatch, NO hazard stripes.
```

### `modern/door_2-emissive.png`

**Description:** Emissive map for `modern/door_2.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/door_3.jpg`

**Description:** Balcony door unit matching the curtain wall.

**Prompt:**

```
Single modern balcony door unit matching the office curtain wall. Slim silver-grey aluminium frame, double glass doors to a dark balcony, thin handle, soft interior light. Clean and simple.
```

### `modern/door_3-emissive.png`

**Description:** Emissive map for `modern/door_3.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/facade_1.jpg`

**Description:** The wall, at night, eight bays across and four floors down.

**Prompt:**

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

**Notes:** Vary the four: `_1` a quiet building, one office in six lit. `_2` busy, half of it lit, mostly cool white. `_3` a warm one, tungsten and desk lamps, blinds down on many bays. `_4` two full floors lit and the rest dark. Emissive: pure black, the same 8 by 4 grid, only the lit panes carrying flat colour with no glow and no bleed past the pane edges. Build it by masking the colour map to the pane rec

### `modern/facade_1-emissive.png`

**Description:** Emissive map for `modern/facade_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/facade_10.jpg`

**Description:** All-closed alternate of facade_7.

**Prompt:**

```
Same as facade_8 but from facade_7 reference: all windows closed, all lights off, structure preserved.
```

### `modern/facade_11.jpg`

**Description:** Same grid as layer facades: smoked crystal glass bays + concrete spandrels, closed interiors.

**Prompt:**

```
Same modern office curtain wall GRID as the layer references. Glazing replaced with dark crystal/smoked black glass totally closed; spandrels smooth pale concrete; silver mullions. NO lit interiors.
```

### `modern/facade_12.jpg`

**Description:** Same grid fully closed solid near-black panels (no transparent glass).

**Prompt:**

```
Same modern office curtain wall GRID. Entire wall solid near-black opaque panels in every bay, fine silver joints. NO windows that show inside, NO lights.
```

### `modern/facade_13.jpg`

**Description:** Same grid mix: solid concrete bays + closed crystal glass bays.

**Prompt:**

```
Same modern office curtain wall GRID. Mix of light grey concrete panels and dark smoked crystal glass bays totally closed. Silver mullions. NO lit rooms.
```

### `modern/facade_2.jpg`

**Description:** the quiet one, plus its `-emissive.png`

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `modern/facade_2-emissive.png`

**Description:** Emissive map for `modern/facade_2.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/facade_3.jpg`

**Description:** closed and blinded, plus its `-emissive.png`

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `modern/facade_3-emissive.png`

**Description:** Emissive map for `modern/facade_3.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/facade_4.jpg`

**Description:** all off, and NO emissive map

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `modern/facade_5.jpg`

**Description:** Layer office facade import A (from Downloads), 1x1 night curtain wall with lit offices.

**Prompt:**

```
Source: ~/Downloads/layer-office-building-facade.png (imported square). Night modern office curtain wall grid with silver mullions, dark grey spandrels, sparse lit offices.
```

### `modern/facade_5-emissive.png`

**Description:** Emissive map for `modern/facade_5.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/facade_6.jpg`

**Description:** Layer office facade import B (from Downloads), 1x1 night curtain wall with lit offices.

**Prompt:**

```
Source: ~/Downloads/layer-office-building-facade (1).png (imported square). Same system as facade_5, different light pattern.
```

### `modern/facade_6-emissive.png`

**Description:** Emissive map for `modern/facade_6.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/facade_7.jpg`

**Description:** Layer office facade import C (from Downloads), 1x1 night curtain wall with lit offices.

**Prompt:**

```
Source: ~/Downloads/layer-office-building-facade (2).png (imported square). Same system as facade_5, different light pattern.
```

### `modern/facade_7-emissive.png`

**Description:** Emissive map for `modern/facade_7.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/facade_8.jpg`

**Description:** All-closed alternate of facade_5: every window dark.

**Prompt:**

```
Same modern office curtain wall grid as the reference facade_5: identical mullions, dark grey spandrels, bay layout. EVERY window closed and dark. SWITCH ALL LIGHTS OFF. Near-black empty glass, faint city reflection only. NO lit offices, NO furniture, NO monitors.
```

### `modern/facade_9.jpg`

**Description:** All-closed alternate of facade_6.

**Prompt:**

```
Same as facade_8 but from facade_6 reference: all windows closed, all lights off, structure preserved.
```

### `modern/glass-band_1.jpg`

**Description:** Four floors of a tower that are nothing but glazing, lit.

**Prompt:**

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

**Notes:** Emissive: the same layout, lit panels flat and even, everything else absolute black.

### `modern/glass-band_1-emissive.png`

**Description:** Emissive map for `modern/glass-band_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/metal_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless tile of brushed stainless steel only, darker
cool graphite-silver, fine even horizontal brush grain filling the whole frame, no seam, no screws, no
fixings, no fingerprints, no panel joint. Continuous metal field only. Seamless and tileable. Hyper
realistic, hyper realism, extreme realist.
```

### `modern/metal_2.jpg`

**Description:** Monotonous dark charcoal-grey spandrel cladding field.

**Prompt:**

```
Pure seamless monotonous tile of dark charcoal-grey flat cladding matching modern office spandrels. Even matte grey, fine grain only. NO joints, NO screws, NO windows, NO colour bands.
```

### `modern/metal_3.jpg`

**Description:** Even flatter grey mono cladding field.

**Prompt:**

```
Pure seamless monotonous dark grey panel field, continuous even surface, extreme monotony.
```

### `modern/neon_1.jpg`

**Description:** Architectural LED strip surface wrap: frosted white diffuser and dark housing, neutral white for material tinting.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of the surface of an architectural LED strip light, one metre of run from the top of the frame to the bottom, wrapping around from left to right. The middle third of the frame is a frosted white diffuser lens glowing evenly and slightly brighter down its centre line; the outer thirds are a dark anodised aluminium housing with fine longitudinal ribs and a thin dark gasket line where it meets the lens. One slim mounting bracket crosses near the top. Neutral white light, no colour cast. Seamless top to bottom. The picture starts and ends midway between two collars, so where it repeats along the run the join is invisible and no fitting is cut in half. Hyper realistic, hyper realism, extreme realist.
```


### `modern/neon_1-emissive.png`

**Description:** Emissive map for `modern/neon_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/pipe_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless wrap of painted steel pipe surface only, darker
blue-grey powder coat filling the whole frame, soft cylindrical shade lighter down the vertical centre and
darker at left and right edges so it reads round when wrapped, no flange, no collar, no band, no label, no
text, no bolts. Seamless top to bottom and left to right. Hyper realistic, hyper realism, extreme realist.
```

### `modern/roof_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless top-down tile of dark grey PVC roof membrane
only, fine even grain filling the whole frame, no weld seams, no puddle ring, no dirt clump, no leaves, no
markings. Continuous membrane field only. Seamless and tileable. Hyper realistic, hyper realism, extreme
realist.
```

### `modern/screen_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of a modern backlit sign panel seen dead-on,
filling the frame edge to edge with no bezel. A flat white acrylic face lit evenly from behind with a faint
darker band at the very edges and the ghost of the LED strips behind it, one horizontal cool grey graphic bar
across the middle. No text, no letters, no logo. The subject fills the frame edge to edge, its own frame
running right to the edge of the picture: nothing cropped, no background and no margin around it. Hyper
realistic, hyper realism, extreme realist.
```

**Notes:** Emissive: the same at full brightness on black. ---

### `modern/screen_1-emissive.png`

**Description:** Emissive map for `modern/screen_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `modern/wall_1.jpg`

**Description:** The same building with the windows taken out: what a floor you compose your own openings onto is made of.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of a modern building's cladding with NO WINDOWS in it at all, flat
overcast daylight, dead flat-on with a long telephoto. Large champagne anodised aluminium rainscreen panels
with fine shadow-gap joints between them, a soft brushed grain running horizontally, the odd hairline mark
and a faint blue cast from the sky. NO window, NO glass, NO opening, NO frame, NO mullion of any kind: this
is the blank wall between them. The picture starts and ends mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `modern/wall_2.jpg`

**Description:** is worth having for the same reason: a second wall so two modern buildings are not

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `modern/wall_3.jpg`

**Description:** Solid wall option using the mono grey cladding.

**Prompt:**

```
Same as metal_2 / spandrel grey: blank solid wall material for composed floors.
```

### `modern/window_1.jpg`

**Description:** One curtain wall unit, close up. Fills the element, not tiled.

**Prompt:**

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

### `modern/window_2.jpg`

**Description:** Ground-floor lobby window (foyer depth, not an office room).

**Prompt:**

```
Single ground-floor lobby window unit for the modern curtain wall system. Slim silver-grey aluminium frame, large dark glass. Behind: tall empty lobby, polished floor, soft warm ceiling wash, reception desk silhouette. NO office desks, NO cubicles. NOT a small room.
```

## cyber

### `cyber/antenna_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless tile of dark anodised steel only at night,
near-black matte metal with fine even machining grain filling the frame, no warning band, no glyphs, no bolts,
no gussets, no marker light. Continuous dark metal field only. Seamless and tileable. Hyper realistic, hyper
realism, extreme realist.
```

### `cyber/balcony_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of one futuristic balcony balustrade seen dead-on
from outside, filling the frame edge to edge. A dark steel frame filled with fine perforated mesh, a flat top
rail with a thin magenta neon tube run along its underside, vertical stiffener ribs, a stencilled code plate,
cable ties and a bundled cable along the bottom rail. The space behind the mesh is black. Wet sheen on the
metal. The subject fills the frame edge to edge, its own frame running right to the edge of the picture:
nothing cropped, no background and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/base_1.jpg`

**Description:** Street level: heavier, scarred, and the one part of the building people touch.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of the armoured base panelling of a futuristic
megastructure at night, dead flat-on with a long telephoto. Heavy dark gunmetal plates with recessed hex
bolts at their corners, deep shadow joints between them, scuffs and impact dents, grime collected in the
joints, condensation and a wet sheen. Evenly the same all over. NO hazard stripes, NO chevrons, NO yellow,
NO text, NO numbers, NO stencils, NO graffiti, NO window, NO glass, NO opening, NO door: every one of those
belongs at one place on a building and this picture repeats every three metres. The picture starts and ends mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/beacon_1.jpg`

**Description:** Aviation obstruction beacon, deep red lens, near-black cage.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of an aviation obstruction beacon on a mast tip at night, seen dead-on and filling the frame. A ribbed lens burning deep red, blown out to white at the centre and falling off to a dark rim, set in a near-black cage of four thin guard bars with a machined base ring and a vented cap. Condensation on the metal, everything except the lens almost black. Hyper realistic, hyper realism, extreme realist.
```


### `cyber/beacon_1-emissive.png`

**Description:** Emissive map for `cyber/beacon_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/beacon_2.jpg`

**Description:** Teal-green aviation marker beacon variant for roof corners.

**Prompt:**

```
Same as cyber/beacon_1 with the lens burning teal-green instead of red.
```


### `cyber/beacon_2-emissive.png`

**Description:** Emissive map for `cyber/beacon_2.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/concrete_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless tile of near-black megastructure concrete only
at night, cool charcoal almost black, fine even damp grain and barely-there board texture, no drill holes, no
anchor stubs, no poster, no graffiti, no water streaks as stripes. Continuous dark concrete field only.
Seamless and tileable. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/door_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of one heavy sliding blast door seen dead-on,
filling the frame edge to edge. A near-black armoured panel split down the middle into two leaves with a deep
shadow gap between them, recessed hex bolts around the edge, a black and yellow hazard chevron band across the
bottom, a stencilled unit number, a thin cyan LED strip down each side of the gap and a small amber keypad at
waist height on the right. Scuffed metal, oil marks near the bottom, wet sheen. The subject fills the frame
edge to edge, its own frame running right to the edge of the picture: nothing cropped, no background and no
margin around it. Hyper realistic, hyper realism, extreme realist.
```

**Notes:** Emissive: black, only the two cyan strips and the amber keypad lit.

### `cyber/door_1-emissive.png`

**Description:** Emissive map for `cyber/door_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/door_2.jpg`

**Description:** the sci-fi entrance

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `cyber/door_2-emissive.png`

**Description:** Emissive map for `cyber/door_2.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/door_3.jpg`

**Description:** the lobby door of a tower

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `cyber/door_3-emissive.png`

**Description:** Emissive map for `cyber/door_3.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/facade_1.jpg`

**Description:** See prompt.

**Prompt:**

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

**Notes:** Vary the four: `_1` mostly cold white and cyan. `_2` amber and red, denser. `_3` sparse, big runs of total darkness. `_4` more conduit and decals on the panel, windows in tight clusters. Emissive: pure black, the same grid, only the lit slits carrying flat hard-edged colour, no glow, no halo, no bleed past the edges.

### `cyber/facade_1-emissive.png`

**Description:** Emissive map for `cyber/facade_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/facade_2.jpg`

**Description:** dense office curtain wall, 12 bays by 12 floors, three small windows a bay, one in ten lit in mixed whites; `pack.json` declares its grid and `dim: 1` because it is authored at night levels.

**Prompt:**

```
A perfectly flat-on night texture of a cyberpunk office tower curtain wall, for tiling on a 3D
building. A strict regular grid of 12 window bays across and 16 floors down fills the whole frame.
The wall is simple smooth near-black composite panel, very dark charcoal, with fine recessed
joints between panels. Every bay holds three small vertical rectangular windows per floor. Most
windows are unlit: dark blue-grey glass, barely lighter than the wall but readable as glass.
Roughly one window in ten is lit from inside: flat even light, mostly warm white and cool white, a
couple of amber and pale teal ones, some windows half covered by blinds. Lit windows are crisp
with hard edges, no glow, no bloom, no light bleed past the frame. Dead flat orthographic view, no
perspective, no ground, no sky, no roof, no people. The picture starts and ends in the middle of a
solid panel on all four edges so it tiles seamlessly horizontally and vertically. Hyper realistic,
photographic, extreme realism.
```

### `cyber/facade_2-emissive.png`

**Description:** Emissive map for `cyber/facade_2.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/facade_3.jpg`

**Description:** dense residential wall, 12 bays by 16 floors, two wider windows a bay, one in twelve lit in tungsten and amber with curtains and blinds; `pack.json` declares its grid and `dim: 1` because it is authored at night levels.

**Prompt:**

```
A perfectly flat-on night texture of a dense cyberpunk residential tower wall, for tiling on a 3D
building. A strict regular grid of 12 window bays across and 16 floors down fills the whole frame.
The wall is smooth near-black concrete composite panel with fine recessed joints. Every bay holds
two wider rectangular windows per floor. Most windows are unlit: very dark warm-grey glass, barely
lighter than the wall but readable. Roughly one window in twelve is lit from inside: mostly warm
tungsten white and soft amber, one or two pale cool white, several half covered by curtains or
blinds so only a strip glows. Lit windows are crisp with hard edges, no glow, no bloom, no bleed.
Dead flat orthographic view, no perspective, no ground, no sky, no roof, no people, no balconies.
The picture starts and ends in the middle of a solid panel on all four edges so it tiles
seamlessly horizontally and vertically. Hyper realistic, photographic, extreme realism.
```

### `cyber/facade_3-emissive.png`

**Description:** Emissive map for `cyber/facade_3.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/facade_4.jpg`

**Description:** all off, and NO emissive map

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `cyber/glass-band_1.jpg`

**Description:** The lit block partway up a black tower.

**Prompt:**

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

**Notes:** Vary the four: `_1` red-orange. `_2` cold cyan-white. `_3` amber. `_4` magenta into deep blue. Emissive: the same layout, lit panels at full brightness, dimmed ones at about a fifth, everything else absolute black.

### `cyber/glass-band_1-emissive.png`

**Description:** Emissive map for `cyber/glass-band_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/metal_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless tile of near-black gunmetal armour plate only at
night, fine even machining grain filling the frame, no seam, no bolts, no stencilled codes, no hazard
chevrons, no condensation beads as hero marks. Continuous dark metal field only. Seamless and tileable. Hyper
realistic, hyper realism, extreme realist.
```

### `cyber/neon_1.jpg`

**Description:** Thin architectural neon tube wrap: hot white core for material colour tinting.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of a thin architectural neon tube at night, one metre of run from the top of the frame to the bottom, wrapping around from left to right. The middle of the frame is the tube itself, a hot white core blowing out to pure white down its centre line and falling off sharply to either side; the outer edges are a narrow dark matte housing that disappears against the night. One slim mounting clip crosses near the top. Neutral white, no colour cast. Seamless top to bottom. The picture starts and ends midway between two collars. Hyper realistic, hyper realism, extreme realist.
```


### `cyber/neon_1-emissive.png`

**Description:** Emissive map for `cyber/neon_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/pipe_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless wrap of dark industrial conduit surface only at
night, near-black gunmetal with fine even longitudinal grain, soft cylindrical shade lighter down the centre
and darker at both edges, no collar, no bolts, no hazard band, no cyan line, no serial codes. Seamless top to
bottom. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/roof_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Pure seamless top-down tile of near-black industrial roof
membrane only at night, fine even grain filling the whole frame, no weld seams, no standing water, no yellow
deck markings, no numbers, no cables. Continuous dark membrane field only. Seamless and tileable. Hyper
realistic, hyper realism, extreme realist.
```

### `cyber/screen_1.jpg`

**Description:** The advertising panel. This is the loud one, so give the four variants different content.

**Prompt:**

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

**Notes:** Vary the four: `_1` the figure above. `_2` a data wall: rows of cyan bars, a waveform, blocks of glyph-like marks that suggest characters without being any alphabet, amber and red status squares. `_3` a magenta and deep blue gradient with hard geometric shapes cutting across it. `_4` a mostly dark panel with one small bright element and a lot of black. Emissive: the same image at full brightness o

### `cyber/screen_1-emissive.png`

**Description:** Emissive map for `cyber/screen_1.jpg`. Black everywhere except lit regions taken from the colour map (threshold mask).

**Prompt:** not image-generated; derived:

```
Build from the colour map: keep only lit pane/glow pixels, fill the rest with pure black PNG.
```

### `cyber/wall_1.jpg`

**Description:** Blank panel: what a floor carrying a screen, a balcony or its own doors is made of.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of a 3 metre square of near-black composite panel from a futuristic
megastructure, at night under weak ambient light, dead flat-on with a long telephoto. Matte dark panels with
fine recessed joints, a bundled conduit run pinned across it, two small vents, a stencilled maintenance code
in dim grey, condensation and a faint wet sheen. NO window, NO slit, NO glass, NO opening, NO light of any
kind: this is the dark panel between them, and it stays at 10 to 14 out of 255. The picture starts and ends mid-material, with no feature crossing an edge and no change of tone toward any edge, so where it repeats the join is invisible. Hyper realistic, hyper realism, extreme realist.
```

### `cyber/wall_2.jpg`

**Description:** the black glass monolith

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `cyber/wall_3.jpg`

**Description:** the ribbed megastructure

**Prompt:** (variant of the family finish; see related `_1` entry and PROMPTS.md sections 7–9.)

### `cyber/window_1.jpg`

**Description:** See prompt.

**Prompt:**

```
Hyper realistic, extreme realism, photographic. Photograph of one recessed futuristic window unit seen
dead-on, filling the frame edge to edge. A near-black machined frame with a deep reveal throwing the pane into
shadow, two thin mullions splitting it into three lights, very dark glass with a faint teal tint, one long
horizontal streak of reflected city light across it, a thin cyan LED line along the bottom edge of the frame,
a small stencilled code and two hex bolts on the frame. Very dark, high contrast, wet looking. The subject
fills the frame edge to edge, its own frame running right to the edge of the picture: nothing cropped, no
background and no margin around it. Hyper realistic, hyper realism, extreme realist.
```

### cyber ads

Clean advertising images for `buildings screen ... --image`. No scanlines (screen material adds those).

### `cyber/ads/drink-amber_1.jpg`

**Description:** The drink ad. The classic one: a bottle, a hand, a colour.

**Prompt:**

```
A vertical advertising image for an invented drink called KOMA. A tall faceted glass bottle of amber liquid
held up by a woman's hand, condensation beading on the glass, the liquid lit from behind so it burns
orange-gold against a deep black background. Her hand and forearm are the only skin shown, lit warm from
the bottle and rimmed cold blue from the side. A thin ring of magenta neon reflects along one edge of the
bottle. The invented wordmark KOMA in heavy rounded orange capitals low in the frame, one letter clipped by
the edge. Amber and magenta on black, nothing else. Advertising image filling the frame edge to edge, no
border, no bezel, no frame, no margin, deep black background, very high contrast, hyper realistic, extreme
realism, sharp, cinematic.
```


### `cyber/ads/drink-amber_2.jpg`

**Description:** The same drink, the shape for a short wide section.

**Prompt:**

```
A square advertising image for an invented drink called KOMA. A woman's face in three-quarter profile,
eyes closed, lifting a small faceted glass of glowing amber liquid toward her lips, the drink lighting her
face warm from below while a cold cyan rim light traces her cheek and jaw from behind. Deep black
everywhere else. Steam or vapour catching the light between her hand and her face. The invented wordmark
KOMA small in one corner in orange capitals. Amber and cyan on black. Advertising image filling the frame
edge to edge, no border, no bezel, no frame, no margin, deep black background, very high contrast, hyper
realistic, extreme realism, sharp, cinematic.
```


### `cyber/ads/megacorp_1.jpg`

**Description:** No people. The one that wraps a base and lets the others be the loud ones.

**Prompt:**

```
A wide horizontal advertising banner for an invented conglomerate called HANSA-YURI INDUSTRIAL. No people.
A single geometric mark made of three interlocking angular shapes in cold white, huge and centred, against
deep black, with a thin magenta line running the full width behind it. A faint grid of hairline cyan lines
recedes into the black. The invented wordmark HANSA-YURI in thin white capitals, small, to one side of the
mark. Cold, corporate, almost empty. Advertising image filling the frame edge to edge, no border, no bezel,
no frame, no margin, deep black background, very high contrast, hyper realistic, extreme realism, sharp,
cinematic.
```


### `cyber/ads/retro-geisha_1.jpg`

**Description:** The Blade Runner shape: a huge stylised figure down the side of a tower.

**Prompt:**

```
A very tall narrow vertical advertising image in a retro east asian poster style, for an invented
confectionery brand called SUZUME. A woman in traditional dress shown from the chest up, face painted pale
with a small deep red mouth, hair up and held with two dark pins, eyes lowered. She is lit flat and even
like an old printed poster, in a limited palette of pale bone white, deep crimson and black, with a faint
gold outline. The background is flat deep black with one large crimson circle behind her head. Invented
brush-drawn glyphs run vertically down one side in crimson, suggesting characters without being real
writing. Slight print grain and a faint misregistration of the red, like an old offset poster. Advertising
image filling the frame edge to edge, no border, no bezel, no frame, no margin, deep black background, very
high contrast, hyper realistic, extreme realism, sharp, cinematic.
```


### `cyber/ads/retro-noodle_1.jpg`

**Description:** Street level, warmer, busier.

**Prompt:**

```
A vertical advertising image in a 1980s east asian street poster style, for an invented instant noodle
brand called HOSHI RAMEN. A steaming bowl of noodles held in both hands, shot from just above, the steam
lit hot orange from below and the rim of the bowl catching a cold blue reflection. A woman's face is behind
the steam, softly out of focus, smiling. Saturated warm orange and red against deep black, one cold blue
accent. Invented brush-drawn glyphs in white and red across the lower third, suggesting characters without
being real writing, one of them clipped by the edge. Faint print grain. Advertising image filling the frame
edge to edge, no border, no bezel, no frame, no margin, deep black background, very high contrast, hyper
realistic, extreme realism, sharp, cinematic.
```


### `cyber/ads/retro-tv_1.jpg`

**Description:** The oldest-looking one, for a low section near the street.

**Prompt:**

```
A square advertising image in a faded 1970s east asian magazine style, for an invented electronics brand
called TOKAWA. A woman with big soft curled hair and pale makeup, smiling directly out of the frame,
holding a small chrome handheld device up beside her face. Warm faded colour like old film stock, pale
peach and dull teal against a deep black background, gentle bloom around the highlights. The invented
wordmark TOKAWA in blocky chrome capitals across the bottom. Slight print grain and colour bleed.
Advertising image filling the frame edge to edge, no border, no bezel, no frame, no margin, deep black
background, very high contrast, hyper realistic, extreme realism, sharp, cinematic.
```


### `cyber/ads/transit_1.jpg`

**Description:** The public one, for variety between the sales pitches.

**Prompt:**

```
A wide horizontal public information banner for an invented city transit authority. No people. A stylised
arrow and a row of simple angular pictograms in amber on deep black, with one long horizontal amber rule
running the full width. Invented glyphs in amber suggest a destination without being real writing. A faint
scatter of small red status marks along one end. Flat, functional, official, almost empty. Advertising
image filling the frame edge to edge, no border, no bezel, no frame, no margin, deep black background, very
high contrast, hyper realistic, extreme realism, sharp, cinematic.
```


### `cyber/ads/vr-visor_1.jpg`

**Description:** A model wearing a mirrored visor, selling a made-up VR company.

**Prompt:**

```
A vertical advertising image for an invented virtual reality company called NEURAX. A young woman shown
from the shoulders up, head tilted back, wearing a sleek mirrored wraparound visor that covers her eyes and
reflects a cyan and magenta cityscape across its curve. Her skin is lit from below by cold cyan light and
from one side by deep magenta, everything else falling into black. Wet-look dark hair pulled back, a thin
chrome band at her temple. Behind her nothing but deep black. The invented wordmark NEURAX runs small and
vertical down one side in thin cyan capitals, partly cropped by the edge. Two colours only, cyan and
magenta, on black. Advertising image filling the frame edge to edge, no border, no bezel, no frame, no
margin, deep black background, very high contrast, hyper realistic, extreme realism, sharp, cinematic.
```


### `cyber/ads/vr-visor_2.jpg`

**Description:** The same brand, the shape that runs down a corner.

**Prompt:**

```
A very tall narrow vertical advertising image for an invented virtual reality company called NEURAX. A
woman standing in profile, full length, arms at her sides, wearing a mirrored wraparound visor and a
close-fitting matte black bodysuit with thin luminous cyan seams running down the arms and legs. She is lit
from one side only by hard magenta light, the other half of her body lost in black. The background is deep
black with one soft vertical band of cyan glow behind her. The invented wordmark NEURAX in thin cyan
capitals across the lower third, small against the height of the image. Advertising image filling the frame
edge to edge, no border, no bezel, no frame, no margin, deep black background, very high contrast, hyper
realistic, extreme realism, sharp, cinematic.
```


---

## File count

| Location | Files |
| --- | ---: |
| `textures/modern/` | 52 |
| `textures/cyber/` (pack) | 34 |
| `textures/cyber/ads/` | 9 |
| Emissive maps (included above) | 24 |
| **Total** | 95 |

---

## Emissive rule

Finishes that take an emissive when lit: `facade`, `glass-band`, `door`, `screen`.

`neon` and `beacon` take no picture at all, colour or emissive. They are lights: a flat colour emitting that
colour, tinted per line, which is brighter and cleaner at any distance than a photograph of a tube. The
`neon_1.jpg` and `beacon_*.jpg` files in the packs are never read, and `buildings add-texture` refuses them.
`screen-glass`, the dot matrix over a screen, is drawn from code because it is mostly transparent.
All-off facades (`*_4`, closed layer facades) have no emissive file.
Material tiles (`wall`, `base`, `concrete`, `metal`, `pipe`, `antenna`, `roof`, `window`, `balcony`) do not.

