# materials

Textures written from code. A building's facade is a grid of windows, most dark and some lit, which is a
picture a few lines of pixel work can make better than any photograph: it tiles exactly, it costs nothing to
ship, and every building gets its own.

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `facadeTexture({ seed, size, across, down, lit })` | a seed and a grid | `{ colour, emissive, lit }`, both PNG bytes |
| `png({ width, height, rgba })` | RGBA pixels | PNG bytes |

Defaults: 256 px square, 6 windows across, 4 down, a third of them lit.

## The tile

One tile is a floor tall and a bay wide, so it repeats up a facade without a seam. The colour map carries the
wall, a faint band at each floor line, and the window cells; the emissive map carries the same cells, black
everywhere else, so the lit ones glow and the wall stays flat.

Window tints are the ones a city shows at night: warm white, cool white, amber, a little cyan and green.

## Invariants

- The same seed gives the same picture, every build. A different building gives a different one.
- Both maps come out of the same grid, so a window that glows is a window that is lit.
- A tile stays under 40 kB, which is what makes it affordable on every building in a scene.

## Depends on

Nothing.
