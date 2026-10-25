import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createOpenWaterArt } from '../src/art/water-body';

describe('decorative river and lake water', () => {
  it('keeps each animated surface inside its requested placement bounds', () => {
    for (const kind of ['river', 'lake'] as const) for (const lod of ['near', 'far'] as const) {
      const art = createOpenWaterArt(kind, 18, 40, lod);
      const surface = art.root.getObjectByName(`${kind}_water_surface`) as THREE.Mesh;
      const position = surface.geometry.getAttribute('position');
      const initial = Array.from(position.array);
      const bounds = new THREE.Box3().setFromObject(art.root);
      expect(bounds.getSize(new THREE.Vector3()).x).toBeLessThanOrEqual(18);
      expect(bounds.getSize(new THREE.Vector3()).z).toBeLessThanOrEqual(40);
      expect(art.root.userData.collisionRole).toBe('decorative-only');
      art.setVisualTime(2.3);
      const moved = Array.from(position.array);
      expect(moved).not.toEqual(initial);
      art.setVisualTime(5.1);
      art.setVisualTime(2.3);
      expect(Array.from(position.array)).toEqual(moved);
      expect(new THREE.Box3().setFromObject(art.root).getSize(new THREE.Vector3()).x)
        .toBeCloseTo(bounds.getSize(new THREE.Vector3()).x);
      art.dispose();
    }
  });
  it('uses a denser mesh nearby and rejects invalid requested dimensions', () => {
    for (const kind of ['river', 'lake'] as const) {
      const near = createOpenWaterArt(kind, 18, 40, 'near');
      const far = createOpenWaterArt(kind, 18, 40, 'far');
      const count = (art: ReturnType<typeof createOpenWaterArt>) =>
        ((art.root.children[0] as THREE.Mesh).geometry.getAttribute('position').count);
      expect(count(near)).toBeGreaterThan(count(far) * 2);
      near.dispose(); far.dispose();
    }
    expect(() => createOpenWaterArt('lake', 0, 4)).toThrow();
    expect(() => createOpenWaterArt('river', 4, Number.NaN)).toThrow();
  });
});
