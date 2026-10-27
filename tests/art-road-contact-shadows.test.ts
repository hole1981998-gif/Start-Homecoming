import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRoadContactShadows } from '../src/art/road-contact-shadows';

describe('road contact shadows', () => {
  it('shares a feathered mask and stays on the road when its owner moves or jumps', () => {
    const shadows = createRoadContactShadows();
    const scene = new THREE.Scene();
    const bike = shadows.create(), traffic = shadows.create();
    scene.add(bike, traffic);
    expect(bike.geometry).toBe(traffic.geometry);
    expect(bike.material).toBe(traffic.material);
    const material = bike.material as THREE.MeshBasicMaterial;
    const pixels = material.alphaMap!.image.data as Uint8Array;
    const size = material.alphaMap!.image.width as number;
    const greenAt = (x: number, y: number) => pixels[(y * size + x) * 4 + 1];
    expect(greenAt(size / 2, size / 2)).toBeGreaterThan(greenAt(0, 0));
    shadows.place(bike, 3, 12, .4, 1.2, 2.5);
    expect(bike.position.x).toBe(3);
    expect(bike.position.z).toBe(12);
    expect(bike.position.y).toBeLessThan(.05);
    expect(bike.rotation.y).toBeCloseTo(.4);
    expect(bike.scale.x).toBeCloseTo(1.2);
    expect(bike.scale.y).toBeCloseTo(2.5);
    expect(bike.userData.collisionRole).toBe('decorative-only');
    shadows.dispose();
    expect(scene.children).toHaveLength(0);
  });
});
