import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { balance } from '../src/config';
import { landscapeColors, type LandscapeKind } from '../src/landscape';
import { createSceneryCluster } from '../src/art/scenery';

describe('essential roadside scenery', () => {
  it('covers every existing 96 m landscape family and stays out of the driving corridor', () => {
    for (const kind of Object.keys(landscapeColors) as LandscapeKind[]) for (const side of [-1, 1] as const) {
      const art = createSceneryCluster(kind, side);
      const bounds = new THREE.Box3().setFromObject(art.root);
      const roadHalfWidth = balance.laneWidth * balance.laneCount / 2;
      if (side < 0) expect(bounds.max.x).toBeLessThan(-roadHalfWidth);
      else expect(bounds.min.x).toBeGreaterThan(roadHalfWidth);
      expect(art.root.userData.collisionRole).toBe('decorative-only');
      expect(art.root.userData.regionLengthM).toBe(96);
      art.dispose();
    }
  });
  it('gives the city roof, awning and balcony shapes beyond ordinary box facades', () => {
    const art = createSceneryCluster('city', 1);
    expect(art.root.getObjectByName('pitched_sheet_roof')).toBeDefined();
    expect(art.root.getObjectByName('front_awning')).toBeDefined();
    expect(art.root.getObjectByName('balcony_rail')).toBeDefined();
    art.dispose();
  });
});
