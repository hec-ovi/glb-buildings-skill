/**
 * The three families a building can be dressed in. A style is a sheet of colours and two or three
 * numbers, and every template reads what it needs from it, so one set of templates draws a modern
 * curtain wall tower, a 1950s block and a cyberpunk megastructure without a branch anywhere.
 *
 * Generated image packs override these tiles per style. Anything a pack does not carry falls back
 * to the drawing, so a half finished pack still builds.
 */
import type { Rgb } from './paint.ts';

export const STYLES = ['modern', 'fifties', 'cyber'] as const;
export type Style = (typeof STYLES)[number];

export const STYLE_NOTES: Record<Style, string> = {
  modern: 'a present day curtain wall tower: dark glass, aluminium, pale precast, cool white offices',
  fifties: 'a 1950s block: buff brick, painted steel windows, enamel spandrels, tungsten light, weathered',
  cyber: 'a near black megastructure drawn entirely by its lights: neon, screens, hard little windows',
};

/** One lit window colour and how often it comes up. */
export type Light = { colour: Rgb; weight: number };

export type StyleSheet = {
  /** The wall itself, the band under each row of windows, the glass, and the sky it catches. */
  wall: Rgb;
  spandrel: Rgb;
  glass: Rgb;
  sheen: Rgb;
  /** What a lit window is, and how many of them are lit at all. */
  lights: Light[];
  lit: number;
  /** Of the lit ones, how many show light in only part of the pane. */
  partial: number;
  /** The parts. */
  concrete: Rgb;
  metal: Rgb;
  pipe: Rgb;
  antenna: Rgb;
  roof: Rgb;
  door: Rgb;
  /** Window and door frames, and a balcony's rail. */
  frame: Rgb;
  rail: Rgb;
  /** The colour a neon run and a screen default to. */
  neon: Rgb;
  screen: Rgb;
  /** What dirt is here, and how much of it: 0 is new, 1 is fifty years of weather. */
  grime: Rgb;
  wear: number;
};

const SHEETS: Record<Style, StyleSheet> = {
  modern: {
    wall: [34, 36, 40],
    spandrel: [26, 28, 32],
    glass: [16, 20, 26],
    sheen: [40, 52, 68],
    lights: [
      { colour: [255, 247, 232], weight: 9 },
      { colour: [255, 228, 182], weight: 4 },
      { colour: [214, 228, 255], weight: 2 },
    ],
    lit: 0.18,
    partial: 0.25,
    concrete: [186, 184, 178],
    metal: [150, 154, 160],
    pipe: [128, 132, 136],
    antenna: [172, 176, 180],
    roof: [148, 150, 153],
    door: [30, 34, 40],
    frame: [168, 172, 176],
    rail: [190, 194, 198],
    neon: [232, 240, 255],
    screen: [235, 240, 250],
    grime: [70, 68, 64],
    wear: 0.08,
  },
  fifties: {
    wall: [136, 116, 88],
    spandrel: [122, 134, 116],
    glass: [72, 78, 72],
    sheen: [120, 130, 124],
    lights: [
      { colour: [255, 196, 120], weight: 10 },
      { colour: [232, 160, 92], weight: 5 },
      { colour: [206, 232, 206], weight: 2 },
      { colour: [150, 180, 220], weight: 1 },
    ],
    lit: 0.12,
    partial: 0.35,
    concrete: [150, 144, 132],
    metal: [128, 120, 110],
    pipe: [64, 78, 64],
    antenna: [176, 176, 170],
    roof: [78, 74, 70],
    door: [64, 82, 66],
    frame: [216, 210, 192],
    rail: [150, 166, 180],
    neon: [255, 214, 150],
    screen: [226, 214, 186],
    grime: [58, 48, 38],
    wear: 0.75,
  },
  cyber: {
    wall: [10, 11, 13],
    spandrel: [14, 15, 18],
    glass: [7, 8, 11],
    sheen: [22, 30, 40],
    lights: [
      { colour: [255, 255, 250], weight: 8 },
      { colour: [120, 255, 240], weight: 6 },
      { colour: [255, 180, 90], weight: 4 },
      { colour: [255, 80, 60], weight: 3 },
      { colour: [255, 90, 220], weight: 1 },
    ],
    lit: 0.34,
    partial: 0.4,
    concrete: [38, 40, 44],
    metal: [58, 62, 68],
    pipe: [46, 50, 56],
    antenna: [30, 32, 36],
    roof: [26, 27, 29],
    door: [24, 26, 30],
    frame: [40, 44, 50],
    rail: [44, 48, 54],
    neon: [120, 255, 240],
    screen: [255, 90, 220],
    grime: [18, 20, 24],
    wear: 0.4,
  },
};

export function sheet(style: Style): StyleSheet {
  return SHEETS[style];
}

/** One lit colour, drawn against the style's own weights. */
export function lightColour(style: StyleSheet, random: () => number): Rgb {
  const total = style.lights.reduce((sum, light) => sum + light.weight, 0);
  let roll = random() * total;
  for (const light of style.lights) {
    roll -= light.weight;
    if (roll <= 0) return light.colour;
  }
  return style.lights[0]!.colour;
}
