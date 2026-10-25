import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRoadShadowArt } from '../src/art/road-shadows';

describe('decorative long road shadow', () => {
  it('stays within its route-local span and fades at the band edges', () => {
    const art = createRoadShadowArt(13.2, 14, 5);
    const mesh = art.root.getObjectByName('feathered_long_shadow') as THREE.Mesh;
    const bounds = new THREE.Box3().setFromObject(art.root).getSize(new THREE.Vector3());
    expect(bounds.x).toBeCloseTo(13.2);
    expect(bounds.z).toBeLessThan(20);
    expect(art.root.userData.collisionRole).toBe('decorative-only');
    const alpha = (mesh.material as THREE.MeshBasicMaterial).alphaMap as THREE.DataTexture;
    const data = alpha.image.data as Uint8Array;
    const sample = (x: number, y: number) => data[(y * 64 + x) * 4 + 1];
    expect(sample(32, 32)).toBeGreaterThan(200);
    expect(sample(32, 0)).toBe(0);
    expect(sample(0, 32)).toBe(0);
    art.dispose();
  });
  it('rejects invalid spans', () => {
    expect(() => createRoadShadowArt(0, 14, 5)).toThrow();
    expect(() => createRoadShadowArt(13.2, Number.NaN, 5)).toThrow();
  });
});
