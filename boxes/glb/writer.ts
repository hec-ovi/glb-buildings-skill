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
import { dressFaces, type Element, type FacePlan } from '#facade';
import { FACADE, GLASS, ROOF, WINDOW, Surface, dress, proudProblems, seedOf, segment, shellProblems, sunkProblems, template, triangleCount, windingProblems, type MeshData, type SectionShape, type Vec } from '#kit';
import { facadeTexture } from '#materials';
import { BuildingError, type BandFace, type BandRun, type BuildingDocument } from '#spec';

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

/** The document's faces, as the facade box reads them: millimetres become metres, cells stay. */
function facePlans(faces: BandFace[]): FacePlan[] {
  return faces.map((face) => ({
    side: face.side,
    elements: face.elements.map(
      (element): Element => ({
        kind: element.kind,
        rect: { col: element.col, row: element.row, cols: element.cols, rows: element.rows },
        material: element.material,
        ...(element.depth === undefined ? {} : { depth: element.depth * MM }),
      }),
    ),
  }));
}

/** Runs standing off a section: written in the building's own frame, drawn where they are. */
function runsOf(runs: BandRun[], y: number): MeshData[] {
  const surfaces = new Map<string, Surface>();

  for (const run of runs) {
    const surface = surfaces.get(run.material) ?? new Surface(run.material);
    surfaces.set(run.material, surface);
    const points = run.points.map(([x, up, z]): Vec => [x * MM, up * MM - y, z * MM]);
    segment(surface, points, { profile: run.profile, thickness: run.thickness * MM });
  }

  return [...surfaces.values()].filter((surface) => !surface.empty).map((surface) => surface.data());
}

/** The stack rules that have nothing to do with geometry. */
function checkEnds(placed: PlacedScene): void {
  const first = placed.bands[0]!;
  const last = placed.bands.at(-1)!;

  if (first.kind !== 'main') {
    throw new BuildingError('E_STACK_ENDS', `the bottom section ${first.id} is ${first.kind}; a building needs a main section at the bottom to carry its underside`, ['bands', first.id]);
  }
  if (last.kind !== 'roof') {
    throw new BuildingError('E_STACK_ENDS', `the top section ${last.id} is ${last.kind}; a building needs a roof section on top to carry its deck`, ['bands', last.id]);
  }
}

/**
 * The materials, made on demand. A file carries only what its parts actually use, so a plain
 * tower is two materials and a composed facade is as many as it asked for.
 */
function palette(document: Document, seed: number): (name: string) => Material {
  const made = new Map<string, Material>();
  const build = makers(document, seed);

  return (name: string): Material => {
    const already = made.get(name);
    if (already) return already;

    const maker = build[name];
    if (!maker) throw new BuildingError('E_GLB_INVALID', `no material named ${name}`, [name]);
    const material = maker();
    made.set(name, material);
    return material;
  };
}

function makers(document: Document, seed: number): Record<string, () => Material> {
  // The facade carries its windows in the texture: one tile is a floor tall and a bay wide, and
  // the same grid glows, so a flat section reads as a lit building for eight triangles a floor.
  // Made once, on the first material that wants it, and shared by the glazing.
  let skin: { colour: Uint8Array; emissive: Uint8Array } | undefined;
  const drawn = () => {
    if (!skin) skin = facadeTexture({ seed });
    return {
      colour: document.createTexture('facade-colour').setImage(skin.colour).setMimeType('image/png'),
      glow: document.createTexture('facade-emissive').setImage(skin.emissive).setMimeType('image/png'),
    };
  };

  // Glass is the same picture with a sheen on it: a pane covers the window it is built over, so
  // the building never carries two window systems that disagree. Crystal is that glass, by the
  // name a composed face calls it.
  const glazing = (name: string) => () => {
    const { colour, glow } = drawn();
    return document
      .createMaterial(name)
      .setBaseColorFactor([1, 1, 1, 1])
      .setBaseColorTexture(colour)
      .setEmissiveFactor([1, 1, 1])
      .setEmissiveTexture(glow)
      .setMetallicFactor(0.25)
      .setRoughnessFactor(0.12);
  };

  const plain = (name: string, colour: [number, number, number], metallic: number, rough: number) => () =>
    document
      .createMaterial(name)
      .setBaseColorFactor([...colour, 1])
      .setMetallicFactor(metallic)
      .setRoughnessFactor(rough);

  return {
    [FACADE]: () => {
      const { colour, glow } = drawn();
      return document
        .createMaterial(FACADE)
        .setBaseColorFactor([1, 1, 1, 1])
        .setBaseColorTexture(colour)
        .setEmissiveFactor([1, 1, 1])
        .setEmissiveTexture(glow)
        .setMetallicFactor(0)
        .setRoughnessFactor(0.85);
    },
    [GLASS]: glazing(GLASS),
    crystal: glazing('crystal'),
    [ROOF]: plain(ROOF, [0.24, 0.25, 0.27], 0, 0.95),
    concrete: plain('concrete', [0.3, 0.3, 0.31], 0, 0.9),
    metal: plain('metal', [0.42, 0.44, 0.47], 0.6, 0.45),
    screen: () =>
      document
        .createMaterial('screen')
        .setBaseColorFactor([0.06, 0.07, 0.1, 1])
        .setEmissiveFactor([0.9, 0.35, 0.7])
        .setMetallicFactor(0)
        .setRoughnessFactor(0.35),
  };
}

