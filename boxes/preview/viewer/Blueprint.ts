/**
 * The placed scene drawn as a blueprint: one instanced panel per bay, a floor line per
 * floor, a labelled volume per band. Millimetres become metres here and nowhere else.
 */
import {
  BoxGeometry,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';
import type { Box, PlacedBand, PlacedBay, PlacedScene } from '#assemble';
import type { Side } from '#spec';

const MM = 0.001;

export const BAND_COLOUR: Record<string, number> = {
  main: 0xffd166,
  bulk: 0x4cc9f0,
  custom: 0xf72585,
  roof: 0x90be6d,
};

const FACE = 0xdbe7ff;
const SELECTED = 0xffb703;

const NORMALS: Record<Side, Vector3> = {
  N: new Vector3(0, 0, -1),
  S: new Vector3(0, 0, 1),
  E: new Vector3(1, 0, 0),
  W: new Vector3(-1, 0, 0),
};

export type BayHandle = {
  bay: PlacedBay;
  band: PlacedBand;
  floorId: string;
  /** Centre in world metres, after the band's rotation. */
  centre: Vector3;
  /** Outward normal in world space. */
  normal: Vector3;
  mesh: InstancedMesh;
  instance: number;
};

function boxCentreMetres(box: Box): Vector3 {
  return new Vector3(
    ((box.min[0] + box.max[0]) / 2) * MM,
    ((box.min[1] + box.max[1]) / 2) * MM,
    ((box.min[2] + box.max[2]) / 2) * MM,
  );
}

function boxSizeMetres(box: Box): Vector3 {
  return new Vector3((box.max[0] - box.min[0]) * MM, (box.max[1] - box.min[1]) * MM, (box.max[2] - box.min[2]) * MM);
}

function floorOutline(band: PlacedBand, positions: number[]): void {
  for (const floor of band.floors) {
    const bays = floor.bays;
    if (bays.length === 0) continue;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const bay of bays) {
      minX = Math.min(minX, bay.box.min[0]);
      maxX = Math.max(maxX, bay.box.max[0]);
      minZ = Math.min(minZ, bay.box.min[2]);
      maxZ = Math.max(maxZ, bay.box.max[2]);
    }
    const y = floor.y0 * MM;
    const corners: [number, number][] = [
      [minX * MM, minZ * MM],
      [maxX * MM, minZ * MM],
      [maxX * MM, maxZ * MM],
      [minX * MM, maxZ * MM],
    ];
    for (let i = 0; i < 4; i++) {
      const a = corners[i]!;
      const b = corners[(i + 1) % 4]!;
      positions.push(a[0], y, a[1], b[0], y, b[1]);
    }
  }
}

/** Builds the drawable objects and keeps the lookup from a picked instance back to a bay. */
export class Blueprint {
  readonly root = new Group();
  readonly meshes: InstancedMesh[] = [];
  readonly #lines: LineSegments[] = [];
  readonly #ofBand = new Map<string, { mesh: InstancedMesh; line: LineSegments }>();
  readonly handles: BayHandle[] = [];
  readonly #byMesh = new Map<InstancedMesh, BayHandle[]>();
  readonly scene: PlacedScene;
  #selected = new Set<string>();

  constructor(scene: PlacedScene) {
    this.scene = scene;
    for (const band of scene.bands) this.#band(band);
  }

  #band(band: PlacedBand): void {
    const group = new Group();
    group.rotation.y = (band.rotation * Math.PI) / 180;
    this.root.add(group);

    const bays = band.floors.flatMap((floor) => floor.bays.map((bay) => ({ bay, floorId: floor.id })));
    const material = new MeshBasicMaterial({ color: FACE, transparent: true, opacity: 0.14, depthWrite: false });
    const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), material, Math.max(1, bays.length));
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.count = bays.length;
    mesh.name = band.id;

    const dummy = new Object3D();
    const handles: BayHandle[] = [];
    bays.forEach(({ bay, floorId }, i) => {
      const centre = boxCentreMetres(bay.box);
      const size = boxSizeMetres(bay.box);
      dummy.position.copy(centre);
      dummy.scale.set(Math.max(size.x, 0.001), Math.max(size.y, 0.001), Math.max(size.z, 0.001));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new Color(FACE));

      const handle: BayHandle = {
        bay,
        band,
        floorId,
        centre: centre.clone().applyAxisAngle(new Vector3(0, 1, 0), group.rotation.y),
        normal: NORMALS[bay.side].clone().applyAxisAngle(new Vector3(0, 1, 0), group.rotation.y),
        mesh,
        instance: i,
      };
      handles.push(handle);
      this.handles.push(handle);
    });

    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    this.meshes.push(mesh);
    this.#byMesh.set(mesh, handles);

    const positions: number[] = [];
    floorOutline(band, positions);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const lines = new LineSegments(
      geometry,
      new LineBasicMaterial({ color: BAND_COLOUR[band.kind] ?? 0x8899bb, transparent: true, opacity: 0.75 }),
    );
    group.add(lines);
    this.#lines.push(lines);
    this.#ofBand.set(band.id, { mesh, line: lines });
  }

  handleAt(mesh: InstancedMesh, instance: number): BayHandle | undefined {
    return this.#byMesh.get(mesh)?.[instance];
  }

  /** Paint the given bay ids as selected and everything else plain. */
  select(bayIds: Iterable<string>): void {
    this.#selected = new Set(bayIds);
    const plain = new Color(FACE);
    const hot = new Color(SELECTED);
    for (const handle of this.handles) {
      handle.mesh.setColorAt(handle.instance, this.#selected.has(handle.bay.id) ? hot : plain);
    }
    for (const mesh of this.meshes) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  get selected(): string[] {
    return [...this.#selected];
  }

  /**
   * With the built model on screen, the blueprint's panels sit in the same place as its walls
   * and the two fight over depth. Showing only the outlines keeps the drawing readable and
   * leaves the surfaces to the model.
   */
  showPanels(show: boolean): void {
    for (const mesh of this.meshes) mesh.visible = show;
  }

  /**
   * Bring one section forward and push the rest back, so the name in the bar and the part of the
   * building it means are obviously the same thing. No id brings everything back to level.
   */
  focus(bandId: string | undefined): void {
    for (const [id, { mesh, line }] of this.#ofBand) {
      const lit = bandId === undefined || id === bandId;
      const faded = bandId !== undefined && id !== bandId;
      // Focus is depth, not selection: a section keeps its own colour and gains presence, so the
      // one accent on screen still means exactly one thing, the bays somebody picked.
      (mesh.material as MeshBasicMaterial).opacity = faded ? 0.03 : lit && bandId ? 0.3 : 0.14;
      (line.material as LineBasicMaterial).opacity = faded ? 0.12 : bandId === id ? 1 : 0.75;
      (line.material as LineBasicMaterial).color.set(BAND_COLOUR[this.#kindOf(id)] ?? 0x8899bb);
    }
  }

  #kindOf(bandId: string): string {
    return this.scene.bands.find((band) => band.id === bandId)?.kind ?? 'bulk';
  }

  /** The section outlines. Off is how the finished building is looked at, with nothing over it. */
  showOutlines(show: boolean): void {
    for (const line of this.#lines) line.visible = show;
  }

  /** Metres, for framing the camera. */
  get sizeMetres(): Vector3 {
    return new Vector3(this.scene.size.width * MM, this.scene.size.height * MM, this.scene.size.depth * MM);
  }

  dispose(): void {
    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      (mesh.material as MeshBasicMaterial).dispose();
    }
    this.root.clear();
  }
}
