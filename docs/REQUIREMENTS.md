# Requirements

Every request from Hector, raw, in his words, appended in order. Nothing is edited or removed.

## 1

the idea is a tool that can do the next things:
1 - create buildings mesh.
2 - export for compatible as general and exact and professional as possible for unreal engine, unity, and threejs

must have a preview in threejs of the result.

the skill will solve the next commopn issues on creation (we will be working in iterations)
proportions, elements out of the boundary, meaning floating, etc.
elements overlapping each other.
wrong positions in x,y,z coordinates like you rotate and overlap, etc.
same with uv positions and textures.
we will work by floors, and from floors by blocks of floors, this would mean:
floors have balconies, with doors and windows, AND textures for those (dont worry i will provide images)
we will do more complex, and more simple ones, this means some floors might be just box with texture, while others might be complex ones that have a door or a place to land/walk.
the buildings must have compatibility of block by block, how will we solve that part is our challange.

the product itself is, we create a building basic mesh, that specific mesh can have repeated floors, and repeated groups of floors stacked to make tall ones.

the main floor is special, the roof is special.

we will make the skill like we always do with resolver/index with fat skills (reserarch and keep in memory)
this means to create main floor we have one fat skill, to create roof another fat skill, to create a specific floor not bulk but one with landing, doors and windows we have another, and to create bulk parts anther skill. this means for each we have a set of mesh, material and texture for each.

the end product is by steps and you can go back and re-edit:
is modular... the buildings, this means, you modify main floor, and the rest can keep intact, because is stack, yuou cna modify a section, or a roof.

is specifically created to generate buildings glbs.

it should suppot also a full auto so the agent makes a full agentic workflow (we have one in censurado web brain) so use that structure (first main floor, then some bulk, then some customs floors, then more bulk, then roof, or similar, creatrively) then the user wants a 1 shot with a description (e.g. a high tech mega building cyberpunk)

our most iteration will be used in the next friction parts:
how can we avoid floating boxes that are not connected? or block the previous or upper floors? if we want high quality, we need a lot of meshing, so we want elements, balconies, windows, doors, wires, ACs units, small roofs over doors, etc... how do we make this concept not messy, and flexible and dynamic possible where it does not make things being floating or overlapping?
so we need here an architecture coordination and proportions of real human sizes.

in the preview we want some sort of blueprint, that show sizes, and blocks, so if i click one block i should be able to edit, this must happen in real time "add a door here, add a window there, add a balcony thete, in this bulk, rotate the 3 floors so gives more futyuristic approach, this and that" this means the editor must have a click detector where i select where i want to make an edition from which x,y,z so i can pan, rotate, zoom in and out, and enable a toggle where the mouse can draw a rectanble, this must make an active zone, then i go back to the cli agent and say "put a window there" and the model should know.

## 2

in some cases a whole building can be fake, not even 1 real floor, all bulky, low poly, and thats it
