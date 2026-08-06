/** The preview app: blueprint, orbit, picking, live reload. */
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

const stage = document.getElementById('stage') as HTMLDivElement;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
stage.appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color(0x0b1020);

const camera = new PerspectiveCamera(45, 1, 0.1, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new AmbientLight(0xffffff, 1.6));
const sun = new DirectionalLight(0xffffff, 1.4);
sun.position.set(30, 60, 40);
scene.add(sun);

const ground = new GridHelper(200, 200, 0x2a3b63, 0x16223c);
scene.add(ground);

const modelRoot = new Group();
modelRoot.visible = false;
scene.add(modelRoot);

let blueprint: Blueprint | undefined;

const hud = new Hud(document.body, {
  onMode: (mode) => picker.setMode(mode),
  onModel: (show) => {
    modelRoot.visible = show;
    if (show && modelRoot.children.length === 0) void loadModel();
  },
});

const picker = new Picker(
  stage,
  camera,
  new Blueprint({ name: '', size: { width: 0, depth: 0, height: 0 }, bands: [] }),
  (selection) => {
    hud.showSelection(selection.bayIds, selection.bandIds);
    void postSelection(selection);
  },
  (enabled) => {
    controls.enabled = enabled;
  },
);

async function loadModel(): Promise<void> {
  try {
    const gltf = await new GLTFLoader().loadAsync('/api/model.glb');
    modelRoot.clear();
    modelRoot.add(gltf.scene);
  } catch {
    hud.fail('no build yet, run the build verb first');
  }
}

function frame(size: Vector3): void {
  const reach = Math.max(size.x, size.z, size.y) * 1.6 + 10;
  camera.position.set(size.x * 0.9 + reach * 0.4, size.y * 0.75 + reach * 0.25, size.z * 0.9 + reach * 0.6);
  controls.target.set(0, size.y / 2, 0);
  controls.update();
  ground.scale.setScalar(Math.max(1, reach / 100));
}

async function load(keepCamera = false): Promise<void> {
  const payload = await fetchScene();
  blueprint?.dispose();
  if (blueprint) scene.remove(blueprint.root);

  blueprint = new Blueprint(payload.scene);
  scene.add(blueprint.root);
  picker.retarget(blueprint);
  hud.describe(payload.document, payload.scene);
  if (!keepCamera) frame(blueprint.sizeMetres);
  if (modelRoot.visible) await loadModel();
}

function resize(): void {
  const { clientWidth, clientHeight } = stage;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / Math.max(1, clientHeight);
  camera.updateProjectionMatrix();
}

addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

onChange(() => void load(true));
load().catch((error: unknown) => hud.fail(String(error)));
