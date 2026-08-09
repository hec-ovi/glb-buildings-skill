think of it of each floor as a grid, rectangular (vertical or horizontal) or even a square.

lets say a rectangle vertical, which is the most common, lets say is a zone of 2mt of height, and 10mt of x,y so that would mean z is 2mt and x,y is 10mtx10mt
in this case this floor has 4 faces, each is 2x10, that would in this case be 2 axis so is x,y.
each face is unique, and the tool should detect it the idea is we divide this on grids, perfect grids of 20 x 100 units (in the case is 2mt x 10mt)
this would mean, the model sees a matrix per each face of the floor. this is where the freedom comes, so... a window can be in a zone of 1x3 (a long rectangle window) or can be a 2x2. so we put some rules, for example the whole draw zone of the floor should at least have 1 square on borders of margin, but inside that, the model would draw different windows, using this approach, this way we guarantee nothing is overlapping, or textures are weird, so the textures now are the windows itself with different colors.

this also should allow to make better balconies, etc example:

s,s,s,s,s,s,s
s,x,x,x,x,s,s
s,x,x,x,x,s,s <-a full window
s,s,s,s,s,s,s
s,s,s,s,s,s,s
s,s,s,s,s,s,s
s,s,s,s,s,s,s
s,s,x,x,x,s,s
s,s,x,x,x,s,s
s,s,x,x,x,s,s
s,s,x,x,x,s,s
s,v,x,x,x,v,s
s,v,x,x,x,v,s
s,v,x,x,x,v,s
s,v,x,x,x,v,s
s,v,x,x,x,v,s
s,v,x,x,x,v,s
s,v,x,x,x,v,s
s,v,v,v,v,v,s <- a balcony so we move this to the z dimension, and from there we could do another one that is a V thing to make it a balcony
s,s,s,s,s,s,s
s,s,s,s,s,s,s


where v could be another box dimension in z axis, hope is clear... and the x is a door window to that balcony

our idea is the model can specify put window here, floor in z dimension there, a pipe that goes to a line.


and about pipes, they also have units on how much they go out of the building, can be pipe, or a wire for example, so, if the model specifies one, he sets up the deep, and the tool automatically should model all, i do not want th emodel to model anything at all but focus only on the elements and architecture, so we have pre built pipelines, wires, windows, doors, balconies, so he does dobalcony(dimensions)

i could explain it even deeper, like dobalcony has all the dimensions, volumes, etc... but... i hope you understand, now what is happening is all is not like this, is too complex for the model, but with this grid system it should work