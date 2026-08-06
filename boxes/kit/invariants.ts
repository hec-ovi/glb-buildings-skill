/**
 * The proofs the Khronos validator cannot do. A file can pass validation and still import
 * inside out, so geometry is checked here, where it is made.
 */
import { normalOf, type MeshData, type Vec } from './geometry.ts';
import { outsideBy } from './plan.ts';
import { ringAt, type SectionShape } from './section.ts';

export type MeshProblem = { at: string; detail: string };

function vertex(mesh: MeshData, index: number): Vec {
  return [mesh.positions[index * 3]!, mesh.positions[index * 3 + 1]!, mesh.positions[index * 3 + 2]!];
}

function storedNormal(mesh: MeshData, index: number): Vec {
  return [mesh.normals[index * 3]!, mesh.normals[index * 3 + 1]!, mesh.normals[index * 3 + 2]!];
}

/** Every triangle has area, and every stored normal agrees with its triangle's winding. */
export function windingProblems(mesh: MeshData): MeshProblem[] {
  const problems: MeshProblem[] = [];
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const [a, b, c] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
    const p0 = vertex(mesh, a);
    const p1 = vertex(mesh, b);
    const p2 = vertex(mesh, c);
    const geometric = normalOf(p0, p1, p2);

    if (geometric.every((v) => v === 0)) {
      problems.push({ at: `${mesh.material} tri ${t / 3}`, detail: 'degenerate triangle, no area' });
      continue;
    }
    for (const index of [a, b, c]) {
      const stored = storedNormal(mesh, index);
      const dot = geometric[0] * stored[0] + geometric[1] * stored[1] + geometric[2] * stored[2];
      if (dot <= 0) {
        problems.push({ at: `${mesh.material} tri ${t / 3}`, detail: 'stored normal faces away from the winding' });
        break;
      }
    }
  }
  return problems;
}

/**
 * How far a part may reach past its section's own footprint. A balcony reaches about 1.8 m and
 * a pipe about the same; past this, a part is not attached to the building any more.
 */
export const MAX_PROUD = 3;

/** How far a part may rise above its section's top: a mast and a tower, and no more. */
export const MAX_ABOVE = 12;

/**
 * Every solid has to hug its section. A part floating out in the air, or standing off the wall
 * by metres, is caught here rather than in a screenshot.
 */
export function proudProblems(meshes: MeshData[], footprint: { x0: number; x1: number; z0: number; z1: number; height?: number }): MeshProblem[] {
  const problems: MeshProblem[] = [];

  for (const mesh of meshes) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < mesh.positions.length; i += 3) {
      minX = Math.min(minX, mesh.positions[i]!);
      maxX = Math.max(maxX, mesh.positions[i]!);
      minZ = Math.min(minZ, mesh.positions[i + 2]!);
      maxZ = Math.max(maxZ, mesh.positions[i + 2]!);
    }

    let above = -Infinity;
    for (let i = 1; i < mesh.positions.length; i += 3) above = Math.max(above, mesh.positions[i]!);
    if (footprint.height !== undefined && above - footprint.height > MAX_ABOVE) {
      problems.push({
        at: mesh.material,
        detail: `a part stands ${(above - footprint.height).toFixed(2)} m above the section, which is taller than anything the kit puts on a roof`,
      });
    }

    const proud = Math.max(footprint.x0 - minX, maxX - footprint.x1, footprint.z0 - minZ, maxZ - footprint.z1);
    if (proud > MAX_PROUD) {
      problems.push({
        at: `${mesh.material}`,
        detail: `a part reaches ${proud.toFixed(2)} m past the section's footprint, so it is not on the building`,
      });
    }
  }
  return problems;
}

type Triangle = [Vec, Vec, Vec];

const corner = (p: Vec) => p.map((v) => Math.round(v * 1e5)).join(',');

/**
 * Triangles grouped into solids: two that share an edge are the same piece. A section is a pile
 * of separate solids, and each one has to hold up on its own, so every proof below works on one
 * group at a time. Summing over the lot hides a small part that is wrong inside a big one that
 * is not.
 */
