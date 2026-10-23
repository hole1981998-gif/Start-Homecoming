import * as THREE from 'three';
import type { VehicleArt } from './vehicle-catalog';

/** Art faces local +Z; the current pathPose/game renderer drives towards world -Z. */
export function attachVehicleArtToPrototype(parent: THREE.Object3D, art: VehicleArt): void {
  parent.add(art.root);
  art.root.position.set(0, 0, 0);
  art.root.rotation.set(0, Math.PI, 0);
  art.root.scale.set(1, 1, 1);
}
