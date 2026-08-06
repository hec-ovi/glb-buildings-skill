/**
 * Placed scene to GLB. Core glTF 2.0 only: metres, Y up, one UV set, PBR metallic roughness,
 * no extensions, so the same file opens in Unreal, Unity and three.js.
 *
 * A band's floors are identical, so its mesh is written once and one node per floor points at
 * it. Nodes carry translation and, where a band is turned, a rotation. Nothing is scaled and
 * nothing is mirrored, so every node transform keeps a positive determinant.
 */
import { Document, NodeIO, type Material, type Mesh } from '@gltf-transform/core';
import { assemble, type PlacedBand, type PlacedScene } from '#assemble';
import { FACADE, ROOF, shellProblems, template, triangleCount, type MeshData } from '#kit';
import { BuildingError, type BuildingDocument } from '#spec';

const MM = 0.001;

export type BuildStats = {
  meshes: number;
  nodes: number;
  triangles: number;
  materials: number;
  bytes: number;
};

export type BuildResult = {
  glb: Uint8Array;
  stats: BuildStats;
  scene: PlacedScene;
};

function bandShape(band: PlacedBand) {
  const bay = band.floors[0]?.bays[0];
  if (!bay) throw new BuildingError('E_BAND_EMPTY', `band ${band.id} has no floors`, ['bands', band.id]);

  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const b of band.floors[0]!.bays) {
    x0 = Math.min(x0, b.box.min[0]);
    x1 = Math.max(x1, b.box.max[0]);
    z0 = Math.min(z0, b.box.min[2]);
    z1 = Math.max(z1, b.box.max[2]);
  }
  const floor = band.floors[0]!;
  return { x0: x0 * MM, x1: x1 * MM, z0: z0 * MM, z1: z1 * MM, height: (floor.y1 - floor.y0) * MM };
}

function palette(document: Document): Map<string, Material> {
  const facade = document
    .createMaterial(FACADE)
    .setBaseColorFactor([0.62, 0.63, 0.65, 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(0.85);
  const roof = document
    .createMaterial(ROOF)
    .setBaseColorFactor([0.28, 0.29, 0.31, 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(0.95);
  return new Map([
    [FACADE, facade],
    [ROOF, roof],
  ]);
}

function meshOf(document: Document, name: string, parts: MeshData[], materials: Map<string, Material>): Mesh {
  const buffer = document.getRoot().listBuffers()[0]!;
  const mesh = document.createMesh(name);

  for (const part of parts) {
    const position = document
      .createAccessor(`${name}_${part.material}_P`)
      .setType('VEC3')
      .setArray(new Float32Array(part.positions))
      .setBuffer(buffer);
    const normal = document
      .createAccessor(`${name}_${part.material}_N`)
      .setType('VEC3')
      .setArray(new Float32Array(part.normals))
      .setBuffer(buffer);
    const uv = document
      .createAccessor(`${name}_${part.material}_T`)
      .setType('VEC2')
      .setArray(new Float32Array(part.uvs))
      .setBuffer(buffer);
    const indices = document
      .createAccessor(`${name}_${part.material}_I`)
      .setType('SCALAR')
      .setArray(new Uint32Array(part.indices))
      .setBuffer(buffer);

    const material = materials.get(part.material);
    if (!material) throw new BuildingError('E_GLB_INVALID', `no material named ${part.material}`, [name]);

    mesh.addPrimitive(
      document
        .createPrimitive()
        .setAttribute('POSITION', position)
        .setAttribute('NORMAL', normal)
        .setAttribute('TEXCOORD_0', uv)
        .setIndices(indices)
        .setMaterial(material),
    );
  }
  return mesh;
}

/** Turn about Y as a quaternion, so a turned band still has a positive determinant. */
function yaw(degrees: number): [number, number, number, number] {
  const half = (degrees * Math.PI) / 360;
  return [0, Math.sin(half), 0, Math.cos(half)];
}

export async function buildGlb(doc: BuildingDocument): Promise<BuildResult> {
  const placed = assemble(doc);
  const document = new Document();
  document.createBuffer();
  document.getRoot().getAsset().generator = 'glb-buildings';

  const materials = palette(document);
  const scene = document.createScene(doc.name);
  const allParts: MeshData[] = [];
  let triangles = 0;
  let nodes = 0;

  for (const band of placed.bands) {
    const shape = bandShape(band);
    const parts = template(band.template).build(shape);
    const mesh = meshOf(document, `${doc.name}_${band.id}`, parts, materials);
    const perFloor = parts.reduce((sum, part) => sum + triangleCount(part), 0);

    for (const floor of band.floors) {
      const node = document
        .createNode(floor.id)
        .setTranslation([0, floor.y0 * MM, 0])
        .setMesh(mesh);
      if (band.rotation !== 0) node.setRotation(yaw(band.rotation));
      scene.addChild(node);
      nodes += 1;
      triangles += perFloor;

      // The shell proof needs the parts where they actually sit.
      allParts.push(...parts.map((part) => place(part, floor.y0 * MM, band.rotation)));
    }
  }

  const open = shellProblems(allParts);
  if (open.length > 0) {
    throw new BuildingError('E_GLB_INVALID', `the building is not a closed shell: ${open[0]!.detail} at ${open[0]!.at}`, [doc.name]);
  }

  const glb = await new NodeIO().writeBinary(document);

  return {
    glb,
    scene: placed,
    stats: {
      meshes: document.getRoot().listMeshes().length,
      nodes,
      triangles,
      materials: document.getRoot().listMaterials().length,
      bytes: glb.byteLength,
    },
  };
}

/** The same triangles where the node puts them: turned about Y, then lifted. */
function place(part: MeshData, y: number, rotation: number): MeshData {
  const positions = part.positions.slice();
  const normals = part.normals.slice();
  const angle = (rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const z = positions[i + 2]!;
    positions[i] = x * cos + z * sin;
    positions[i + 2] = -x * sin + z * cos;
    positions[i + 1] = positions[i + 1]! + y;

    const nx = normals[i]!;
    const nz = normals[i + 2]!;
    normals[i] = nx * cos + nz * sin;
    normals[i + 2] = -nx * sin + nz * cos;
  }
  return { ...part, positions, normals };
}
