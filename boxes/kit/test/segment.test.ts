import { describe, expect, it } from 'vitest';
import { BuildingError } from '#spec';
import { Surface, segment, shellProblems, solids, triangleCount, windingProblems, type Vec } from '#kit';

/** Build one run on its own, the way a caller does, and hand back the mesh. */
function run(points: Vec[], style: Parameters<typeof segment>[2]) {
  const surface = new Surface('facade');
  segment(surface, points, style);
  return surface.data();
}

const PATHS: [string, Vec[]][] = [
  ['a straight', [[0, 0, 0], [0, 5, 0]]],
  ['a right angle', [[0, 0, 0], [0, 5, 0], [4, 5, 0]]],
  ['a climb and two turns', [[0, 0, 0], [0, 5, 0], [4, 5, 0], [4, 5, 3], [4, 1, 3]]],
  ['a free angle', [[0, 0, 0], [3, 4, 2], [6, 4, 5]]],
  ['a shallow bend', [[0, 0, 0], [0, 5, 0], [2.9, 10, 0]]],
];

describe('a segment', () => {
  it('closes into one solid, however it turns, square or round', () => {
    for (const [name, points] of PATHS) {
      for (const style of [{ thickness: 0.3 }, { profile: 'round' as const, thickness: 0.3, sides: 8 }]) {
        const mesh = run(points, style);
        expect(windingProblems(mesh), `${name} ${style.profile ?? 'square'}`).toEqual([]);
        expect(shellProblems([mesh]), `${name} ${style.profile ?? 'square'}`).toEqual([]);
        // One run is one piece: a corner that failed to mitre would leave two.
        expect(solids([mesh]), `${name} ${style.profile ?? 'square'}`).toHaveLength(1);
      }
    }
  });

  it('keeps its cross section through a corner, so a run never pinches or swells', () => {
    // A right angle in the XY plane, so Z is across both runs and must never change.
    const mesh = run([[0, 0, 0], [0, 5, 0], [4, 5, 0]], { thickness: 0.4 });
    const spread = (of: 0 | 1 | 2, on?: { axis: 0 | 1 | 2; at: number }) => {
      const found: number[] = [];
      for (let i = 0; i < mesh.positions.length; i += 3) {
        if (on && Math.abs(mesh.positions[i + on.axis]! - on.at) > 1e-6) continue;
        found.push(mesh.positions[i + of]!);
      }
      return Math.max(...found) - Math.min(...found);
    };

    // Across the turn, everywhere in the run, including the mitre itself.
    expect(spread(2)).toBeCloseTo(0.4, 6);
    // And across each run in its own plane: the ring the run starts on, and the one it ends on.
    expect(spread(0, { axis: 1, at: 0 })).toBeCloseTo(0.4, 6);
    expect(spread(1, { axis: 0, at: 4 })).toBeCloseTo(0.4, 6);
  });

  it('costs one ring per point, so a four point path is three runs of tube', () => {
    const square = run([[0, 0, 0], [0, 5, 0], [4, 5, 0], [4, 5, 3]], { thickness: 0.3 });
    // Three runs of four quads, plus a fan at each end.
    expect(triangleCount(square)).toBe(3 * 4 * 2 + 4 * 2);
  });

  it('refuses a fold, naming the point, rather than building a run through itself', () => {
    const fold = () => run([[0, 0, 0], [0, 5, 0], [0, 0.1, 0]], { thickness: 0.3 });
    expect(fold).toThrow(BuildingError);
    expect(fold).toThrow(/turns back on itself at point 2/);
  });

  it('refuses a path that is one place, and a thickness of nothing', () => {
    expect(() => run([[0, 0, 0], [0, 0, 0]], { thickness: 0.3 })).toThrow(/two points/);
    expect(() => run([[0, 0, 0], [0, 5, 0]], { thickness: 0 })).toThrow(/thickness/);
  });
});
