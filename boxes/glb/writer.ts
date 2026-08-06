/**
 * Placed scene to GLB. Core glTF 2.0 only: metres, Y up, one UV set, PBR metallic roughness,
 * no extensions, so the same file opens in Unreal, Unity and three.js.
 *
 * One mesh per section, because a section is the design unit and owns its shape. Between two
 * sections the writer lofts the junction that closes them: a ledge where one steps in, a soffit
 * where one hangs out, a twisted collar where one turns. Nodes only translate up, so every
 * transform keeps a positive determinant and nothing is mirrored or scaled.
 */
import { Document, NodeIO, type Material, type Mesh } from '@gltf-transform/core';
import { assemble, type Corner, type PlacedBand, type PlacedScene } from '#assemble';
import { checkSupport, type Support } from '#check';
import { FACADE, GLASS, ROOF, WINDOW, dress, proudProblems, seedOf, shellProblems, template, triangleCount, type MeshData, type SectionShape } from '#kit';
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
  supports: Support[];
};

function metres(corners: Corner[]): [number, number][] {
  return corners.map(([x, z]) => [x * MM, z * MM]);
}

/** How far a section reaches down into the one below, so no two faces ever share a plane. */
const BITE = 0.01;

/** What a floor of each tier may cost. Past this the section is doing too much to be repeated. */
export const BUDGET: Record<string, number> = { flat: 120, light: 1200, full: 4000 };

/** A crown is one floor carrying a whole roof, so it is judged as a section, not per floor. */
export const ROOF_BUDGET = 4500;

function shapeOf(band: PlacedBand, sunk: number): SectionShape {
  return {
    bottom: metres(band.bottom),
    top: metres(band.top),
    height: (band.y1 - band.y0) * MM + sunk,
    floors: band.floors.length,
    chamfer: band.chamfer * MM,
    windows: band.windows ? WINDOW : undefined,
  };
}

/** The stack rules that have nothing to do with geometry. */
function checkEnds(placed: PlacedScene): void {
  const first = placed.bands[0]!;
  const last = placed.bands.at(-1)!;

  if (first.kind !== 'main') {
    throw new BuildingError('E_SEAM_MISMATCH', `the bottom section ${first.id} is ${first.kind}; a building needs a main section at the bottom to carry its underside`, ['bands', first.id]);
  }
  if (last.kind !== 'roof') {
    throw new BuildingError('E_SEAM_MISMATCH', `the top section ${last.id} is ${last.kind}; a building needs a roof section on top to carry its deck`, ['bands', last.id]);
  }
}

