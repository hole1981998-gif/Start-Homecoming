import * as THREE from 'three';
import { expect, it } from 'vitest';
import { modelCreaseDegrees, smoothGameModelByAngle, smoothModelByAngle } from '../src/art/crease-smoothing';
import { createVehicleArt } from '../src/art/vehicle-catalog';

function bentFaces(degrees: number): THREE.Group {
  const angle = THREE.MathUtils.degToRad(degrees);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0,
    0, 0, 0, 1, 0, 0, 0, Math.cos(angle), Math.sin(angle),
  ], 3));
  const root = new THREE.Group();
  root.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ flatShading: true })));
  return root;
}

it('smooths a gentle bend but preserves a corner steeper than 35 degrees', () => {
  const gentle = bentFaces(20), sharp = bentFaces(70);
  expect(smoothModelByAngle(gentle)).toBe(1);
  expect(smoothModelByAngle(sharp)).toBe(1);
  const getDot = (root: THREE.Group): number => {
    const mesh = root.children[0] as THREE.Mesh;
    const normals = mesh.geometry.getAttribute('normal');
    const a = new THREE.Vector3().fromBufferAttribute(normals, 0);
    const b = new THREE.Vector3().fromBufferAttribute(normals, 3);
    expect((mesh.material as THREE.MeshStandardMaterial).flatShading).toBe(false);
    expect(mesh.geometry.userData.creaseDegrees).toBe(modelCreaseDegrees);
    return a.dot(b);
  };
  expect(getDot(gentle)).toBeGreaterThan(.999);
  expect(getDot(sharp)).toBeLessThan(.5);
  expect(smoothModelByAngle(gentle)).toBe(0);
});

it('uses the angle treatment on actual player and traffic vehicle models', () => {
  for (const role of ['player', 'traffic'] as const) {
    const art = createVehicleArt('car4', role);
    let checked = 0;
    art.root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      expect(object.geometry.getAttribute('normal')).toBeDefined();
      expect(object.geometry.userData.creaseDegrees).toBe(modelCreaseDegrees);
      checked++;
    });
    expect(checked).toBeGreaterThan(20);
    art.dispose();
  }
});

it('leaves the noforce backup geometry and flat materials unchanged', () => {
  const root = bentFaces(20);
  const mesh = root.children[0] as THREE.Mesh;
  expect(smoothGameModelByAngle(root, '/ver.noforce.html')).toBe(0);
  expect(mesh.geometry.getAttribute('normal')).toBeUndefined();
  expect((mesh.material as THREE.MeshStandardMaterial).flatShading).toBe(true);
});
