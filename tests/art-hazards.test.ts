import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { hazardSizes } from '../src/config';
import { createPropHazardArt, createSurfaceHazardArt, type PropHazardKind } from '../src/art/hazards';

describe('essential hazard art', () => {
  it('matches all live water and pothole footprints without altering simulation dimensions', () => {
    for (const kind of ['water', 'pothole'] as const) for (const [width, length] of hazardSizes[kind]) {
      const asset = createSurfaceHazardArt(kind, width, length);
      const bounds = new THREE.Box3().setFromObject(asset.root);
      const size = bounds.getSize(new THREE.Vector3());
      expect(size.x).toBeLessThanOrEqual(width + .02);
      expect(size.z).toBeLessThanOrEqual(length + .02);
      expect(size.x).toBeGreaterThan(width * .94);
      expect(size.z).toBeGreaterThan(length * .94);
      expect(asset.root.userData.collisionRole).toBe('reference-only');
      const basin = asset.root.getObjectByName('sloped_basin_normals') as THREE.Mesh;
      expect(basin.geometry.getAttribute('normal')).toBeDefined();
      asset.dispose();
    }
  });
  it('gives reusable props visible state changes and mount points', () => {
    const kinds: PropHazardKind[] = ['cargo_crate', 'cargo_barrel', 'fuel', 'repair', 'barrier', 'fallen_tree'];
    for (const kind of kinds) {
      const asset = createPropHazardArt(kind);
      expect(asset.sockets.contact.parent).toBe(asset.root);
      expect(asset.root.getObjectByName('used_overlay')?.visible).toBe(false);
      asset.setState('used');
      expect(asset.root.getObjectByName('used_overlay')?.visible).toBe(true);
      asset.setState('broken');
      expect(asset.root.getObjectByName('broken_overlay')?.visible).toBe(true);
      asset.dispose();
    }
  });
  it('rejects invalid world footprints', () => {
    expect(() => createSurfaceHazardArt('water', 0, 2)).toThrow();
    expect(() => createSurfaceHazardArt('pothole', 2, Number.NaN)).toThrow();
  });
});