function palette(document: Document): Map<string, Material> {
  const facade = document
    .createMaterial(FACADE)
    .setBaseColorFactor([0.62, 0.63, 0.65, 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(0.85);
  document
    .createMaterial(GLASS)
    .setBaseColorFactor([0.09, 0.11, 0.14, 1])
    .setMetallicFactor(0.1)
    .setRoughnessFactor(0.15);
  const roof = document
    .createMaterial(ROOF)
    .setBaseColorFactor([0.28, 0.29, 0.31, 1])
    .setMetallicFactor(0)
    .setRoughnessFactor(0.95);
  const glass = document.getRoot().listMaterials().find((material) => material.getName() === GLASS)!;
  return new Map([
    [FACADE, facade],
    [ROOF, roof],
    [GLASS, glass],
  ]);
}

function meshOf(document: Document, name: string, parts: MeshData[], materials: Map<string, Material>): Mesh {
  const buffer = document.getRoot().listBuffers()[0]!;
  const mesh = document.createMesh(name);

  for (const part of parts) {
    const floats = (suffix: string, type: 'VEC3' | 'VEC2', values: number[]) =>
      document.createAccessor(`${name}_${part.material}_${suffix}`).setType(type).setArray(new Float32Array(values)).setBuffer(buffer);
    const indices = () =>
      document.createAccessor(`${name}_${part.material}_I`).setType('SCALAR').setArray(new Uint32Array(part.indices)).setBuffer(buffer);

    const material = materials.get(part.material);
    if (!material) throw new BuildingError('E_GLB_INVALID', `no material named ${part.material}`, [name]);

    mesh.addPrimitive(
      document
        .createPrimitive()
        .setAttribute('POSITION', floats('P', 'VEC3', part.positions))
        .setAttribute('NORMAL', floats('N', 'VEC3', part.normals))
        .setAttribute('TEXCOORD_0', floats('T', 'VEC2', part.uvs))
        .setIndices(indices())
        .setMaterial(material),
    );
  }
  return mesh;
}

export async function buildGlb(doc: BuildingDocument): Promise<BuildResult> {
  const placed = assemble(doc);
  checkEnds(placed);
  const supports = checkSupport(placed);

  const document = new Document();
  document.createBuffer();
  document.getRoot().getAsset().generator = 'glb-buildings';

  const materials = palette(document);
  const scene = document.createScene(doc.name);
  const shell: MeshData[] = [];

  let triangles = 0;
  let nodes = 0;

  placed.bands.forEach((band, index) => {
    const sunk = index === 0 ? 0 : BITE;
    const above = placed.bands[index + 1];
    const shape = shapeOf(band, sunk);
    const parts = template(band.template).build(shape);
    parts.push(
      ...dress(shape, {
        wires: band.wires,
        balconies: band.balconies,
        columns: band.columns,
        greebles: band.greebles,
        clutter: band.clutter,
        deck: band.deck,
        covered: above ? metres(above.bottom) : undefined,
        seed: seedOf(`${doc.name}/${band.id}`),
      }),
    );

    // Every section is closed on its own. Proving them one at a time is what keeps a stack of
    // stepped, slid and turned masses honest, without welding them into one surface.
    const open = shellProblems(parts);
    if (open.length > 0) {
      throw new BuildingError('E_GLB_INVALID', `section ${band.id} is not closed: ${open[0]!.detail} at ${open[0]!.at}`, ['bands', band.id]);
    }

    const xs = shape.bottom.concat(shape.top).map(([x]) => x);
    const zs = shape.bottom.concat(shape.top).map(([, z]) => z);
    // A tier is a promise about cost: a flat section stays flat, and a full one stays affordable.
    const total = parts.reduce((sum, part) => sum + triangleCount(part), 0);
    if (band.kind === 'roof') {
      if (total > ROOF_BUDGET) {
        throw new BuildingError(
          'E_BUDGET',
          `the roof ${band.id} costs ${total} triangles and may spend ${ROOF_BUDGET}. Take parts off the deck, or turn the clutter down`,
          ['bands', band.id, 'clutter'],
        );
      }
    } else {
      const perFloor = total / Math.max(1, band.floors.length);
      const allowed = BUDGET[band.tier] ?? BUDGET.full!;
      if (perFloor > allowed) {
        throw new BuildingError(
          'E_BUDGET',
          `section ${band.id} costs ${Math.round(perFloor)} triangles a floor, and a ${band.tier} section may spend ${allowed}. ` +
            'Drop the greebles, the windows or the columns, or move it to a richer tier',
          ['bands', band.id, 'tier'],
        );
      }
    }

    const adrift = proudProblems(parts, { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), height: shape.height });
    if (adrift.length > 0) {
      throw new BuildingError('E_FLOATING_PART', `section ${band.id}: ${adrift[0]!.detail}`, ['bands', band.id]);
    }

    const y = band.y0 * MM - sunk;
    const mesh = meshOf(document, band.id, parts, materials);
    scene.addChild(document.createNode(band.id).setTranslation([0, y, 0]).setMesh(mesh));
    nodes += 1;
    triangles += parts.reduce((sum, part) => sum + triangleCount(part), 0);
    shell.push(...parts);
  });

  const glb = await new NodeIO().writeBinary(document);

  return {
    glb,
    scene: placed,
    supports,
    stats: {
      meshes: document.getRoot().listMeshes().length,
      nodes,
      triangles,
      materials: document.getRoot().listMaterials().length,
      bytes: glb.byteLength,
    },
  };
}


