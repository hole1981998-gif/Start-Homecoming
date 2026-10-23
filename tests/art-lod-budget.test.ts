import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { vehicles, type VehicleKind } from '../src/vehicles';

function count(root: THREE.Object3D) {
  let meshes = 0, triangles = 0;
  root.traverse(obj => { if (obj instanceof THREE.Mesh) {
    meshes++;
    const geometry = obj.geometry as THREE.BufferGeometry;
    triangles += (geometry.index?.count ?? geometry.getAttribute('position').count) / 3;
  } });
  return { meshes, triangles };
}

it('reduces traffic-distance geometry in every existing vehicle family', () => {
  const measurements: Record<string, { near: ReturnType<typeof count>; far: ReturnType<typeof count> }> = {};
  for (const kind of Object.keys(vehicles) as VehicleKind[]) {
    const near = createVehicleArt(kind, 'player', 'near');
    const far = createVehicleArt(kind, 'player', 'far');
    const a = count(near.root), b = count(far.root);
    expect(b.triangles, `${kind} far triangles`).toBeLessThan(a.triangles);
    expect(b.meshes, `${kind} far drawables`).toBeLessThanOrEqual(a.meshes);
    measurements[kind] = { near: a, far: b };
    near.dispose(); far.dispose();
  }
  console.log('Essential vehicle art LOD metrics', measurements);
});
