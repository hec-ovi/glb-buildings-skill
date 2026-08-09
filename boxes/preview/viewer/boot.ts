/**
 * Starting the viewer. Both panels are built before anything touches WebGL, and every failure
 * is written into the bar, so a browser without a context, or a document that does not parse,
 * shows a sentence instead of a blank page.
 */
import {
  AmbientLight,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  HemisphereLight,
  MOUSE,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Bar } from './Bar.ts';
import { Blueprint } from './Blueprint.ts';
import { Fly } from './Fly.ts';
import { Models } from './Models.ts';
import { Picker } from './Picker.ts';
import { fetchProjects, fetchScene, onChange, postSelection, useProject } from './api.ts';

export type BootOptions = {
  stage: HTMLElement;
  /** The navigator down the side, and the building's own bar along the bottom. */
  side: HTMLElement;
  bar: HTMLElement;
  /** Swapped in tests to stand in for a browser that cannot give a WebGL context. */
  createRenderer?: () => WebGLRenderer;
};

const EMPTY_SCENE = { name: '', size: { width: 0, depth: 0, height: 0 }, bands: [] };

export function boot(options: BootOptions): { bar: Bar; models: Models; ready: Promise<void> } {
  const { stage } = options;
  let picker: Picker | undefined;
  let show3d: ((show: boolean) => void) | undefined;

  const bar = new Bar(options.bar, {
    onMode: (mode) => picker?.setMode(mode),
    onModel: (show) => show3d?.(show),
  });

  // Opening another building shows it whole, rather than through the camera the last one left.
  let reframe = false;
  const models = new Models(options.side, {
    onProject: (name) => {
      reframe = true;
      void useProject(name).then(() => listBuildings());
    },
  });

  const listBuildings = async () => {
    const { projects, current } = await fetchProjects();
    models.show(projects, current);
  };

  const ready = (async () => {
    let renderer: WebGLRenderer;
    try {
      renderer = (options.createRenderer ?? (() => new WebGLRenderer({ antialias: true })))();
    } catch (error) {
      bar.fail(`this browser gave no WebGL context: ${(error as Error).message}`);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.background = new Color(0x0b1020);
    // Evening light: enough sun to model the massing, little enough fill that a dark facade
    // stays dark and its lit windows are the brightest thing on it.
    scene.add(new AmbientLight(0xffffff, 0.22));
    scene.add(new HemisphereLight(0x35507e, 0x090d18, 0.7));
    const sun = new DirectionalLight(0xffe9cf, 1.15);
    sun.position.set(30, 60, 40);
    scene.add(sun);

    const ground = new GridHelper(200, 200, 0x2a3b63, 0x16223c);
    scene.add(ground);

    const modelRoot = new Group();
    modelRoot.visible = false;
    scene.add(modelRoot);

    const camera = new PerspectiveCamera(45, 1, 0.1, 5000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // Hold left to slide the building around, hold right to swing around it.
    controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE };

    // Panning moves what the camera orbits, so after a pan the building swings around a point
    // out in the air. The middle of the building is put back the moment a turn begins.
    const middle = new Vector3();
    let turning = false;
    renderer.domElement.addEventListener('pointerdown', (event: PointerEvent) => {
      turning = event.pointerType === 'mouse' ? event.button === 2 : true;
    });
    controls.addEventListener('start', () => {
      if (!turning) return;
      controls.target.copy(middle);
      controls.update();
    });

    const fly = new Fly(camera, controls.target, () => controls.update());
    fly.listen(window);

    let blueprint: Blueprint | undefined;
    let picked: { bayIds: string[]; bandIds: string[]; floorIds: string[] } = { bayIds: [], bandIds: [], floorIds: [] };

    picker = new Picker(
      stage,
      camera,
      new Blueprint(EMPTY_SCENE),
      (selection) => {
        picked = { bayIds: selection.bayIds, bandIds: selection.bandIds, floorIds: selection.floorIds };
        bar.showSelection(selection.bayIds, selection.bandIds, selection.floorIds);
        void postSelection(selection);
      },
      (enabled) => {
        controls.enabled = enabled;
      },
    );

    const loadModel = async () => {
      try {
        const gltf = await new GLTFLoader().loadAsync('/api/model.glb');
        modelRoot.clear();
        modelRoot.add(gltf.scene);
      } catch {
        modelRoot.clear();
        bar.fail('no build yet, run the build verb first');
      }
    };

    show3d = (show) => {
      modelRoot.visible = show;
      blueprint?.showPanels(!show);
      if (show && modelRoot.children.length === 0) void loadModel();
    };

    const frame = (size: Vector3) => {
      const reach = Math.max(size.x, size.z, size.y) * 1.6 + 10;
      camera.position.set(size.x * 0.9 + reach * 0.4, size.y * 0.75 + reach * 0.25, size.z * 0.9 + reach * 0.6);
      controls.target.copy(middle);
      controls.update();
      ground.scale.setScalar(Math.max(1, reach / 100));
    };

    const resize = () => {
      const width = stage.clientWidth || window.innerWidth;
      const height = stage.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
    };

    const load = async (keepCamera = false) => {
      const payload = await fetchScene();
      if (blueprint) {
        scene.remove(blueprint.root);
        blueprint.dispose();
      }
      blueprint = new Blueprint(payload.scene);
      scene.add(blueprint.root);
      picker!.retarget(blueprint);
      bar.describe(payload.document, payload.scene, payload.hasModel);

      // Keep the highlight after a rebuild, minus any bay the new document no longer has.
      const alive = new Set(blueprint.handles.map((handle) => handle.bay.id));
      const floors = new Set(blueprint.handles.map((handle) => handle.floorId));
      picked = {
        bayIds: picked.bayIds.filter((id) => alive.has(id)),
        bandIds: picked.bandIds,
        floorIds: picked.floorIds.filter((id) => floors.has(id)),
      };
      blueprint.select(picked.bayIds);
      blueprint.showPanels(!modelRoot.visible);
      bar.showSelection(picked.bayIds, picked.bandIds, picked.floorIds);

      void listBuildings();
      middle.set(0, blueprint.sizeMetres.y / 2, 0);
      if (!keepCamera || reframe) frame(blueprint.sizeMetres);
      reframe = false;

      // The model on screen belongs to the building that was on screen. Load the new one now if
      // it is showing, and drop it if it is not, so turning the model back on never shows the
      // building before last.
      if (modelRoot.visible) await loadModel();
      else modelRoot.clear();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('error', (event) => bar.fail(event.message));
    resize();

    let last = performance.now();
    renderer.setAnimationLoop((now: number) => {
      const seconds = Math.min(0.1, (now - last) / 1000);
      last = now;
      fly.step(seconds);
      controls.update();
      renderer.render(scene, camera);
    });

    onChange(() => void load(true).catch((error: unknown) => bar.fail(String(error))));

    try {
      await load();
    } catch (error) {
      bar.fail(`could not read the document: ${(error as Error).message}`);
    }
  })();

  return { bar, models, ready };
}
