import * as THREE from 'three';
import { vehicleIndicatorSide, vehicleLampSignal } from './vehicle-effects';

/** Light the authored lens areas, keeping paint/plates/reflectors independent. */
export function bindVehicleLampMaterials(art: { root: THREE.Group; trailer?: THREE.Group; dispose: () => void }) {
  const head = new THREE.MeshBasicMaterial({ toneMapped: false });
  const tail = new THREE.MeshBasicMaterial({ toneMapped: false });
  const left = new THREE.MeshBasicMaterial({ toneMapped: false });
  const right = new THREE.MeshBasicMaterial({ toneMapped: false });
  const originals: Array<{ mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }> = [];
  const roots = [art.root];
  if (art.trailer && !art.root.getObjectById(art.trailer.id)) roots.push(art.trailer);
  for (const root of roots) root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const name = object.name;
    let material: THREE.Material | undefined;
    if (/^headlamp_-?\d+$/.test(name) || name === 'headlamp_lens' || name === 'front_lamp') material = head;
    else if (/^(tail_outer_|tail_column_|tail_-?\d|rear_lamp_)/.test(name) || name === 'tail_lamp') material = tail;
    else if (/^(front_indicator_|rear_indicator_|turn_front_|tail_upper_|tail_clear_)/.test(name))
      material = vehicleIndicatorSide(object.position.x) === 'left' ? left : right;
    if (!material) return;
    originals.push({ mesh: object, material: object.material });
    object.material = material;
  });
  const baseDispose = art.dispose;
  art.dispose = () => {
    for (const original of originals) original.mesh.material = original.material;
    baseDispose();
    for (const material of [head, tail, left, right]) material.dispose();
  };
  const update = (braking: boolean, turn: 'left' | 'right' | null,
    seconds: number, reduced: boolean, hazard: boolean, wrecked: boolean) => {
    head.color.set(wrecked ? '#343d3a' : '#fff0c9').multiplyScalar(wrecked ? 1 : 1.6);
    tail.color.set(wrecked ? '#361c1a' : braking ? '#ff2718' : '#d84e36').multiplyScalar(wrecked ? 1 : braking ? 1.2 : .7);
    for (const [side, material] of [['left', left], ['right', right]] as const) {
      const on = !wrecked && vehicleLampSignal(`indicator_${side}`, false, turn, seconds, reduced, hazard);
      material.color.set(on ? '#ff9b22' : '#49351f').multiplyScalar(on ? 1.1 : 1);
    }
  };
  update(false, null, 0, false, false, false);
  return { update };
}
