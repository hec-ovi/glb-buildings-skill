/**
 * Keyboard view controls, on top of the mouse orbit.
 *
 *   W A S D  move over the ground, the way you are looking
 *   Q E      turn left and right around what you are looking at
 *   R F      up and down
 *
 * Speed follows how far out you are, so it feels the same close in and far away.
 */
import { Vector3, type Camera } from 'three';

const KEYS = ['w', 'a', 's', 'd', 'q', 'e', 'r', 'f'] as const;
type Key = (typeof KEYS)[number];

export class Fly {
  /** Metres per second at one metre of distance, and radians per second. */
  static readonly PACE = 0.9;
  static readonly TURN = 1.2;

  readonly #down = new Set<Key>();
  readonly #camera: Camera;
  readonly #target: Vector3;
  readonly #onMove: () => void;

  constructor(camera: Camera, target: Vector3, onMove: () => void = () => {}) {
    this.#camera = camera;
    this.#target = target;
    this.#onMove = onMove;
  }

  listen(on: EventTarget = window): () => void {
    const down = (event: Event) => this.press((event as KeyboardEvent).key, true);
    const up = (event: Event) => this.press((event as KeyboardEvent).key, false);
    on.addEventListener('keydown', down);
    on.addEventListener('keyup', up);
    on.addEventListener('blur', () => this.#down.clear());
    return () => {
      on.removeEventListener('keydown', down);
      on.removeEventListener('keyup', up);
    };
  }

  press(key: string, held: boolean): void {
    const lower = key.toLowerCase() as Key;
    if (!KEYS.includes(lower)) return;
    if (held) this.#down.add(lower);
    else this.#down.delete(lower);
  }

  get active(): boolean {
    return this.#down.size > 0;
  }

  /** Move for this frame. `seconds` is the time since the last one. */
  step(seconds: number): void {
    if (this.#down.size === 0) return;

    const offset = new Vector3().subVectors(this.#camera.position, this.#target);
    const reach = Math.max(1, offset.length());
    const pace = Fly.PACE * reach * seconds;
    const turn = Fly.TURN * seconds;

    const forward = new Vector3(-offset.x, 0, -offset.z).normalize();
    // forward x up, so D goes to the right of the screen rather than across it the other way.
    const right = new Vector3(-forward.z, 0, forward.x);
    const move = new Vector3();

    if (this.#down.has('w')) move.addScaledVector(forward, pace);
    if (this.#down.has('s')) move.addScaledVector(forward, -pace);
    if (this.#down.has('d')) move.addScaledVector(right, pace);
    if (this.#down.has('a')) move.addScaledVector(right, -pace);
    if (this.#down.has('r')) move.y += pace;
    if (this.#down.has('f')) move.y -= pace;

    this.#camera.position.add(move);
    this.#target.add(move);

    const angle = (this.#down.has('q') ? turn : 0) - (this.#down.has('e') ? turn : 0);
    if (angle !== 0) {
      const around = new Vector3().subVectors(this.#camera.position, this.#target);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      this.#camera.position.set(
        this.#target.x + around.x * cos + around.z * sin,
        this.#camera.position.y,
        this.#target.z - around.x * sin + around.z * cos,
      );
    }

    this.#camera.lookAt(this.#target);
    this.#onMove();
  }
}
