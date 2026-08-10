# One thing on a wall: `window`, `door`, `balcony`, `screen`

Read `parts/textures.md` first: the five rules, the words to append, the negative prompt and the
family table are there and every skeleton below assumes them.

These are not tiles. Each one is a picture of **one thing**, and the toolkit puts the whole picture
across the front of the element it is drawn on, whatever size that element is.

| Finish | Goes on | How the picture lands |
| --- | --- | --- |
| `window` | a pane cut into a face | fills the element |
| `door` | a way in at street level | fills the element |
| `screen` | a sign or a video wall composed on a face | fills the element |
| `balcony` | the balustrade round a balcony | fills the height, repeats along the length |

## The rule that matters for all four

**The subject fills the frame edge to edge.** No background, no margin, no drop shadow, no wall
around it, nothing cropped. If the model leaves a border, the border ends up drawn on the building
as part of the window.

Say it outright, in these words, at the end of every prompt here:

```
The subject fills the frame edge to edge, its own frame running right to the edge of the picture:
nothing cropped, no background and no margin around it.
```

Install them with no `--across`, no `--down` and no `--metres`. These do not tile and hold no grid:

```bash
buildings add-texture window ~/out/window.png
buildings add-texture door ~/out/door.png --emissive ~/out/door-lit.png
```

## `window`

One window unit seen dead on, and nothing else. It is repeated over every window on a composed
floor, so it has to be the ordinary one, not the interesting one.

```
Hyper realistic, extreme realism, photographic. Photograph of one [family] window seen dead-on,
filling the frame edge to edge. [Frame: material, colour, profile.] [Glass: tint, what it reflects.]
[One mullion or glazing bar, if the family has them.] The glass is dark and closed, holding a faint
reflection and nothing else: NO interior, NO room, NO furniture, NO lamp, NO person, NO curtain
pattern. [The subject fills the frame edge to edge...] Hyper realistic, hyper realism, extreme
realist.
```

No emissive map. A window that glows everywhere it is placed makes every composed floor identical
and bright, which is the opposite of what a composed floor is for.

## `door`

The way in. It is placed once at street level, so this one may be the interesting picture.

```
Hyper realistic, extreme realism, photographic. Photograph of one [family] entrance door seen
dead-on, filling the frame edge to edge. [Leaf: material, colour, glazing, handle.] [Frame.] [What
is behind the glass: a lobby, a light spilling out, a silhouette of a desk.] Warm light from inside
falling on the threshold. [The subject fills the frame edge to edge...] Hyper realistic, hyper
realism, extreme realist.
```

**Give a door an emissive map**: black, with the glazing and whatever light spills from the lobby
lit. A lit doorway at the bottom of a dark tower is what makes it read as a building people go into.

Doors are worth two or three variants: `door_1` a service hatch, `door_2` a glass entrance, `door_3`
a lobby. The building picks between them, and a tower with a service hatch for a front door looks
wrong in a way nobody can name.

## `screen`

A sign panel or a video wall composed on a face, and the fallback picture for a `screen` element.
For the big ads that hang off a cyberpunk tower, read `parts/textures-ads.md` instead: those are
passed to the `screen` verb by path and are not part of a pack.

```
Hyper realistic, extreme realism, photographic. Photograph of a backlit sign panel seen dead-on,
filling the frame edge to edge with no bezel. [A flat lit face, its colour, the ghost of the strips
behind it, one graphic band across it.] No text, no letters, no logo. [The subject fills the frame
edge to edge...] Hyper realistic, hyper realism, extreme realist.
```

Emissive: the same image at full brightness on black. A screen is a light, so its own picture is
what glows.

## `balcony`

The balustrade, and only the balustrade. This one is different from the other three: it **fills the
height and repeats along the length**, because a 4 m balcony and a 1.5 m balcony wear the same rail
at the same size.

So the picture is one length of balustrade seen dead on, cut so that the left edge and the right
edge join:

```
Hyper realistic, extreme realism, photographic. Photograph of a [family] balcony balustrade seen
dead-on from outside, filling the frame edge to edge, top to bottom. [Rail: material, profile.]
[What is under the rail: balusters, a glass panel, a solid parapet, perforated metal.] Nothing above
the rail and nothing below the bottom edge: NO floor, NO slab, NO wall behind, NO plant, NO chair,
NO washing, NO sky. The picture starts and ends between two balusters so where it repeats along the
length the join is invisible. [The subject fills the frame edge to edge...] Hyper realistic, hyper
realism, extreme realist.
```

**Nothing above the rail** is the emphatic part. Anything the model puts up there, a sky, a plant, a
person, gets stretched across every balcony on the building.

No emissive map. A balustrade is not a light.
