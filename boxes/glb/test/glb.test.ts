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
    // A plain tower is walls and a roof, and carries no material it never uses.
    expect(stats.materials).toBe(2);
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
                    { kind: 'window', col: 4, row: 8, cols: 10, rows: 14, material: 'crystal' },
                    { kind: 'panel', col: 20, row: 10, cols: 12, rows: 8, material: 'screen' },
                  ],
                },
              ],
            }
          : band,
      ),
    });
    const { glb, stats } = await buildGlb(composed);
    // Walls, roof, and the two the face asked for.
    expect(stats.materials).toBe(4);

    // And the picture behind the glazing is one picture: two materials point at it, and the file
    // carries a colour map and an emissive map, not a copy per material.
    const written = await new NodeIO().readBinary(glb);
    expect(written.getRoot().listTextures()).toHaveLength(2);
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
