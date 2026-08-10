# A building from one description

The user says "a high tech cyberpunk mega tower" or "a plain six storey apartment block". Build it
in **two passes**: the architect settles the massing, then each section gets its faces composed on
its own. Never invent a verb; run `buildings help` if unsure.

The two passes are separate on purpose. The architect works in metres and sections and never looks
at a window. A facade pass works in cells on one section and never looks at the rest of the
building. Neither has to hold the other in its head, and the document is the only thing between
them.

**Most floors get no facade pass at all.** The wall texture already carries their windows, their
spandrels and their floor lines. The second pass runs on the ground section, the crown, and one
floor in every four or five that was lifted out of its run with `enhance`. A forty floor tower is
three or four facade passes, not forty.

---

## Pass one: the architect

**1. Read the description for four things**: footprint (width x depth in metres), how many floors,
how tall a floor is, and how much character the top and bottom need. If the user gave none, use
the defaults in `parts/dimensions.md`.

**2. Start the project.**
```bash
buildings new <name> --width 22 --depth 18 --floors 24
```
That gives you three sections: `ground` (main), `body` (bulk), `crown` (roof). **`--floors` is the
whole building**, roof included, so ask for one more than the floors people stand on.

**3. Give the base weight.** A base is taller and usually wider than what sits on it, and it is
the part seen from the street, so it is where a `light` or `full` tier earns its cost.
```bash
buildings set-band ground --height 6 --width 26 --depth 22 --tier light --columns corners --chamfer 0.3
```

**4. Cut the middle into sections.** This is what makes a building instead of an extrusion. Three
to five sections, each with its own footprint and step.
```bash
buildings set-band body --floors 6 --height 3.2 --tier light
buildings add-band mid   --kind bulk --tier flat  --template bulk-flat --floors 5 --inset 0.8 --wires S --after body
buildings add-band upper --kind bulk --tier light --template bulk-flat --floors 6 --inset 1.6 --after mid
```

**5. Add the one thing that makes it memorable.** A twisted run, a cantilevered platform, a mass
slid off centre.
```bash
buildings add-band twistrun --kind custom --tier light --template bulk-flat --floors 4 --rotation 12 --twist 22 --taper 0.8 --after upper
buildings add-band pad --kind custom --tier light --template bulk-flat --floors 1 --height 1.2 --width 24 --depth 8 --shift-z -3 --after twistrun
```

**6. Finish the crown.** A parapet is 1.0 to 1.2 m; a turned or tapered crown reads as a spire.
The roof is where the silhouette is made.
```bash
buildings set-band crown --height 3 --width 10 --depth 9 --rotation 45 --clutter 0.45
```

**7. Prove the massing stands, before any face is composed.**
```bash
buildings build
```
A section that floats or is over budget is a massing problem, and fixing it after the facades are
on means composing them twice. `buildings show` lists what you built.

---

## Pass two: the faces, one section at a time

Take the sections in order of how much they are seen: the base first, then whatever is at eye
level, then the rest. **Each one is its own job.** Read `parts/facade.md` and work only on that
section:

```bash
buildings face ground --side S          # read the grid before placing anything
buildings put ...                       # windows, doors, balconies, screens
buildings build                         # prove it, then move to the next section
```

Three rules for choosing what to compose:

- A `flat` section carries **no** elements: its windows live in the texture and it has 120
  triangles a floor to spend. To give a run of plain floors one worked floor, lift that floor out
  with `buildings enhance body.f11` and compose on the section it becomes. Four or five plain
  floors, then one composed floor, is the rhythm.
- Do not compose every section. A tower where two sections are worked and the rest are plain
  reads as a building; one where all of them are busy reads as noise.
- The four sides are not equal. Compose `S` (the front) first, and only do `N`, `E` and `W` if the
  building is seen from there.

---

## Reading a description

| The user says | What it means |
| --- | --- |
| mega, tower, skyscraper | 30 to 60 floors across four or five sections, a taller base |
| apartment, residential | floor height 2.8 to 3.0, base 3.5, footprint 15 to 25 m, few sections, balconies on the sunny face |
| office, corporate | floor height 4.0, base 4.5, deeper footprint, clean steps, a rhythm of windows and nothing else |
| cyberpunk, futuristic, high tech | `--style cyber`, and read `parts/cyber.md`: a black mass, neon lines, a lit band of floors, one screen, a lit crown |
| 1950s, mid century, old block | `--style fifties`, punched windows, brick, a plain parapet, no twist |
| industrial, brutalist | wide base, heavy overhangs, one or two sections, no twist, `metal` panels |
| shop, retail, street level | a taller ground section, doors and big `window` panels on the front, apartments above |
| far away, background city, fill | one bulk section, `flat` tier, small crown, no facade pass at all |

## Report honestly

Give the user the file path, the height in metres, the section count, the triangle count, and any
section the build called a cantilever. Describe what you built, not what the words suggested: say
"a 30 floor tower in five sections, a twisted upper run, and balconies with doors onto them on the
south face of the base", never "with a lobby" when no door exists.
