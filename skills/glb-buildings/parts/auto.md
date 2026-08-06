# A building from one description

The user says "a high tech cyberpunk mega tower" or "a plain six storey apartment block". You walk the stack
bottom to top, checking as you go. Never invent a verb; run `buildings help` if unsure.

## The walk

1. **Read the description for four numbers**: footprint (width x depth in metres), how many floors, how tall a
   floor is, and how special the top and bottom are. If the user gave none, use the defaults in
   `parts/dimensions.md`.

2. **Start the project.**
   ```bash
   buildings new <name> --width 22 --depth 18 --floors 24
   ```
   That already gives you three bands: `ground` (main), `body` (bulk), `crown` (roof).

3. **Shape the ground floor.** It is taller than the rest: 4.3 to 4.5 m for a lobby or a shop front.
   ```bash
   buildings set-band ground --height 4.5
   ```

4. **Shape the bulk.** This is where the height comes from. Residential floors are 2.8 to 3.0 m, offices 4.0 m.
   ```bash
   buildings set-band body --floors 20 --height 3.0 --tier flat
   ```

5. **Break the bulk up** when the description asks for variety. Split it into two bands with something between
   them, so the tower reads as a building and not an extruded box.
   ```bash
   buildings add-band sky --kind custom --tier light --template bulk-flat --floors 1 --height 4 --after body
   buildings add-band upper --kind bulk --tier flat --template bulk-flat --floors 8 --after sky
   ```

6. **Finish the crown.** A parapet is 1.0 to 1.2 m above the roof deck.
   ```bash
   buildings set-band crown --height 1.1
   ```

7. **Build and report.**
   ```bash
   buildings build
   ```
   Give the user the file path, the height in metres, the floor count and the triangle count.

## Reading a description

| The user says | What it means in the stack |
| --- | --- |
| mega, tower, skyscraper | many bulk floors, 30 to 60, and a taller ground floor |
| apartment, residential | floor height 2.8 to 3.0, ground 3.5, footprint 15 to 25 m |
| office, corporate | floor height 4.0, ground 4.5, deeper footprint, 6 to 9 m bays |
| shop, retail at the bottom | ground floor 4.3 to 4.5 |
| cyberpunk, futuristic, high tech | more bands, varied heights, a setback or two, a tall crown |
| brutalist, plain, background | one bulk band, `flat` tier, small crown |
| far away, background city, fill | every band `flat`, as few bands as possible |

## Stay honest

The kit today has three templates (`buildings templates`): `main-plain`, `bulk-flat`, `roof-parapet`. Balconies,
windows as geometry, doors, AC units and wires are not in it yet. Describe what you built, not what the words
suggested: say "a 24 floor tower with a 4.5 m ground floor and a parapet crown", never "with balconies" when no
balcony exists.
