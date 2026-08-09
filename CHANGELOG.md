# Changelog

Present-state entries: each version says what the project is at that point.

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
