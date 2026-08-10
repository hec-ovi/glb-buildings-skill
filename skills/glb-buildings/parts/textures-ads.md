# Ads for the screens

Read `parts/textures.md` first for the rules and the negative prompt, and `parts/cyber.md` for what
a screen is and where one belongs on a tower.

An ad is the picture on one screen. It is **not part of a pack**: it does not tile, it does not
repeat, one image is one screen, and it is handed to the verb by path.

```bash
buildings screen body --side E --along 4 --width 9 --from 6 --to 18 --image ~/out/vr-visor.png
```

Nothing scans a folder for these, so keep them wherever you like. `textures/<style>/ads/` next to
the pack is the tidy place.

**The panel is fitted to the shape of the picture.** Give a width or a run of floors, and the
toolkit works out the other one from the aspect, so an ad is never squashed. That is why the aspect
matters and the pixel size is only quality.

| Shape | Aspect | Where it goes | Generate |
| --- | --- | --- | --- |
| tall | 1:2 | the ordinary tower ad, five or six floors | 1024 x 2048 |
| very tall | 1:3 | the full height one down a corner, ten floors or more | 1024 x 3072 |
| square | 1:1 | a short wide section, two or three floors | 1536 x 1536 |
| band | 3:1 | wrapping a base or a setback | 2048 x 683 |

## Generate a clean image

**No screen effect in the picture.** No scanlines, no pixel grid, no glitch bands, no chromatic
fringing, no bezel, no moire. The toolkit puts a tile of dotted glass in front of every screen and
lights it, so the effect goes on at build time and stays the same across a whole city. Bake it into
the picture and the two grids fight at different pitches and the ad turns to mush.

## How a screen is actually lit, which decides what the picture must be

The picture is used twice: as the panel's colour, and as **what it emits**, at a little over the
brightest a plain surface can be. So every pixel of the ad is its own little light, and a pixel that
is black in the file emits nothing. That is how a real LED wall works, and it is why the picture is
the whole job.

Three things follow, and they are the difference between a screen and a bright rectangle.

**Black has to be black.** Not 30 out of 255, not a dark grey wash, not a soft vignette. Whatever
grey the ground is, the panel emits it, and a screen that emits everywhere is a lamp with a picture
faintly printed on it. Ask for *pure black background, absolute black, no glow behind the subject,
no ambient haze*.

**Only the highlights should bleed.** The renderer bleeds light into the air around anything past
about 0.85 of full brightness, and that bleed is what makes the eye read a source rather than a
surface. If half the picture is over that line, the whole ad blurs into itself and one ad stops
being distinguishable from the next. So: **small very bright areas against a lot of black.** A hot
core in the subject, a lit wordmark, a rim on a bottle. Not a bright field.

**Green decides how much it glows.** Brightness in a renderer is weighted by the eye: green counts
about 72%, red 21%, blue 7%. A saturated magenta or deep red ad at the same exposure as a cyan one
throws barely any light and never blooms, which is why red neon signs look flat while white ones
halo. So an ad in warm reds still wants **one small near-white or cyan hot element** in it, or it
will read as a printed poster rather than a screen.

## The rules

- **Fill the frame edge to edge.** No bezel, no border, no margin, no drop shadow. The panel is
  geometry; the picture is only what is on it.
- **Pure black ground.** These are read at night against a dark building. A pale ad reads as a hole
  punched in the tower, and a grey one glows all over.
- **Expose it normally, then let the highlights sit just under clipping.** The material takes them
  over the line for you. An image that is already blown out has nothing left to blow out with, and
  every ad in the city ends up the same white rectangle.
- **No baked glow.** No halo painted around the subject, no lens bloom, no light rays. The renderer
  adds the bleed; a painted one bleeds again on top of itself and smears.
- **One subject, huge.** It is read from two hundred metres. Three things in one ad reads as
  nothing.
- **Two or three saturated colours** carrying the whole image against the black.
- **Nothing real.** Invented brand names only. No real logo, no real company, no recognisable real
  person, no copied character or poster. Everything is a made-up product on a made-up sign.
- **Lettering is decoration.** Ask for a short invented wordmark and let it be partly cut off or
  half-legible. Text that tries to be readable comes back as garbled nonsense that draws the eye
  straight to it.

## The skeleton

```
Hyper realistic, extreme realism, photographic. A [aspect] advertising image for a giant LED building
screen, filling the frame edge to edge. [One subject, huge and centred: a face in three quarter
profile, a bottle, a product, a symbol.] The subject is lit from within by its own colour, [two or
three saturated colours: magenta and cyan, amber and deep red], with [one small element burning
almost white: a rim light, a reflection, a lit wordmark] as the brightest thing in the picture.
PURE BLACK background, absolutely black, empty: NO glow behind the subject, NO haze, NO gradient, NO
vignette, NO light rays, NO painted halo. Most of the frame is black and only the subject carries
light. [A short invented wordmark in [language or script], partly cut off by the edge of the frame.]
Very high local contrast, deep blacks, highlights just short of clipping. Cinematic night
advertising photography. NO bezel, NO border, NO frame, NO margin, NO scanlines, NO pixel grid, NO
glitch, NO chromatic aberration, NO real brand, NO real logo, NO recognisable person. Hyper
realistic, hyper realism, extreme realist.
```

## Negative prompt

```
bezel, border, frame, margin, drop shadow, glow, halo, bloom, lens flare, light rays, haze, fog,
gradient background, grey background, vignette, scanlines, pixel grid, crt, glitch, chromatic
aberration, moire, watermark, signature, real brand, real logo, trademark, celebrity, recognisable
person, collage, multiple panels, low contrast, pale background, white background
```

## Check it before you use it

Look at the picture at arm's length, squinted:

- **Is the background truly black?** If you can see the rectangle of the image against a black desk,
  it is not black enough. That grey will be emitted across the whole panel.
- **What is the brightest thing, and how big is it?** It should be small and it should be the point
  of the ad. If the answer is "most of it", the screen will read as a lamp.
- **Is anything near white?** In an ad of deep reds and magentas, a small near-white or cyan element
  is what gives it its halo. Without one it will sit there looking printed.

## A set that reads as a city

Four or five ads is a skyline. Spread them: a face selling something, a drink, a piece of retro
electronics, a transit or corporate notice as a wide band. Vary the language of the lettering and
the dominant colour, and keep every one of them dark except its subject.
