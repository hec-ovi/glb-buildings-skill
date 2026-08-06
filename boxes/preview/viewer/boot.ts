/**
 * Starting the viewer. The panel is built first and every failure is written into it, so a
 * browser without WebGL, or a document that does not parse, shows a sentence instead of a
 * blank page.
 */
import {
  AmbientLight,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Blueprint } from './Blueprint.ts';
import { Hud } from './Hud.ts';
import { Picker } from './Picker.ts';
import { fetchScene, onChange, postSelection } from './api.ts';

export type BootOptions = {
  stage: HTMLElement;
  panel: HTMLElement;
  /** Swapped in tests to stand in for a browser that cannot give a WebGL context. */
  createRenderer?: () => WebGLRenderer;
};

const EMPTY_SCENE = { name: '', size: { width: 0, depth: 0, height: 0 }, bands: [] };

export function boot(options: BootOptions): { hud: Hud; ready: Promise<void> } {
  const { stage, panel } = options;
  let picker: Picker | undefined;
  let show3d: ((show: boolean) => void) | undefined;

  const hud = new Hud(panel, {
    onMode: (mode) => picker?.setMode(mode),
    onModel: (show) => show3d?.(show),
  });

  const ready = (async () => {
    let renderer: WebGLRenderer;
    try {
      renderer = (options.createRenderer ?? (() => new WebGLRenderer({ antialias: true })))();
    } catch (error) {
      hud.fail(`this browser gave no WebGL context: ${(error as Error).message}`);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.background = new Color(0x0b1020);
    scene.add(new AmbientLight(0xffffff, 1.6));
    const sun = new DirectionalLight(0xffffff, 1.4);
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

    let blueprint: Blueprint | undefined;
    let picked: { bayIds: string[]; bandIds: string[] } = { bayIds: [], bandIds: [] };

    picker = new Picker(
      stage,
      camera,
      new Blueprint(EMPTY_SCENE),
      (selection) => {
        picked = { bayIds: selection.bayIds, bandIds: selection.bandIds };
        hud.showSelection(selection.bayIds, selection.bandIds);
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
        hud.fail('no build yet, run the build verb first');
      }
    };

    show3d = (show) => {
      modelRoot.visible = show;
      if (show && modelRoot.children.length === 0) void loadModel();
    };

    const frame = (size: Vector3) => {
      const reach = Math.max(size.x, size.z, size.y) * 1.6 + 10;
      camera.position.set(size.x * 0.9 + reach * 0.4, size.y * 0.75 + reach * 0.25, size.z * 0.9 + reach * 0.6);
      controls.target.set(0, size.y / 2, 0);
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
      hud.describe(payload.document, payload.scene);

      // Keep the highlight after a rebuild, minus any bay the new document no longer has.
      const alive = new Set(blueprint.handles.map((handle) => handle.bay.id));
      picked = { bayIds: picked.bayIds.filter((id) => alive.has(id)), bandIds: picked.bandIds };
      blueprint.select(picked.bayIds);
      hud.showSelection(picked.bayIds, picked.bandIds);

      if (!keepCamera) frame(blueprint.sizeMetres);
      if (modelRoot.visible) await loadModel();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('error', (event) => hud.fail(event.message));
    resize();

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    onChange(() => void load(true).catch((error: unknown) => hud.fail(String(error))));

    try {
      await load();
    } catch (error) {
      hud.fail(`could not read the document: ${(error as Error).message}`);
    }
  })();

  return { hud, ready };
}
