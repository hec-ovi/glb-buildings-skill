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

## The rules

- **Fill the frame edge to edge.** No bezel, no border, no margin, no drop shadow. The panel is
  geometry; the picture is only what is on it.
- **Near-black ground.** These are read at night against a dark building. A pale ad reads as a hole
  punched in the tower.
- **Expose it normally.** The material makes it a light. An image that is already blown out has
  nothing left to blow out with, and every ad in the city ends up the same white rectangle.
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
Hyper realistic, extreme realism, photographic. A [aspect] advertising image for a giant building
screen, filling the frame edge to edge. [One subject, huge and centred: a face in three quarter
profile, a bottle, a product, a symbol.] [Two or three saturated colours: magenta and cyan, amber
and deep red.] Deep near-black background with nothing in it. [A short invented wordmark in
[language or script], partly cut off by the edge of the frame.] Glossy, high contrast, cinematic
night advertising photography. NO bezel, NO border, NO frame, NO margin, NO scanlines, NO pixel
grid, NO glitch, NO chromatic aberration, NO real brand, NO real logo, NO recognisable person.
Hyper realistic, hyper realism, extreme realist.
```

## Negative prompt

```
bezel, border, frame, margin, drop shadow, scanlines, pixel grid, crt, glitch, chromatic
aberration, moire, watermark, signature, real brand, real logo, trademark, celebrity, recognisable
person, collage, multiple panels, low contrast, pale background, white background
```

## A set that reads as a city

Four or five ads is a skyline. Spread them: a face selling something, a drink, a piece of retro
electronics, a transit or corporate notice as a wide band. Vary the language of the lettering and
the dominant colour, and keep every one of them dark except its subject.
