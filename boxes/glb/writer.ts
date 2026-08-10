/**
 * Placed scene to GLB. Core glTF 2.0 only: metres, Y up, one UV set, PBR metallic roughness,
 * no extensions, so the same file opens in Unreal, Unity and three.js.
 *
 * One mesh per section, because a section is the design unit and owns its shape. Between two
 * sections the writer lofts the junction that closes them: a ledge where one steps in, a soffit
 * where one hangs out, a twisted collar where one turns. Nodes only translate up, so every
 * transform keeps a positive determinant and nothing is mirrored or scaled.
 */
import { Document, NodeIO, type Material, type Mesh, type Texture } from '@gltf-transform/core';
import { assemble, type Corner, type PlacedBand, type PlacedScene } from '#assemble';
import { checkSupport, type Support } from '#check';
import { dressFaces, type Element, type FacePlan } from '#facade';
import {
  NEON,
  WINDOW,
  Surface,
  Surfaces,
  dress,
  edgeFacing,
  proudProblems,
  seedOf,
  segment,
  shellProblems,
  sunkProblems,
  template,
  triangleCount,
  windingProblems,
  type LineSpec,
  type MeshData,
  type ScreenStyle,
  type SectionShape,
  type Vec,
} from '#kit';
import { finish, loadImage, loadPack, type Bitmap, type Look, type Mode, type Size } from '#materials';
import { BuildingError, type BandRun, type BuildingDocument } from '#spec';

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