export function solids(meshes: MeshData[]): Triangle[][] {
  const triangles: Triangle[] = [];
  const owner = new Map<string, number>();
  const parent: number[] = [];

  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[i] !== root) {
      const next = parent[i]!;
      parent[i] = root;
      i = next;
    }
    return root;
  };

  for (const mesh of meshes) {
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const points = [0, 1, 2].map((i) => vertex(mesh, mesh.indices[t + i]!)) as Triangle;
      const index = triangles.length;
      triangles.push(points);
      parent.push(index);

      for (let i = 0; i < 3; i++) {
        const from = corner(points[i]!);
        const to = corner(points[(i + 1) % 3]!);
        const edge = from < to ? `${from}|${to}` : `${to}|${from}`;
        const met = owner.get(edge);
        if (met === undefined) owner.set(edge, index);
        else {
          const a = find(met);
          const b = find(index);
          if (a !== b) parent[b] = a;
        }
      }
    }
  }

  const groups = new Map<number, Triangle[]>();
  triangles.forEach((points, i) => {
    const root = find(i);
    const group = groups.get(root);
    if (group) group.push(points);
    else groups.set(root, [points]);
  });
  return [...groups.values()];
}

/** Six times the volume a solid encloses. Positive when it faces outward. */
function volumeOf(group: Triangle[]): number {
  let total = 0;
  for (const [p0, p1, p2] of group) {
    total +=
      p0[0] * (p1[1] * p2[2] - p2[1] * p1[2]) -
      p0[1] * (p1[0] * p2[2] - p2[0] * p1[2]) +
      p0[2] * (p1[0] * p2[1] - p2[0] * p1[1]);
  }
  return total / 6;
}

/**
 * A closed shell: every edge is shared by exactly two triangles running opposite ways, and
 * the enclosed volume is positive, which is only true when the whole thing faces outward.
 */
export function shellProblems(meshes: MeshData[]): MeshProblem[] {
  const problems: MeshProblem[] = [];
  const edges = new Map<string, number>();

  for (const mesh of meshes) {
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const points = [0, 1, 2].map((i) => vertex(mesh, mesh.indices[t + i]!)) as Triangle;
      for (let i = 0; i < 3; i++) {
        const edge = `${corner(points[i]!)}>${corner(points[(i + 1) % 3]!)}`;
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
  }

  for (const [edge, count] of edges) {
    const [from, to] = edge.split('>') as [string, string];
    if (count > 1) problems.push({ at: edge, detail: `edge used ${count} times in the same direction` });
    if (!edges.has(`${to}>${from}`)) problems.push({ at: edge, detail: 'edge has no opposite, the shell is open' });
  }

  for (const group of solids(meshes)) {
    const volume = volumeOf(group);
    if (volume > 0) continue;
    const where = group[0]![0].map((v) => v.toFixed(2)).join(', ');
    problems.push({ at: where, detail: `a solid encloses ${volume.toFixed(3)}, so it is inside out` });
  }

  return problems;
}

/**
 * How far past the section a part has to reach to count as standing on it. More than the bite a
 * part takes into the wall behind it, so a part built inside out, which pokes out by its bite
 * and hides the rest of itself in the building, cannot pass for one that stands proud.
 */
export const SHOWS = 0.05;

/**
 * Everything a section wears is meant to be seen: a column, a panel, a balcony, a pipe, a tank.
 * A part that never reaches out of the section is not decoration, it is a mistake nobody can see
 * from the outside, and it flickers against whatever wall it is buried in.
 *
 * Each solid is measured against the footprint at its own height, so a taper or a twist never
 * makes an honest part read as buried, and a part on the deck reaches out through the top.
 */
export function sunkProblems(meshes: MeshData[], shape: SectionShape): MeshProblem[] {
  const problems: MeshProblem[] = [];

  for (const group of solids(meshes)) {
    let reach = -Infinity;
    for (const points of group) {
      for (const [x, y, z] of points) {
        const t = Math.max(0, Math.min(1, y / (shape.height || 1)));
        reach = Math.max(reach, outsideBy(ringAt(shape, t), [x, z]), y - shape.height);
      }
    }
    if (reach >= SHOWS) continue;

    const where = group[0]![0].map((v) => v.toFixed(2)).join(', ');
    problems.push({
      at: where,
      detail: `a part stands ${Math.max(0, reach).toFixed(2)} m out of the section, so it is buried in it`,
    });
  }

  return problems;
}