function meshOf(document: Document, name: string, parts: MeshData[], material: (name: string) => Material): Mesh {
  const buffer = document.getRoot().listBuffers()[0]!;
  const mesh = document.createMesh(name);

  for (const part of parts) {
    const floats = (suffix: string, type: 'VEC3' | 'VEC2', values: number[]) =>
      document.createAccessor(`${name}_${part.material}_${suffix}`).setType(type).setArray(new Float32Array(values)).setBuffer(buffer);
    const indices = () =>
      document.createAccessor(`${name}_${part.material}_I`).setType('SCALAR').setArray(new Uint32Array(part.indices)).setBuffer(buffer);

    mesh.addPrimitive(
      document
        .createPrimitive()
        .setAttribute('POSITION', floats('P', 'VEC3', part.positions))
        .setAttribute('NORMAL', floats('N', 'VEC3', part.normals))
        .setAttribute('TEXCOORD_0', floats('T', 'VEC2', part.uvs))
        .setIndices(indices())
        .setMaterial(material(part.material)),
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

  const materials = palette(document, seedOf(doc.name));
  const scene = document.createScene(doc.name);

  let triangles = 0;
  let nodes = 0;

  placed.bands.forEach((band, index) => {
    const sunk = index === 0 ? 0 : BITE;
    const above = placed.bands[index + 1];
    const shape = shapeOf(band, sunk);
    const parts = template(band.template).build(shape);
    const worn = dress(shape, {
      wires: band.wires,
      balconies: band.balconies,
      columns: band.columns,
      greebles: band.greebles,
      clutter: band.clutter,
      deck: band.deck,
      covered: above ? metres(above.bottom) : undefined,
      seed: seedOf(`${doc.name}/${band.id}`),
    });
    // Composed faces and runs stand on the section the same way the dressing does, and are
    // held to the same proofs: seen from outside, not drifted off, inside the tier's budget.
    worn.push(...dressFaces(shape, facePlans(band.faces)));
    worn.push(...runsOf(band.runs, band.y0 * MM - sunk));
    parts.push(...worn);

    // A stored normal that disagrees with its triangle lights the surface the wrong way round,
    // and no validator reads normals, so every part is measured against its own winding here.
    for (const part of parts) {
      const facing = windingProblems(part);
      if (facing.length > 0) {
        throw new BuildingError('E_GLB_INVALID', `section ${band.id}: ${facing[0]!.detail}, at ${facing[0]!.at}`, ['bands', band.id]);
      }
    }

    // Every section is closed on its own. Proving them one at a time is what keeps a stack of
    // stepped, slid and turned masses honest, without welding them into one surface.
    const open = shellProblems(parts);
    if (open.length > 0) {
      throw new BuildingError('E_GLB_INVALID', `section ${band.id} is not closed: ${open[0]!.detail} at ${open[0]!.at}`, ['bands', band.id]);
    }

    // And everything the section wears has to be seen from outside it.
    const buried = sunkProblems(worn, shape);
    if (buried.length > 0) {
      throw new BuildingError('E_OVERLAP', `section ${band.id}: ${buried[0]!.detail}, at ${buried[0]!.at}`, ['bands', band.id]);
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
    triangles += total;
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


