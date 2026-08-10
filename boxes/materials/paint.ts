/**
 * The pixels a finish is drawn on, and the seeded noise it is made of.
 *
 * A tile repeats, so drawing wraps instead of clipping: a stain that runs off the right edge comes
 * back on the left and the seam never shows. Everything here is integer pixel work, which is why a
 * whole texture set costs a few milliseconds and no dependencies.
 */
import { png, type Pixels } from './png.ts';

export type Rgb = [number, number, number];

/** What a template hands back: the picture, and what of it glows. Both are PNG bytes. */
export type Drawing = { colour: Uint8Array; emissive?: Uint8Array };

/** The same generator everywhere, so one seed gives one texture set, every build. */
export function rng(seed: number): () => number {
  let state = (seed | 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number): number => (value < 0 ? 0 : value > 255 ? 255 : Math.round(value));

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** The same colour lighter or darker. Under 1 darkens, over 1 lightens. */
export function tint(colour: Rgb, factor: number): Rgb {
  return [colour[0] * factor, colour[1] * factor, colour[2] * factor];
}

export const BLACK: Rgb = [0, 0, 0];

/** A roll snapped to one of five levels. Fewer distinct colours, far smaller PNG, same picture. */
const LEVELS = 5;
function step(roll: number): number {
  return Math.round(roll * (LEVELS - 1)) / (LEVELS - 1);
}

export class Canvas {
  readonly width: number;
  readonly height: number;
  readonly #rgba: Uint8Array;

  constructor(width: number, height: number, base: Rgb = BLACK) {
    this.width = width;
    this.height = height;
    this.#rgba = new Uint8Array(width * height * 4);
    this.fill(base);
  }

  fill(colour: Rgb, alpha = 255): this {
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) this.pixel(x, y, colour, alpha);
    return this;
  }

  /**
   * One pixel. Coordinates wrap, so nothing a template draws can fall off the tile. `alpha` is
   * how much of it is there at all, which is what lets a tile be seen through: the dot matrix
   * over a screen is a picture that is mostly nothing.
   */
  pixel(x: number, y: number, colour: Rgb, alpha = 255): this {
    const at = (((y % this.height) + this.height) % this.height) * this.width + (((x % this.width) + this.width) % this.width);
    const i = at * 4;
    this.#rgba[i] = clamp(colour[0]);
    this.#rgba[i + 1] = clamp(colour[1]);
    this.#rgba[i + 2] = clamp(colour[2]);
    this.#rgba[i + 3] = clamp(alpha);
    return this;
  }

  read(x: number, y: number): Rgb {
    const at = (((y % this.height) + this.height) % this.height) * this.width + (((x % this.width) + this.width) % this.width);
    const i = at * 4;
    return [this.#rgba[i]!, this.#rgba[i + 1]!, this.#rgba[i + 2]!];
  }

  rect(x: number, y: number, width: number, height: number, colour: Rgb, alpha = 255): this {
    for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) this.pixel(x + dx, y + dy, colour, alpha);
    return this;
  }

  /** A band right across the tile, which is how a floor line, a flange or a rail is drawn. */
  band(y: number, height: number, colour: Rgb): this {
    return this.rect(0, y, this.width, height, colour);
  }

  /** A stripe the full height, which is how a mullion, a baluster or a form line is drawn. */
  stripe(x: number, width: number, colour: Rgb): this {
    return this.rect(x, 0, width, this.height, colour);
  }

  /**
   * The grain every real material has, in small blocks and at a few fixed strengths rather than
   * per pixel and continuous. It looks the same on a wall seen from the street and the tile
   * compresses to a fraction of the size, which is what lets a building carry its own textures.
   */
  grain(random: () => number, amount: number, block = 2): this {
    for (let y = 0; y < this.height; y += block) {
      for (let x = 0; x < this.width; x += block) {
        const shift = (step(random()) - 0.5) * 2 * amount;
        for (let dy = 0; dy < block; dy++) {
          for (let dx = 0; dx < block; dx++) this.pixel(x + dx, y + dy, tint(this.read(x + dx, y + dy), 1 + shift));
        }
      }
    }
    return this;
  }

  /** Scattered specks: aggregate, gravel, spangle, dirt. */
  speckle(random: () => number, count: number, colour: Rgb, spread = 1): this {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(random() * this.width);
      const y = Math.floor(random() * this.height);
      const size = 1 + Math.floor(random() * spread);
      this.rect(x, y, size, size, mix(this.read(x, y), colour, 0.35 + step(random()) * 0.65));
    }
    return this;
  }

  /**
   * Multiply the brightness of every pixel by a function of where it is, `u` and `v` running 0 to 1.
   * This is what gives a pipe its round shading and a pane its gradient.
   */
  shade(by: (u: number, v: number) => number): this {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.pixel(x, y, tint(this.read(x, y), by((x + 0.5) / this.width, (y + 0.5) / this.height)));
      }
    }
    return this;
  }

  /** A streak running down the tile: water staining, rust bleed, a reflection. */
  streak(x: number, width: number, colour: Rgb, strength: number, from = 0, to = this.height): this {
    for (let y = from; y < to; y++) {
      const fade = 1 - (y - from) / Math.max(1, to - from);
      for (let dx = 0; dx < width; dx++) {
        const edge = 1 - Math.abs(dx - width / 2) / (width / 2);
        this.pixel(x + dx, y, mix(this.read(x + dx, y), colour, strength * fade * edge));
      }
    }
    return this;
  }

  pixels(): Pixels {
    return { width: this.width, height: this.height, rgba: this.#rgba };
  }

  bytes(): Uint8Array {
    return png(this.pixels());
  }
}
