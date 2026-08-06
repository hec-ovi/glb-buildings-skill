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
 * A closed shell: every edge is shared by exactly two triangles running opposite ways, and
 * the enclosed volume is positive, which is only true when the whole thing faces outward.
 */
export function shellProblems(meshes: MeshData[]): MeshProblem[] {
  const problems: MeshProblem[] = [];
  const edges = new Map<string, number>();
  let volume = 0;
  const key = (p: Vec) => p.map((v) => Math.round(v * 1e5)).join(',');

  for (const mesh of meshes) {
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const points = [0, 1, 2].map((i) => vertex(mesh, mesh.indices[t + i]!));
      const [p0, p1, p2] = points as [Vec, Vec, Vec];

      volume +=
        (p0[0] * (p1[1] * p2[2] - p2[1] * p1[2]) -
          p0[1] * (p1[0] * p2[2] - p2[0] * p1[2]) +
          p0[2] * (p1[0] * p2[1] - p2[0] * p1[1])) /
        6;

      for (let i = 0; i < 3; i++) {
        const from = key(points[i]!);
        const to = key(points[(i + 1) % 3]!);
        edges.set(`${from}>${to}`, (edges.get(`${from}>${to}`) ?? 0) + 1);
      }
    }
  }

  for (const [edge, count] of edges) {
    const [from, to] = edge.split('>') as [string, string];
    if (count > 1) problems.push({ at: edge, detail: `edge used ${count} times in the same direction` });
    if (!edges.has(`${to}>${from}`)) problems.push({ at: edge, detail: 'edge has no opposite, the shell is open' });
  }

  if (volume <= 0) problems.push({ at: 'shell', detail: `enclosed volume is ${volume.toFixed(3)}, the shell is inside out` });

  return problems;
}
