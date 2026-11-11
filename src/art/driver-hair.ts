import * as THREE from 'three';

/** A short rear hair shape that follows the driver's head under the helmet. */
export function addDriverBackHair(head: THREE.Object3D, centerY = 0, scale = 1): void {
  const hair = new THREE.Group();
  hair.name = 'driver_back_hair';
  hair.position.y = centerY;
  hair.scale.setScalar(scale);
  const dark = new THREE.MeshStandardMaterial({ color: '#342d2b', roughness: .92, flatShading: true });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(.21, 10, 7), dark);
  crown.name = 'back_hair_crown';
  crown.scale.set(.88, .78, .52);
  crown.position.set(0, -.015, -.19);
  hair.add(crown);
  for (const [index, x, length] of [[0, -.11, .14], [1, 0, .18], [2, .11, .15]] as const) {
    const lock = new THREE.Mesh(new THREE.ConeGeometry(.052, length, 5), dark);
    lock.name = `back_hair_lock_${index}`;
    lock.rotation.z = Math.PI;
    lock.position.set(x, -.13, -.205);
    hair.add(lock);
  }
  head.add(hair);
}
