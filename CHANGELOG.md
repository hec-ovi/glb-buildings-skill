# Changelog

Present-state entries: each version says what the project is at that point.

## 0.3.0

A face is a grid of 10 cm cells. `face` prints it, `put` places a window, door, panel or balcony on a
rectangle of cells, and two elements can never claim the same cell, so an overlap is refused before any
geometry exists. A balcony keeps its slab and its two side rails and leaves the middle open, which is the
space the door onto it needs. Materials arrive with the elements: crystal, concrete, metal and lit screens,
made only where something is actually made of them.

A duct, a pipe and a cable are one builder: a path of points carrying a ring, mitred onto the plane bisecting
the two runs at every corner, so a run holds its cross section the whole way and a turn too sharp to mitre is
refused with the point named. `run` lays one along any path.

A roof carries things worth looking at: a lattice mast drawing in to a spire and guyed down to the deck, a
dish on its mount, a sector array, a cluster of whips, rows of tilted solar panels on a frame, and a water
tank on legs with a cap, a ladder and its outlet. All of them are segments, so every leg, brace, guy and rung
is a mitred solid.

Greebles are what a section wears when it wears nothing else: one carrying windows, composed faces or runs
turns them off, and `show` says so. A balcony fills the cells it claims, with a solid balustrade rather than a
bar with a gap under it.

The skill splits into two passes: an architect that settles the massing and proves it stands, then one facade
job per section that sees only its own grid.

## 0.2.0

A building is a stack of sections, each one the loft between the footprint it starts on and the one it ends
on, so a step, a slide, a turn, a twist, a taper, a round plan, an arc, a bowed face and a filleted corner are
one operation and no transition piece is needed. Sections wear cut windows, greebles, columns, balconies and
cables, and a roof is a grid of named cells laid out with `deck`, `place` and `unplace`. Facade textures are
written from code and seeded from the building's name, in colour and emissive, and the geometry cuts its panes
where the picture draws them. Every section is proved before the file exists: it lands on the one below, its
normals agree with its winding, it closes into a solid with positive volume, nothing it wears is buried or
adrift, and it stays inside the triangle budget its tier promises (120 a floor `flat`, 1200 `light`, 4000
`full`, 4500 for a roof). `show` reads back every flag `add-band` and `set-band` accept.

## 0.1.0

A building is a named project you drive with `buildings <verb>`. The document is bands of floors in whole
millimetres; `build` turns it into a GLB with one mesh per band, one node per floor, two materials, a closed
shell proof and the Khronos validator; `preview` serves a three.js blueprint where a click picks a bay and a
dragged rectangle marks a zone, both readable back through `selection`. Ships as an agent skill: one resolver
and four fat parts.

## 0.0.1

Repo initialized: docs scaffold, MIT license.
