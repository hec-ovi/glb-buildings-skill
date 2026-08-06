/**
 * The proof that matters when sections are free to step, slide and turn: does a section land
 * on the one below it? A section that rests on most of its neighbour is ordinary, one that
 * reaches out over the edge is a cantilever and worth reporting, and one that touches almost
 * nothing is floating and is refused.
 */
import { BuildingError, type BuildingDocument } from '#spec';
import { assemble, type PlacedScene } from '#assemble';
import { area, centroid, inside, overlap, toPoints } from './polygon.ts';

/** Under this share of its own footprint, a section is not resting on anything. */
export const FLOATING = 0.2;
/** Under this share, it is a cantilever: allowed, and said out loud. */
export const CANTILEVER = 0.5;

export type Support = {
  band: string;
  on: string;
  /** How much of this section's underside lands on the section below, 0 to 1. */
  share: number;
  /** True when the section's middle is over thin air. */
  offCentre: boolean;
  reads: string;
};

export function supports(scene: PlacedScene): Support[] {
  const found: Support[] = [];

  for (let i = 1; i < scene.bands.length; i++) {
    const below = scene.bands[i - 1]!;
    const band = scene.bands[i]!;
    const foot = toPoints(band.bottom);
    const seat = toPoints(below.top);

    const footArea = area(foot);
    const shared = footArea === 0 ? 0 : area(overlap(foot, seat)) / footArea;
    const offCentre = !inside(seat, centroid(foot));

    found.push({
      band: band.id,
      on: below.id,
      share: Math.round(shared * 100) / 100,
      offCentre,
      reads:
        shared >= CANTILEVER
          ? `rests on ${Math.round(shared * 100)}% of ${below.id}`
          : `cantilevers: only ${Math.round(shared * 100)}% of it lands on ${below.id}`,
    });
  }

  return found;
}

/** Throws on the first section that is not resting on anything. */
export function checkSupport(scene: PlacedScene): Support[] {
  const found = supports(scene);
  for (const support of found) {
    if (support.share < FLOATING) {
      throw new BuildingError(
        'E_FLOATING_PART',
        `section ${support.band} floats: only ${Math.round(support.share * 100)}% of it lands on ${support.on}. ` +
          'Slide it back with --shift-x or --shift-z, widen the section below, or make this one smaller',
        ['bands', support.band],
      );
    }
    if (support.offCentre && support.share < CANTILEVER) {
      throw new BuildingError(
        'E_FLOATING_PART',
        `section ${support.band} hangs past its own middle over ${support.on}, with ${Math.round(support.share * 100)}% resting. ` +
          'A cantilever has to keep its centre over the section below',
        ['bands', support.band],
      );
    }
  }
  return found;
}

export function checkDocument(doc: BuildingDocument): Support[] {
  return checkSupport(assemble(doc));
}
