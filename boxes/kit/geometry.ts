/**
 * Triangle building, in metres, with the winding rule that keeps engines happy:
 * front faces are counter-clockwise seen from outside, and every stored normal agrees
 * with the geometric normal of its triangle.
 */

export type MeshData = {
  material: string;
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
};

export type Vec = [number, number, number];

function sub(a: Vec, b: Vec): Vec {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function normalOf(p0: Vec, p1: Vec, p2: Vec): Vec {
  const n = cross(sub(p1, p0), sub(p2, p0));
  const length = Math.hypot(n[0], n[1], n[2]) || 1;
  return [n[0] / length, n[1] / length, n[2] / length];
}

/** Metres of surface per texture tile, for parts that carry no layout of their own. */
export const TILE = 3;

/**
 * Where a quad sits on its texture. V runs up the wall, so `v0` is the bottom of the quad and
 * the image's own top left is `[0, 1]`, the way glTF reads a texture.
 */
export type Patch = { u0: number; u1: number; v0: number; v1: number };

/** Accumulates one material's triangles. Quads go in counter-clockwise seen from outside. */
export class Surface {
  readonly material: string;
  readonly #positions: number[] = [];
  readonly #normals: number[] = [];
  readonly #uvs: number[] = [];
  readonly #indices: number[] = [];

  constructor(material: string) {
    this.material = material;
  }

  get empty(): boolean {
    return this.#indices.length === 0;
  }

  /**
   * One quad, four corners counter-clockwise seen from the front. UVs come from the two in-plane
   * edges, so a wall and a roof tile at the same real-world scale, unless the caller lays them
   * out itself: a facade has to place its tile against the floors and bays it is drawn for.
   */
  quad(p0: Vec, p1: Vec, p2: Vec, p3: Vec, patch?: Patch): this {
    const width = Math.hypot(...sub(p1, p0));
    const height = Math.hypot(...sub(p3, p0));
    const uv: [number, number][] = patch
      ? [
          [patch.u0, patch.v1],
          [patch.u1, patch.v1],
          [patch.u1, patch.v0],
          [patch.u0, patch.v0],
        ]
      : [
          [0, 0],
          [width / TILE, 0],
          [width / TILE, height / TILE],
          [0, height / TILE],
        ];

    // Two triangles, each with its own normal. A corner that collapses (a collar where two
    // footprints meet at a point) makes one of them degenerate, and a triangle with no area
    // has no normal to write, so it is left out.
    this.#triangle([p0, p1, p2], [uv[0]!, uv[1]!, uv[2]!]);
    this.#triangle([p0, p2, p3], [uv[0]!, uv[2]!, uv[3]!]);
    return this;
  }

  #triangle(points: [Vec, Vec, Vec], uv: [[number, number], [number, number], [number, number]]): void {
    const normal = normalOf(points[0], points[1], points[2]);
    if (normal[0] === 0 && normal[1] === 0 && normal[2] === 0) return;

    const base = this.#positions.length / 3;
    for (let i = 0; i < 3; i++) {
      const point = points[i]!;
      this.#positions.push(point[0], point[1], point[2]);
      this.#normals.push(normal[0], normal[1], normal[2]);
      this.#uvs.push(uv[i]![0], uv[i]![1]);
    }
    this.#indices.push(base, base + 1, base + 2);
  }

  /** An axis aligned box, all six faces outward. */
  box(min: Vec, max: Vec): this {
    const [x0, y0, z0] = min;
    const [x1, y1, z1] = max;
    // south (+Z), north (-Z), east (+X), west (-X), top (+Y), bottom (-Y)
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    return this;
  }

  /** A horizontal slab face at height y, seen from above (+Y) or below (-Y). */
  cap(min: [number, number], max: [number, number], y: number, up: boolean): this {
    const [x0, z0] = min;
    const [x1, z1] = max;
    return up
      ? this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0])
      : this.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]);
  }

  data(): MeshData {
    return {
      material: this.material,
      positions: this.#positions,
      normals: this.#normals,
      uvs: this.#uvs,
      indices: this.#indices,
    };
  }
}

export function triangleCount(mesh: MeshData): number {
  return mesh.indices.length / 3;
}
