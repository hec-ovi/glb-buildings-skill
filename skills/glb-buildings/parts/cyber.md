# A cyberpunk tower

The look is contrast: **the mass is almost black and the lights draw the building**. Everything here is
about keeping the wall dark and putting a few bright things on it in the right places.

Set the family first. It changes every finish at once: near black walls, hard little windows in cyan, white,
amber and red, dark concrete, dark steel.

```bash
buildings new spire --style cyber --width 24 --depth 20 --floors 40
buildings style cyber          # on a building that already exists
```

## The five things that make it read

In this order. Each one only works because the ones around it are dark.

1. **A black mass with lit windows.** That is the `cyber` style's own wall texture, and a `flat` section
   carries it for eight triangles a floor. Most of the tower is this and nothing else.
2. **A band of full glass floors**, four or five of them, somewhere in the upper half.
3. **Lines** climbing one or two faces, several of them, in two or three colours.
4. **One screen** standing off a face, spanning many floors.
5. **A lit crown** round the roof, and a mast with a beacon on it.

Do not do all five on every building. A city is mostly towers with one or two of them.

## Full glass floors

A band of nothing but glazing, lit, sitting in a mass that is otherwise dark. It is a section of its own,
four or five floors tall, on the `bulk-glass` template.

```bash
buildings add-band glow --kind custom --tier flat --template bulk-glass --floors 5 --after body
```

It costs the same as a plain section: the lit and dead panels are in the picture. Put it two thirds of the
way up, or where the building steps in, and keep the sections above and below plain.

## Lines

A line is a lit run climbing a face across many floors. Several at different places across one face, in a
couple of colours, is the shape to aim for.

```bash
buildings line body --side S --count 5 --spacing 3.5 --colours cyan,magenta,red
buildings line body --side W --count 2 --spacing 6 --colour amber --from 12 --to 34
```

- `--count` and `--spacing` place them across the face for you: the first sits half a spacing in, and the
  rest step across. `--along` moves the first one.
- `--from` and `--to` are floor numbers inside the section, counted from 0 at its bottom. Left out, a line
  climbs the whole section.
- `--colours` cycles a list, one per line. `--colour` gives them all the same.
- Colours: `cyan`, `teal`, `green`, `blue`, `magenta`, `pink`, `red`, `orange`, `amber`, `yellow`, `white`,
  or any `#rrggbb`.

**Lines want a plain wall.** Leave the face they climb with nothing composed on it: no windows, no panels,
no balconies. The wall texture already has windows in it, and that is the background a line reads against.
Compose the other faces if you want detail.

## Screens

A screen stands off a face by about a metre and spans many floors. It carries one picture across its whole
front, and hangs in the air off the face with nothing holding it.

```bash
buildings screen body --side E --along 3 --width 8 --from 6 --to 18
buildings screen body --side E --along 3 --width 8 --from 6 --to 18 --image ~/textures/screen1.png
```

- `--along` is metres from the left end of the face seen from outside, `--width` is metres across.
- `--from` and `--to` are floors, the same as a line.
- `--stand` is how far off the wall it sits. A metre is the default and is usually right.
- `--image` is a PNG or JPEG of your own. Without one it carries the generated screen.

One screen on a tower, two on the one that is meant to be the loud one. A screen on every face is a
shopping centre, not a skyline.

## The crown, and what stands on the roof

```bash
buildings crown crown --colour red
buildings place dish A1 B4 --section crown
```

`crown` runs a lit line round the top edge of a section. Put it on the roof, or on a section that steps in,
where the edge is seen.

**Every cyber roof gets a lit mast, whether you ask or not.** A tower of this kind is read against the sky
and the beacon on the tip is what puts it there, so the toolkit stands one as near the middle of the deck as
there is room for. Place your own with `buildings place mast <cell>` if you want it somewhere particular;
one is already there if you do not.

## Keep it dark

- **Do not compose windows on a `cyber` section.** The wall texture is already a grid of lit windows, and
  cut windows on top of it read as two window systems disagreeing. Compose only where you want something a
  texture cannot do: a door at the street, a screen, a balcony on a low floor.
- **Ground floors are the exception.** The bottom two floors are seen from the street: doors, screens and
  big panels belong there.
- **Greebles are off** on any section carrying lines, screens or composed elements. That is automatic.
- A `flat` section may carry lines and a crown. Adding a screen to one usually needs `light`, because the
  panel and its dotted glass cost more than 120 triangles a floor on a short section. Move it with
  `--tier light` if the build says so.

## A tower, end to end

```bash
buildings new spire --style cyber --brief "black megastructure with a lit band and a screen" --width 24 --depth 20 --floors 44
buildings set-band ground --height 6
buildings set-band body --floors 26
buildings add-band glow --kind custom --tier flat --template bulk-glass --floors 5 --after body
buildings add-band upper --kind bulk --tier flat --floors 10 --inset 1.5 --after glow
buildings line body --side S --count 5 --spacing 3.5 --colours cyan,magenta,red
buildings screen body --side E --along 3 --width 8 --from 8 --to 20
buildings crown crown --colour red
buildings build
```

Then read it back with `buildings show` and report the height, the floors and the triangles.
