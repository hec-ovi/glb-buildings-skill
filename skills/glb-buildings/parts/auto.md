# A building from one description

The user says "a high tech cyberpunk mega tower" or "a plain six storey apartment block". You build it as a
stack of sections, bottom to top, checking as you go. Never invent a verb; run `buildings help` if unsure.

## The walk

1. **Read the description for four things**: footprint (width x depth in metres), how many floors, how tall a
   floor is, and how much character the top and bottom need. If the user gave none, use the defaults in
   `parts/dimensions.md`.

2. **Start the project.**
   ```bash
   buildings new <name> --width 22 --depth 18 --floors 24
   ```
   That gives you three sections: `ground` (main), `body` (bulk), `crown` (roof).

3. **Give the base weight.** A base is taller and usually wider than what sits on it, and it is seen from the
   street, so it is the one place to spend a `light` tier at the bottom.
   ```bash
   buildings set-band ground --height 6 --width 26 --depth 22 --tier light --columns corners --chamfer 0.3
   ```

4. **Cut the middle into sections.** This is what makes a building instead of an extrusion. Three to five
   sections, each with its own footprint and step. Dress two of them and leave the rest flat: flat next to
   worked is what makes either one read.
   ```bash
   buildings set-band body --floors 6 --height 3.2 --tier light --greebles 0.35 --columns ribs
   buildings add-band mid   --kind bulk --tier flat  --template bulk-flat --floors 5 --inset 0.8 --wires S --after body
   buildings add-band upper --kind bulk --tier light --template bulk-flat --floors 6 --inset 1.6 --balconies S --after mid
   ```

5. **Add the one thing that makes it memorable.** Pick from the description: a twisted run of floors, a
   cantilevered platform, a mass slid off centre.
   ```bash
   buildings add-band twistrun --kind custom --tier light --template bulk-flat --floors 4 --rotation 12 --twist 22 --taper 0.8 --after upper
   buildings add-band pad --kind custom --tier light --template bulk-flat --floors 1 --height 1.2 --width 24 --depth 8 --shift-z -3 --after twistrun
   ```

6. **Finish the crown.** A parapet is 1.0 to 1.2 m; a turned or tapered crown reads as a spire. The roof is
   where the silhouette is made, so give it clutter, or lay parts out by cell with `deck` and `place`.
   ```bash
   buildings set-band crown --height 3 --width 10 --depth 9 --rotation 45 --clutter 0.45
   ```

7. **Build and report.**
   ```bash
   buildings build
   ```
   Give the user the file path, the height in metres, the section count, the triangle count, and any section
   the build called a cantilever.

## Reading a description

| The user says | What it means in the stack |
| --- | --- |
| mega, tower, skyscraper | 30 to 60 floors across four or five sections, a taller base |
| apartment, residential | floor height 2.8 to 3.0, base 3.5, footprint 15 to 25 m, few sections |
| office, corporate | floor height 4.0, base 4.5, deeper footprint, clean steps |
| cyberpunk, futuristic, high tech | more sections, a twist, a cantilevered platform, cables on one face, a turned crown |
| industrial, brutalist | wide base, heavy overhangs, one or two sections, no twist |
| far away, background city, fill | one bulk section, `flat` tier, small crown, nothing else |

## Stay honest

The kit today has three templates (`buildings templates`), shapes them with footprint, step, slide, turn,
twist and taper, and dresses them with windows, greebles, columns, balconies, cables and roof parts. Doors,
landings and awnings do not exist yet. Describe what you built, not what the words suggested: say "a 30 floor
tower in five sections with a twisted upper run, balconies on the south face and a cantilevered platform",
never "with a lobby entrance" when no door exists.
