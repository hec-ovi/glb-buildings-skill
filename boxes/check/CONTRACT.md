# check

The proofs on the document, before any geometry exists. Today it answers one question, the one that decides
whether a stack of sections is a building: does each section land on the one below it?

## In and out

| Call | Takes | Gives |
| --- | --- | --- |
| `supports(scene)` | `PlacedScene` | one `Support` per junction, with the share resting and a line to read |
| `checkSupport(scene)` | `PlacedScene` | the same, or throws on the first section that floats |
| `overlap(a, b)` / `area` / `centroid` / `inside` / `toPoints` | plan polygons | the geometry the answer is made of |

```
Support { band, on, share, offCentre, widerThanBelow, reads }
```

`share` is how much of a section's underside lands on the section below, 0 to 1.

## The rule

| Share | Verdict |
| --- | --- |
| 0.5 and up | resting, ordinary |
| 0.2 to 0.5 | a cantilever: allowed, reported, and worth saying out loud |
| under 0.2 | floating: refused, with the section named and what to change |

A section whose middle hangs past the edge of the one below is refused too, unless it is resting on at least
half of it. Thresholds are `FLOATING` and `CANTILEVER`. `widerThanBelow` says a section is bigger in plan
than the one carrying it: fine for a platform, worth saying out loud on a tower.

## Errors

`E_FLOATING_PART`, carrying the section id and the share that was measured.

## Not here yet

Envelope limits and the human size table. The other proofs live where the geometry is: a buried or adrift
part and the triangle budget are measured in `#glb` as each section is built, and two roof parts in one cell
are refused in `#kit`.

## Depends on

`#spec`, `#assemble`.
