import * as THREE from 'three';
import { createPersonArt, type PersonArt } from './people';
import { roadsideArchetype } from './runtime-people';

interface MountedPerson { id: string; art: PersonArt }
const mounted = new WeakMap<THREE.Group, MountedPerson>();
/** Reuse the finished roadside cast at the window; no primitive fallback heads. */
export function updateWindowPassenger(wrapper: THREE.Group, riderId: string, time: number): void {
  let person = mounted.get(wrapper);
  if (!person || person.id !== riderId) {
    if (person) { wrapper.remove(person.art.root); person.art.dispose(); }
    const art = createPersonArt(roadsideArchetype(riderId), 'far');
    art.setPose('seated');
    art.root.scale.setScalar(.85);
    art.root.traverse(node => {
      if (node instanceof THREE.Mesh) node.castShadow = false;
      if (node.name.startsWith('hip_leg_') || node.name === 'pants_pelvis') node.visible = false;
    });
    art.root.updateMatrixWorld(true);
    const head = art.root.getObjectByName('head_pivot')!;
    const headY = head.getWorldPosition(new THREE.Vector3()).y;
    art.root.position.y = .13 - headY;
    wrapper.add(art.root); person = { id: riderId, art }; mounted.set(wrapper,person);
  }
  person.art.setPose('seated', time * .4 % 1);
}
