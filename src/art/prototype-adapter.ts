import * as THREE from 'three';
import type { VehicleArt } from './vehicle-catalog';
import type { createUtilityVehicleArt } from './utility-vehicles';

/** Art faces local +Z; the current pathPose/game renderer drives towards world -Z. */
export function attachVehicleArtToPrototype(parent: THREE.Object3D, art: VehicleArt): void {
  parent.add(art.root);
  art.root.position.set(0, 0, 0);
  art.root.rotation.set(0, Math.PI, 0);
  art.root.scale.set(1, 1, 1);
}

/** Reuse the container master with the two existing gameplay physics poses. */
export function attachArticulatedContainerArt(tractorFrame: THREE.Object3D,
  trailerFrame: THREE.Object3D, art: ReturnType<typeof createUtilityVehicleArt>): void {
  if (!art.tractor || !art.trailer) throw new Error('Container art needs tractor and trailer groups');
  const tractorBounds = new THREE.Box3().setFromObject(art.tractor);
  const trailerBounds = new THREE.Box3().setFromObject(art.trailer);
  const tractorCenter = (tractorBounds.min.z + tractorBounds.max.z) / 2;
  const trailerCenter = (trailerBounds.min.z + trailerBounds.max.z) / 2;
  attachVehicleArtToPrototype(tractorFrame, art);
  art.root.position.z = tractorCenter;

  const trailerVisual = new THREE.Group();
  trailerVisual.name = 'player_container_trailer_visual';
  trailerVisual.rotation.y = Math.PI;
  trailerVisual.position.z = trailerCenter;
  trailerFrame.add(trailerVisual);
  trailerVisual.add(art.trailer);
  for (const name of ['used_surface', 'damaged_panels', 'destroyed_panels']) {
    const overlay = art.root.getObjectByName(name);
    if (overlay) trailerVisual.add(overlay);
  }
  for (const name of ['cargo_drop', 'contact_spark_rear']) {
    const socket = art.sockets[name];
    if (socket) trailerVisual.add(socket);
  }
  const disposeMaster = art.dispose;
  art.dispose = () => {
    for (const child of [...trailerVisual.children]) art.root.add(child);
    trailerVisual.removeFromParent();
    disposeMaster();
  };
}
