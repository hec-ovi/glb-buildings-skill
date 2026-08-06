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

  it('writes one mesh per band and one node per floor, so a tall tower stays cheap', async () => {
    const { stats } = await buildGlb(doc);
    expect(stats.meshes).toBe(3);
    expect(stats.nodes).toBe(12);
    expect(stats.materials).toBe(2);
    expect(stats.triangles).toBeLessThan(200);
  });

  it('keeps metres, Y up, and a plain node transform per floor', async () => {
    const { glb } = await buildGlb(doc);
    const read = await new NodeIO().readBinary(glb);
    const root = read.getRoot();

    expect(root.listExtensionsRequired()).toEqual([]);
    const heights = root
      .listNodes()
      .map((node) => node.getTranslation()[1])
      .sort((a, b) => a - b);
    expect(heights[0]).toBe(0);
    expect(heights.at(-1)).toBeCloseTo(36.5, 3);

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

  it('refuses to write a building whose bands do not close into one shell', async () => {
    const broken = parseDocument({
      ...doc,
      bands: [
        { id: 'ground', kind: 'main', tier: 'full', floors: 1, floorHeight: 4500, template: 'main-plain' },
        { id: 'body', kind: 'bulk', tier: 'flat', floors: 2, template: 'bulk-flat', inset: 1500 },
        { id: 'crown', kind: 'roof', tier: 'light', floors: 1, floorHeight: 900, template: 'roof-parapet' },
      ],
    });
    await expect(buildGlb(broken)).rejects.toThrow(BuildingError);
  });
});
