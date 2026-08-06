# Enhancing floors

A section repeats one floor. That is what makes a tower cheap to build and also what makes it monotonous: forty
identical bands of wall. `enhance` fixes it by taking one floor out of its section, giving it a section of its
own, and shaping it.

```bash
buildings enhance body.f3 --style ledge
buildings enhance --style cables --side E        # uses whatever the human picked in the preview
```

The floor's section splits into up to three: the floors below keep the original id, the chosen floor becomes
`<section>-e<floor>`, and the floors above become `<section>-a<floor>`. Everything else is untouched.

## The styles

| style | what it does | use it for |
| --- | --- | --- |
| `ledge` | hangs out 0.35 m | a shadow line across the facade, a balcony band, the top of a run |
| `notch` | pulls in 0.4 m | a service or plant floor, a break between two runs |
| `twist` | turns 6 degrees | one floor out of line, which reads as damage or as design |
| `taper` | pulls in toward its own top | the last floor before a step, so the step looks intended |
| `cables` | cables climb one face | ties a run together; pass `--side N\|E\|S\|W` |
| `greebles` | fake parts stand off its faces | one dense floor among plain ones, like a plant level |
| `columns` | uprights stand in its gaps | exposed structure where the mass is cut away |

## Rhythm, not noise

The point is a facade that has structure, not one that is randomly lumpy.

- **Two or three enhanced floors in a tower**, not ten. A tall run wants one break, not a stripe every floor.
- **Regular beats arbitrary.** A ledge every fifth or sixth floor reads as a building. Ledges at floors 3, 4
  and 9 read as a mistake.
- **Mark the ends.** The floor under a step, or the last floor of a run, is where a `ledge` or a `taper` earns
  its place: it makes the step above look deliberate.
- **One style per building, mostly.** Pick `ledge` as the language and use `notch` once, rather than using all
  five.
- **Cables run a whole section**, so use them on the section rather than on a single floor unless you want a
  short stub.

## Working from the preview

The human clicks a floor in the preview and it lands in `selection.json` as a floor id. `buildings selection`
reads it back, and `buildings enhance --style ledge` with no floor named acts on exactly that.

So the loop is: they click, they say what they want, you run one verb, they see it. Check `buildings show`
afterwards: the new section appears in the stack with its own line, and `restsOn` tells you it still lands on
what carries it.

## After enhancing

Always rebuild, then report which floors you changed and what you gave them:

```bash
buildings build
```

Cost: each enhanced floor is one more section, so one more mesh. Two or three per building is nothing; thirty
would double the file for no gain.
