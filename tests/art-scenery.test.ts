import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { balance } from '../src/config';
import { landscapeColors, type LandscapeKind } from '../src/landscape';
import { createSceneryCluster } from '../src/art/scenery';

describe('essential roadside scenery', () => {
  it('covers every existing 96 m landscape family and stays out of the driving corridor', () => {
    for (const kind of Object.keys(landscapeColors) as LandscapeKind[]) {
      for (const side of [-1, 1] as const) for (const lod of ['near', 'far'] as const) {
        const art = createSceneryCluster(kind, side, lod);
        const bounds = new THREE.Box3().setFromObject(art.root);
        const roadHalfWidth = balance.laneWidth * balance.laneCount / 2;
        if (side < 0) expect(bounds.max.x).toBeLessThan(-roadHalfWidth);
        else expect(bounds.min.x).toBeGreaterThan(roadHalfWidth);
        expect(art.root.userData.collisionRole).toBe('decorative-only');
        expect(art.root.userData.regionLengthM).toBe(96);
        art.dispose();
      }
    }
  });
  it('gives the city roof, awning and balcony shapes beyond ordinary box facades', () => {
    const art = createSceneryCluster('city', 1);
    expect(art.root.getObjectByName('pitched_sheet_roof')).toBeDefined();
    expect(art.root.getObjectByName('front_awning')).toBeDefined();
    expect(art.root.getObjectByName('balcony_rail')).toBeDefined();
    art.dispose();
  });
  it('keeps seeded city variations deterministic and safely roadside', () => {
    const roadHalfWidth = balance.laneWidth * balance.laneCount / 2;
    const positions: number[] = [];
    for (const seed of [0, 0, 1, 2]) {
      const art = createSceneryCluster('city', -1, 'near', seed);
      const bounds = new THREE.Box3().setFromObject(art.root);
      expect(bounds.max.x).toBeLessThan(-roadHalfWidth);
      for (const name of ['midrise_apartments', 'wide_storefront', 'pocket_park'])
        expect(art.root.getObjectByName(name)).toBeDefined();
      positions.push(art.root.getObjectByName('midrise_apartments')!.position.z);
      art.dispose();
    }
    expect(positions[0]).toBe(positions[1]);
    expect(Math.abs(positions[0] - positions[2])).toBeGreaterThan(5);
  });
  it('keeps distant city detail while reducing individual drawables', () => {
    const near = createSceneryCluster('city', 1, 'near', 0);
    const far = createSceneryCluster('city', 1, 'far', 0);
    let nearMeshes = 0, farMeshes = 0;
    near.root.traverse(object => { if (object instanceof THREE.Mesh) nearMeshes++; });
    far.root.traverse(object => { if (object instanceof THREE.Mesh) farMeshes++; });
    expect(farMeshes).toBeLessThan(nearMeshes / 3);
    expect(new THREE.Box3().setFromObject(far.root).min.x)
      .toBeGreaterThan(balance.laneWidth * balance.laneCount / 2);
    near.dispose(); far.dispose();
  });
});
