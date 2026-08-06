/**
 * The proofs the Khronos validator cannot do. A file can pass validation and still import
 * inside out, so geometry is checked here, where it is made.
 */
import { normalOf, type MeshData, type Vec } from './geometry.ts';

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

/**
 * Every solid has to hug its section. A part floating out in the air, or standing off the wall
 * by metres, is caught here rather than in a screenshot.
 */
export function proudProblems(meshes: MeshData[], footprint: { x0: number; x1: number; z0: number; z1: number }): MeshProblem[] {
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

/**
 * A closed shell: every edge is shared by exactly two triangles running opposite ways, and
 * the enclosed volume is positive, which is only true when the whole thing faces outward.
 */
export function shellProblems(meshes: MeshData[]): MeshProblem[] {
  const problems: MeshProblem[] = [];
  const edges = new Map<string, number>();
  const key = (p: Vec) => p.map((v) => Math.round(v * 1e5)).join(',');

  // Triangles that share an edge belong to the same solid. A section is a pile of solids, and
  // each one has to be closed and outward facing on its own: summing the volume of all of them
  // hides a small part that is inside out inside a big one that is not.
  const triangles: { points: [Vec, Vec, Vec]; group: number }[] = [];
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
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (const mesh of meshes) {
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const points = [0, 1, 2].map((i) => vertex(mesh, mesh.indices[t + i]!)) as [Vec, Vec, Vec];
      const index = triangles.length;
      triangles.push({ points, group: index });
      parent.push(index);

      for (let i = 0; i < 3; i++) {
        const from = key(points[i]!);
        const to = key(points[(i + 1) % 3]!);
        edges.set(`${from}>${to}`, (edges.get(`${from}>${to}`) ?? 0) + 1);

        const undirected = from < to ? `${from}|${to}` : `${to}|${from}`;
        const met = owner.get(undirected);
        if (met === undefined) owner.set(undirected, index);
        else union(met, index);
      }
    }
  }

  for (const [edge, count] of edges) {
    const [from, to] = edge.split('>') as [string, string];
    if (count > 1) problems.push({ at: edge, detail: `edge used ${count} times in the same direction` });
    if (!edges.has(`${to}>${from}`)) problems.push({ at: edge, detail: 'edge has no opposite, the shell is open' });
  }

  const volumes = new Map<number, number>();
  for (let i = 0; i < triangles.length; i++) {
    const [p0, p1, p2] = triangles[i]!.points;
    const part =
      (p0[0] * (p1[1] * p2[2] - p2[1] * p1[2]) -
        p0[1] * (p1[0] * p2[2] - p2[0] * p1[2]) +
        p0[2] * (p1[0] * p2[1] - p2[0] * p1[1])) /
      6;
    const root = find(i);
    volumes.set(root, (volumes.get(root) ?? 0) + part);
  }

  for (const [root, volume] of volumes) {
    if (volume > 0) continue;
    const where = triangles[root]!.points[0].map((v) => v.toFixed(2)).join(', ');
    problems.push({ at: where, detail: `a solid encloses ${volume.toFixed(3)}, so it is inside out` });
  }

  return problems;
}
