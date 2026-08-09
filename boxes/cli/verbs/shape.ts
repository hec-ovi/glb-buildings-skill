/** A placed section as the kit reads it: millimetres become metres, nothing else changes. */
import type { PlacedBand } from '#assemble';
import type { SectionShape } from '#kit';

const MM = 0.001;

export function sectionShape(band: PlacedBand): SectionShape {
  return {
    bottom: band.bottom.map(([x, z]) => [x * MM, z * MM] as [number, number]),
    top: band.top.map(([x, z]) => [x * MM, z * MM] as [number, number]),
    height: (band.y1 - band.y0) * MM,
    floors: band.floors.length,
    chamfer: band.chamfer * MM,
  };
}
