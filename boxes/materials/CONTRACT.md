# materials

Textures written from code. A building's facade is bands of glazing in a near black wall, most windows dark
and a few lit, which is a picture a few lines of pixel work can make better than any photograph: it tiles
exactly, it costs nothing to ship, and every building gets its own.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `facadeTexture({ seed, size, across, down, bay, lit })` | a seed and a grid | `{ colour, emissive, lit }`, both PNG bytes |
| `FACADE_STYLE` | | the tile's own shape, which is what maps it onto a wall |
| `png({ width, height, rgba })` | RGBA pixels | PNG bytes |

Defaults: 256 px square, 8 bays across, 4 floors down, a bay 3 m wide, an eighth of the windows lit.

## The tile

One tile is `down` floors tall and `across` bays wide, and `bay` says what that is in metres, so the kit can
lay a wall's UVs against it: one row of the tile per floor, one bay per 3 m of face. Get that wrong and a
3 m patch of wall carries the whole tile, which reads as a christmas tree.

The colour map carries the wall, the spandrel band under each row of windows, and the glazing, which catches
a little sky at the top of each pane. The emissive map carries the lit windows and nothing else, so they glow
and the wall stays flat. Lit windows are the warm white a room actually is, with the odd cool one.

## Invariants

- The same seed gives the same picture, every build. A different building gives a different one.
- Both maps come out of the same grid, so a window that glows is a window that is lit.
- A tile stays under 40 kB, which is what makes it affordable on every building in a scene.

## Depends on

Nothing.
