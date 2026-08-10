# Screen ads

The pictures that go on the screens standing off a tower. These are **not textures**: they do not tile, they
do not repeat, and one image is one screen.

They are also **clean images**. No scanlines, no pixel grid, no glitch bands, no chromatic fringing, no
bezel. The screen effect belongs to the material, so it goes on at build time and stays consistent across
every screen in a city. Bake it into the picture and it fights the one the material adds, at a different
pitch, and the ad turns to mush.

```bash
buildings screen body --side E --along 3 --width 8 --from 8 --to 20 \
  --image textures/cyber/ads/vr-visor_1.jpg
```

## Where they go

```
textures/<style>/ads/<name>_<n>.jpg
```

Ads sit in their own folder because they are picked by name, one per screen, rather than by finish like the
rest of a pack. Nothing scans this folder: the path is given to the verb.

## Sizes

A screen is fitted to the aspect of the picture it carries, so **the aspect is what matters** and the pixel
size is only quality. Pick the shape from where the ad goes on the building.

| Shape | Aspect | Where it goes | Generate | Ship |
| --- | --- | --- | --- | --- |
| tall | 1:2 | the ordinary tower ad, five or six floors | 1024 x 2048 | 512 x 1024 |
| very tall | 1:3 | the full height one down a corner, ten floors or more | 1024 x 3072 | 512 x 1536 |
| square | 1:1 | a short wide section, two or three floors | 1536 x 1536 | 768 x 768 |
| band | 3:1 | wrapping a base or a setback | 2048 x 683 | 1024 x 341 |

## Rules for all of them

- **Fill the frame edge to edge.** No bezel, no border, no frame, no margin, no drop shadow. The panel is
  geometry; the picture is only what is on it.
- **Near-black ground.** These are seen at night against a dark building. A pale ad reads as a hole.
- **One subject, huge.** It is read from two hundred metres. Anything with three things in it reads as
  nothing.
- **Two or three saturated colours** carrying the whole image, against the black.
- **Nothing real.** Invented brand names only, no real logo, no real company, no recognisable real person,
  no copied character or poster. Everything here is a made-up product on a made-up sign.
- **Lettering is decoration.** Ask for a short invented wordmark and let it be partly cut off or
  half-legible. Text that tries to be readable comes back as garbled nonsense that draws the eye to itself.

### Append to every prompt

```
advertising image filling the frame edge to edge, no border, no bezel, no frame, no margin, deep black
background, very high contrast, hyper realistic, extreme realism, sharp, cinematic
```

### The negative prompt

```
scanlines, pixel grid, halftone dots, glitch, chromatic aberration, screen bezel, monitor frame, border,
watermark, signature, real brand, real logo, real company name, celebrity, low contrast, washed out, pale
background, white background, cluttered, busy, collage, multiple subjects, small text, paragraph of text
```

---

## The ads

### `cyber/ads/vr-visor_1.jpg` tall, 1:2

A model wearing a mirrored visor, selling a made-up VR company.

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

### `cyber/ads/vr-visor_2.jpg` very tall, 1:3

The same brand, the shape that runs down a corner.

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

### `cyber/ads/drink-amber_1.jpg` tall, 1:2

The drink ad. The classic one: a bottle, a hand, a colour.

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

### `cyber/ads/drink-amber_2.jpg` square, 1:1

The same drink, the shape for a short wide section.

```
A square advertising image for an invented drink called KOMA. A woman's face in three-quarter profile,
eyes closed, lifting a small faceted glass of glowing amber liquid toward her lips, the drink lighting her
face warm from below while a cold cyan rim light traces her cheek and jaw from behind. Deep black
everywhere else. Steam or vapour catching the light between her hand and her face. The invented wordmark
KOMA small in one corner in orange capitals. Amber and cyan on black. Advertising image filling the frame
edge to edge, no border, no bezel, no frame, no margin, deep black background, very high contrast, hyper
realistic, extreme realism, sharp, cinematic.
```

### `cyber/ads/retro-geisha_1.jpg` very tall, 1:3

The Blade Runner shape: a huge stylised figure down the side of a tower.

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

### `cyber/ads/retro-noodle_1.jpg` tall, 1:2

Street level, warmer, busier.

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

### `cyber/ads/retro-tv_1.jpg` square, 1:1

The oldest-looking one, for a low section near the street.

```
A square advertising image in a faded 1970s east asian magazine style, for an invented electronics brand
called TOKAWA. A woman with big soft curled hair and pale makeup, smiling directly out of the frame,
holding a small chrome handheld device up beside her face. Warm faded colour like old film stock, pale
peach and dull teal against a deep black background, gentle bloom around the highlights. The invented
wordmark TOKAWA in blocky chrome capitals across the bottom. Slight print grain and colour bleed.
Advertising image filling the frame edge to edge, no border, no bezel, no frame, no margin, deep black
background, very high contrast, hyper realistic, extreme realism, sharp, cinematic.
```

### `cyber/ads/megacorp_1.jpg` band, 3:1

No people. The one that wraps a base and lets the others be the loud ones.

```
A wide horizontal advertising banner for an invented conglomerate called HANSA-YURI INDUSTRIAL. No people.
A single geometric mark made of three interlocking angular shapes in cold white, huge and centred, against
deep black, with a thin magenta line running the full width behind it. A faint grid of hairline cyan lines
recedes into the black. The invented wordmark HANSA-YURI in thin white capitals, small, to one side of the
mark. Cold, corporate, almost empty. Advertising image filling the frame edge to edge, no border, no bezel,
no frame, no margin, deep black background, very high contrast, hyper realistic, extreme realism, sharp,
cinematic.
```

### `cyber/ads/transit_1.jpg` band, 3:1

The public one, for variety between the sales pitches.

```
A wide horizontal public information banner for an invented city transit authority. No people. A stylised
arrow and a row of simple angular pictograms in amber on deep black, with one long horizontal amber rule
running the full width. Invented glyphs in amber suggest a destination without being real writing. A faint
scatter of small red status marks along one end. Flat, functional, official, almost empty. Advertising
image filling the frame edge to edge, no border, no bezel, no frame, no margin, deep black background, very
high contrast, hyper realistic, extreme realism, sharp, cinematic.
```

---

## After generating

1. **Check it reads as a silhouette.** Squint at it, or shrink it to 60 px wide. If you cannot tell what it
   is, it will be a smudge on a tower.
2. **Check the black is black.** Lift the levels and any grey ground shows up as a lit rectangle floating on
   a dark building.
3. **Do not add the screen effect.** No scanlines, no pixel grid. The material puts those on.
4. **Keep the aspect** you generated at. The panel is fitted to it, so a 1:3 ad makes a tall screen and a
   3:1 ad makes a band.