export type BuildOptions = {
  /** Where the generated image packs live, one folder per style. Absent means the drawn tiles. */
  packs?: string;
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

function shapeOf(band: PlacedBand, sunk: number, storey: number): SectionShape {
  return {
    bottom: metres(band.bottom),
    top: metres(band.top),
    height: (band.y1 - band.y0) * MM + sunk,
    floors: band.floors.length,
    chamfer: band.chamfer * MM,
    windows: band.windows ? WINDOW : undefined,
    storey,
  };
}

/** The document's faces, as the facade box reads them: millimetres become metres, cells stay. */
function facePlans(band: PlacedBand): FacePlan[] {
  return band.faces.map((face) => ({
    side: face.side,
    // What the kit already built on this face, so nothing is composed through an upright.
    wears: { columns: band.columns, wires: band.wires },
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
  const kit = new Surfaces();

  for (const run of runs) {
    const points = run.points.map(([x, up, z]): Vec => [x * MM, up * MM - y, z * MM]);
    segment(kit.get(run.material), points, { profile: run.profile, thickness: run.thickness * MM });
  }

  return kit.data();
}

/** Whether a section carries real detail: anything composed, cut, run or lit on it. */
export function detailed(band: Pick<PlacedBand, 'windows' | 'faces' | 'runs' | 'lines' | 'screens'>): boolean {
  return (
    band.windows ||
    band.faces.some((face) => face.elements.length > 0) ||
    band.runs.length > 0 ||
    band.lines.length > 0 ||
    band.screens.length > 0
  );
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
 *
 * What each one looks like comes from the finish library: in `textured` mode it carries a picture,
 * in `plain` mode it is a named flat colour and the file holds no images at all. Two materials
 * over one picture (the wall and its glass) point at one texture rather than two copies of it.
 */
function palette(document: Document, look: Look, screens: Map<string, (Bitmap & { size?: Size }) | undefined>): (name: string) => Material {
  const made = new Map<string, Material>();
  const drawn = new Map<string, Texture>();

  const textureOf = (key: string, bitmap: Bitmap): Texture => {
    const already = drawn.get(key);
    if (already) return already;
    const texture = document.createTexture(key).setImage(bitmap.bytes).setMimeType(bitmap.mime);
    drawn.set(key, texture);
    return texture;
  };

  return (name: string): Material => {
    const already = made.get(name);
    if (already) return already;

    // A screen is the screen finish under its own name, carrying its own picture when it was
    // given one and the generated screen when it was not.
    const shown = screens.get(name);
    const recipe = finish(screens.has(name) ? 'screen' : name, look);
    if (!recipe) throw new BuildingError('E_GLB_INVALID', `no material named ${name}`, [name]);

    const material = document
      .createMaterial(name)
      .setBaseColorFactor([...recipe.colour, 1])
      .setMetallicFactor(recipe.metallic)
      .setRoughnessFactor(recipe.roughness);

    const image = shown ? { key: name, load: () => ({ colour: shown, emissive: shown }) } : recipe.image;
    if (image) {
      const maps = image.load();
      material.setBaseColorFactor([1, 1, 1, 1]).setBaseColorTexture(textureOf(`${image.key}-colour`, maps.colour));

      // A neon tube, a screen and a beacon are the light, so their own picture is what glows when
      // no separate one was supplied. A wall glows only where its emissive map says a window is
      // lit, so without that map it does not glow at all: a factor on its own would light the
      // whole surface, which is a building shining like a lamp.
      const glow = maps.emissive ?? (recipe.lit ? maps.colour : undefined);
      if (glow) {
        // A supplied picture lights itself; a drawn one is tinted by the finish's own colour.
        material.setEmissiveFactor(shown ? [1, 1, 1] : (recipe.emissive ?? [1, 1, 1]));
        // A surface lit by its own picture points both slots at one texture, not two copies.
        material.setEmissiveTexture(textureOf(glow === maps.colour ? `${image.key}-colour` : `${image.key}-emissive`, glow));
      }
    } else if (recipe.lit && recipe.emissive) {
      // Plain mode: a line still glows, because a flat colour is all a line ever was.
      material.setEmissiveFactor(recipe.emissive);
    }

    made.set(name, material);
    return material;
  };
}

/** The material a screen is drawn in: one per screen, so each carries its own picture. */
function screenMaterial(bandId: string, index: number): string {
  return `screen-${bandId}-${index + 1}`;
}

/**
 * Every screen in the building, with the picture it was given. One entry per screen even when it
 * carries none, since that is what makes it its own material. A path that is not there stops the
 * build with the screen named, rather than writing a file with a blank panel in it.
 */
async function screenPictures(doc: BuildingDocument): Promise<Map<string, (Bitmap & { size?: Size }) | undefined>> {
  const found = new Map<string, (Bitmap & { size?: Size }) | undefined>();

  for (const band of doc.bands) {
    for (const [index, screen] of band.screens.entries()) {
      const material = screenMaterial(band.id, index);
      if (screen.image === '') {
        found.set(material, undefined);
        continue;
      }
      try {
        found.set(material, await loadImage(screen.image));
      } catch (error) {
        throw new BuildingError(
          'E_DOC_INVALID',
          `screen ${index + 1} on ${band.id} carries ${screen.image}, which cannot be read: ${(error as Error).message}`,
          ['bands', band.id, 'screens'],
        );
      }
    }
  }
  return found;
}

/** How wide one face of a section is, in metres, so a line placed along it lands where it was put. */
function faceWidth(shape: SectionShape, side: 'N' | 'E' | 'S' | 'W'): number {
  const ring = shape.bottom;
  const edge = edgeFacing(ring, side);
  const a = ring[edge]!;
  const b = ring[(edge + 1) % ring.length]!;
  return Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
}

/** The lit runs climbing this section's faces, in the kit's own terms. */
function linesOf(band: PlacedBand, shape: SectionShape): LineSpec[] {
  return band.lines.map((line) => ({
    side: line.side,
    along: Math.max(0, Math.min(1, (line.along * MM) / faceWidth(shape, line.side))),
    from: line.from,
    to: line.to,
    thickness: line.thickness * MM,
    material: `${line.material}:${line.colour}`,
  }));
}

/** The panels standing off this section's faces. */
function screensOf(band: PlacedBand, shape: SectionShape, pictures: Map<string, (Bitmap & { size?: Size }) | undefined>): ScreenStyle[] {
  return band.screens.map((screen, index) => {
    const width = faceWidth(shape, screen.side);
    const size = pictures.get(screenMaterial(band.id, index))?.size;
    return {
      side: screen.side,
      along: Math.max(0, Math.min(1, (screen.along * MM) / width)),
      wide: Math.max(0.02, Math.min(1, (screen.width * MM) / width)),
      from: screen.from,
      to: screen.to,
      stand: screen.stand * MM,
      material: screenMaterial(band.id, index),
      ...(size ? { aspect: size.width / size.height } : {}),
    };
  });
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

export async function buildGlb(doc: BuildingDocument, options: BuildOptions = {}): Promise<BuildResult> {
  const placed = assemble(doc);
  checkEnds(placed);
  const supports = checkSupport(placed);

  const document = new Document();
  document.createBuffer();
  document.getRoot().getAsset().generator = 'glb-buildings';

  const mode: Mode = doc.textures ? 'textured' : 'plain';
  // A pack only matters when the file is going to carry pictures at all.
  const pack = mode === 'textured' && options.packs ? await loadPack(options.packs, doc.style) : undefined;
  const look: Look = { mode, style: doc.style, seed: seedOf(doc.name), ...(pack ? { pack } : {}) };

  const pictures = await screenPictures(doc);
  const materials = palette(document, look, pictures);
  const scene = document.createScene(doc.name);

  let triangles = 0;
  let nodes = 0;

  placed.bands.forEach((band, index) => {
    const sunk = index === 0 ? 0 : BITE;
    const above = placed.bands[index + 1];
    // The building's own floor height is the storey the wall tile was drawn for, so a taller
    // floor shows more of the tile rather than stretching one row of it over a lobby.
    const shape = shapeOf(band, sunk, doc.grid.floorHeight * MM);
    const parts = template(band.template).build(shape);
    const worn = dress(shape, {
      wires: band.wires,
      columns: band.columns,
      // Greebles are what a section wears when it wears nothing else: scattered panel noise
      // that stops a bare box reading as a box. On a section that carries real detail they
      // only fight it, so a face with anything composed on it, a window or a run turns them off.
      greebles: detailed(band) ? 0 : band.greebles,
      clutter: band.clutter,
      deck: band.deck,
      covered: above ? metres(above.bottom) : undefined,
      seed: seedOf(`${doc.name}/${band.id}`),
      lines: linesOf(band, shape),
      screens: screensOf(band, shape, pictures),
      ...(band.crown === '' ? {} : { crown: { material: `${NEON}:${band.crown}`, thickness: 0.16 } }),
    });
    // Composed faces and runs stand on the section the same way the dressing does, and are
    // held to the same proofs: seen from outside, not drifted off, inside the tier's budget.
    worn.push(...dressFaces(shape, facePlans(band)));
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
            'Take elements off its faces, drop the windows, the columns or the greebles, use fewer segments on a round plan, or move it to a richer tier',
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


