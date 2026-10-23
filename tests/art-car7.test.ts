import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCar7Art } from '../src/art/car7';

function triangles(root: THREE.Object3D) {
  let total = 0;
  root.traverse(node => { if (node instanceof THREE.Mesh) {
    const g = node.geometry as THREE.BufferGeometry;
    total += g.index ? g.index.count / 3 : g.getAttribute('position').count / 3;
  } });
  return total;
}

describe('car7 art handoff', () => {
  it('keeps the seven-seat catalog footprint and third-row structure', () => {
    const art = createCar7Art();
    const b = new THREE.Box3().setFromObject(art.root);
    expect(b.max.x - b.min.x).toBeLessThanOrEqual(2.12);
    expect(b.max.z - b.min.z).toBeLessThanOrEqual(4.9);
    expect(Object.keys(art.seats)).toHaveLength(7);
    expect(art.root.getObjectByName('third_row_glass_-1')).toBeDefined();
    expect(art.root.getObjectByName('raised_roof')).toBeDefined();
    expect(art.wheels.frontLeft.userData.steerable).toBe(true);
    expect(art.wheels.rearLeft.userData.steerable).toBe(false);
    art.dispose();
  });
  it('offers a lighter far LOD', () => {
    const near = createCar7Art('near'), far = createCar7Art('far');
    expect(triangles(far.root)).toBeLessThan(triangles(near.root));
    console.log('VEH-04 triangles near/far', triangles(near.root), triangles(far.root));
    near.dispose(); far.dispose();
  });
});
