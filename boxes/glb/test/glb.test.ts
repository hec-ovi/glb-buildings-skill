import { describe, expect, it } from 'vitest';
import { NodeIO } from '@gltf-transform/core';
import { buildGlb, validateGlb } from '#glb';
import { BuildingError, newDocument, parseDocument } from '#spec';

const doc = newDocument('tower-a', { width: 18, depth: 14, floors: 12 });

describe('buildGlb', () => {
  it('writes a file the Khronos validator accepts', async () => {
    const { glb } = await buildGlb(doc);
    const report = await validateGlb(glb);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it('writes one mesh per section, so a tall tower stays cheap', async () => {
    const { stats } = await buildGlb(doc);
    expect(stats.meshes).toBe(3);
    expect(stats.nodes).toBe(3);
    // A plain tower is its base, its walls and a roof, and carries no material it never uses.
    // The base is its own wall: a ground floor is not a floor of the tower with bigger glass.
    expect(stats.materials).toBe(3);
    expect(stats.triangles).toBeLessThan(200);
  });

  it('carries a material only where something is made of it', async () => {
    const composed = parseDocument({
      ...doc,
      bands: doc.bands.map((band) =>
        band.id === 'body'
          ? {
              ...band,
              tier: 'light',
              faces: [
                {
                  side: 'S',
                  elements: [
                    { kind: 'window', col: 4, row: 8, cols: 10, rows: 14, material: 'window' },
                    { kind: 'panel', col: 20, row: 10, cols: 12, rows: 8, material: 'screen' },
                  ],
                },
              ],
            }
          : band,
      ),
    });
    const { stats } = await buildGlb(composed);
    // Base, walls, roof, and the two the face asked for.
    expect(stats.materials).toBe(5);
  });

  it('draws one picture for the wall and the glass in it, not one each', async () => {
    const cut = parseDocument({
      ...doc,
      bands: doc.bands.map((band) => (band.id === 'body' ? { ...band, tier: 'light', windows: true } : band)),
    });
    const written = await new NodeIO().readBinary((await buildGlb(cut)).glb);
    const materials = written.getRoot().listMaterials();
    const wall = materials.find((one) => one.getName() === 'facade')!;
    const glass = materials.find((one) => one.getName() === 'glass')!;

    expect(glass.getBaseColorTexture()).toBe(wall.getBaseColorTexture());
    expect(glass.getEmissiveTexture()).toBe(wall.getEmissiveTexture());
  });

  it('carries no pictures at all when the building is built plain', async () => {
    const plain = parseDocument({ ...doc, textures: false });
    const written = await new NodeIO().readBinary((await buildGlb(plain)).glb);

    expect(written.getRoot().listTextures()).toEqual([]);
    // The materials are still there and still named, so an engine can drop its own on them.
    expect(written.getRoot().listMaterials().map((one) => one.getName()).sort()).toEqual(['base', 'facade', 'roof']);
  });

  it('never lights a whole surface: a wall glows only where a map says a window is lit', async () => {
    // An emissive factor with no map behind it lights every triangle it touches, so a building
    // with no emissive map would come out shining like a lamp. Both modes are checked.
    for (const one of [parseDocument({ ...doc, textures: false }), doc]) {
      const read = await new NodeIO().readBinary((await buildGlb(one)).glb);
      for (const material of read.getRoot().listMaterials()) {
        if (material.getEmissiveTexture()) continue;
        expect(material.getEmissiveFactor(), material.getName()).toEqual([0, 0, 0]);
      }
    }
  });

  it('dresses one building in three families, and each one differently', async () => {
    const drawn = async (style: 'modern' | 'fifties' | 'cyber') => {
      const written = await new NodeIO().readBinary((await buildGlb(parseDocument({ ...doc, style }))).glb);
      const facade = written.getRoot().listTextures().find((one) => one.getName() === 'facade-colour')!;
      return [...facade.getImage()!];
    };
    expect(await drawn('modern')).not.toEqual(await drawn('fifties'));
    expect(await drawn('cyber')).not.toEqual(await drawn('fifties'));
  });

  it('steps a section in over the one below, and keeps every section closed', async () => {
    const stepped = parseDocument({
      ...doc,
      bands: [
        { id: 'base', kind: 'main', tier: 'full', floors: 1, floorHeight: 5000, template: 'main-plain' },
        { id: 'body', kind: 'bulk', tier: 'flat', floors: 6, template: 'bulk-flat', inset: 1500 },
        { id: 'tip', kind: 'roof', tier: 'light', floors: 1, floorHeight: 1200, template: 'roof-parapet', inset: 3000 },
      ],
    });
    const { stats, supports } = await buildGlb(stepped);
    expect(stats.meshes).toBe(3);
    expect(supports.map((s) => s.band)).toEqual(['body', 'tip']);
    expect(supports.every((s) => s.share > 0.5)).toBe(true);
  });

  it('builds a section that is turned and twisted over the one below', async () => {
    const twisted = parseDocument({
      ...doc,
      bands: [
        { id: 'base', kind: 'main', tier: 'full', floors: 1, floorHeight: 5000, template: 'main-plain' },
        { id: 'body', kind: 'bulk', tier: 'flat', floors: 5, template: 'bulk-flat', rotation: 20, twist: 25, taper: 800 },
        { id: 'tip', kind: 'roof', tier: 'light', floors: 1, floorHeight: 1200, template: 'roof-parapet', rotation: 45 },
      ],
    });
    const { glb } = await buildGlb(twisted);
    expect((await validateGlb(glb)).errors).toEqual([]);
  });

  it('keeps metres, Y up, and a plain node transform per section', async () => {
    const { glb } = await buildGlb(doc);
    const read = await new NodeIO().readBinary(glb);
    const root = read.getRoot();

    expect(root.listExtensionsRequired()).toEqual([]);
    const heights = root
      .listNodes()
      .map((node) => node.getTranslation()[1])
      .sort((a, b) => a - b);
    expect(heights[0]).toBe(0);
    expect(heights.at(-1)).toBeCloseTo(36.49, 2);
    expect(root.listNodes()).toHaveLength(3);

    for (const node of root.listNodes()) {
      expect(node.getScale()).toEqual([1, 1, 1]);
    }
    for (const mesh of root.listMeshes()) {
      for (const primitive of mesh.listPrimitives()) {
        expect(primitive.getAttribute('POSITION')).toBeTruthy();
        expect(primitive.getAttribute('NORMAL')).toBeTruthy();
        expect(primitive.getAttribute('TEXCOORD_0')).toBeTruthy();
        expect(primitive.getAttribute('TEXCOORD_1')).toBeNull();
        expect(primitive.getMaterial()?.getDoubleSided()).toBe(false);
      }
    }
  });

  it('builds a stack of sliced, bowed and round sections the validator accepts', async () => {
    const shaped = parseDocument({
      ...doc,
      bands: [
        { id: 'base', kind: 'main', tier: 'full', floors: 1, floorHeight: 5000, template: 'main-plain', bow: 'NS' },
        { id: 'body', kind: 'bulk', tier: 'light', floors: 6, template: 'bulk-flat', shape: 'round', arc: 270, rotation: 30, greebles: 0.3 },
        { id: 'wedge', kind: 'bulk', tier: 'flat', floors: 3, template: 'bulk-flat', shape: 'round', arc: 120, columns: 'ribs' },
        { id: 'tip', kind: 'roof', tier: 'light', floors: 1, floorHeight: 1200, template: 'roof-parapet', shape: 'round', arc: 120, clutter: 0.5 },
      ],
    });
    const { glb, stats } = await buildGlb(shaped);
    expect(stats.meshes).toBe(4);
    expect((await validateGlb(glb)).errors).toEqual([]);
  });

  it('runs lit lines up a face, a screen off one, and a crown round the top', async () => {
    const lit = parseDocument({
      ...doc,
      style: 'cyber',
      bands: doc.bands.map((band) =>
        band.id === 'body'
          ? {
              ...band,
              lines: [
                { side: 'S', along: 2000, from: 0, to: 9, colour: 'cyan' },
                { side: 'S', along: 6000, from: 2, to: 9, colour: 'magenta' },
              ],
              screens: [{ side: 'E', along: 1500, width: 6000, from: 1, to: 6, stand: 1200 }],
            }
          : band.kind === 'roof'
            ? { ...band, crown: 'red' }
            : band,
      ),
    });

    const { glb, stats } = await buildGlb(lit);
    expect((await validateGlb(glb)).errors).toEqual([]);

    const names = (await new NodeIO().readBinary(glb)).getRoot().listMaterials().map((one) => one.getName());
    // Two colours of line are two materials over one picture, and the screen is its own.
    expect(names).toContain('neon:cyan');
    expect(names).toContain('neon:magenta');
    expect(names).toContain('neon:red');
    expect(names).toContain('screen-body-1');
    expect(stats.triangles).toBeGreaterThan(0);
  });

  it('refuses a screen that would stand inside the wall it hangs on', async () => {
    const buried = parseDocument({
      ...doc,
      bands: doc.bands.map((band) =>
        band.id === 'body' ? { ...band, screens: [{ side: 'S', along: 1000, width: 4000, from: 0, to: 3, stand: 20 }] } : band,
      ),
    });
    await expect(buildGlb(buried)).rejects.toThrow(BuildingError);
  });

  it('refuses a section that floats off the one below it', async () => {
    const floating = parseDocument({
      ...doc,
      bands: [
        { id: 'base', kind: 'main', tier: 'full', floors: 1, floorHeight: 5000, template: 'main-plain', width: 12000, depth: 12000 },
        { id: 'body', kind: 'bulk', tier: 'flat', floors: 4, template: 'bulk-flat', width: 8000, depth: 8000, shiftX: 14000 },
        { id: 'tip', kind: 'roof', tier: 'light', floors: 1, floorHeight: 1200, template: 'roof-parapet', width: 8000, depth: 8000, shiftX: 14000 },
      ],
    });
    await expect(buildGlb(floating)).rejects.toThrow(BuildingError);
  });
});
