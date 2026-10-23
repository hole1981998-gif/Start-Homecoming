import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCar4Art } from '../src/art/car4';

function metrics(root: THREE.Object3D) {
  let meshes = 0, triangles = 0;
  const materials = new Set<THREE.Material>();
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    meshes++;
    const geometry = node.geometry as THREE.BufferGeometry;
    triangles += geometry.index ? geometry.index.count / 3 : geometry.getAttribute('position').count / 3;
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
  });
  return { meshes, triangles, materials: materials.size };
}

describe('car4 art handoff contract', () => {
  it('fits the existing car4 footprint while preserving the named driver and passenger mounts', () => {
    const art = createCar4Art();
    const bounds = new THREE.Box3().setFromObject(art.root);
    expect(bounds.min.y).toBeGreaterThanOrEqual(-.01);
    expect(bounds.max.x - bounds.min.x).toBeLessThanOrEqual(1.95); // soft mirrors only
    expect(bounds.max.z - bounds.min.z).toBeLessThanOrEqual(4.3);
    expect(Object.keys(art.seats).sort()).toEqual(['driver', 'frontPassenger', 'rearLeft', 'rearRight']);
    expect(art.seats.driver.position.z).toBeGreaterThan(art.seats.rearLeft.position.z);
    expect(art.sockets.tail_left.position.z).toBeLessThan(0);
    expect(art.sockets.headlamp_left.position.z).toBeGreaterThan(0);
    art.dispose();
  });

  it('has a distinct lower-detail LOD and isolated cosmetic damage groups', () => {
    const near = createCar4Art('near'), far = createCar4Art('far');
    expect(metrics(far.root).triangles).toBeLessThan(metrics(near.root).triangles);
    const used = near.root.getObjectByName('used_surface');
    const damaged = near.root.getObjectByName('damaged_panels');
    const destroyed = near.root.getObjectByName('destroyed_overlay');
    near.setCondition('clean');
    expect([used?.visible, damaged?.visible, destroyed?.visible]).toEqual([false, false, false]);
    near.setCondition('destroyed');
    expect([used?.visible, damaged?.visible, destroyed?.visible]).toEqual([true, true, true]);
    console.log('VEH-03 near/far metrics', metrics(near.root), metrics(far.root));
    near.dispose(); far.dispose();
  });
});
