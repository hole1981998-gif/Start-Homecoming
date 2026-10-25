import * as THREE from 'three';
import { movingBalance } from '../config';
import { createCar7Art } from './car7';
import { createPersonArt, type PersonArt } from './people';
import { markGameplayAccentTarget } from './storm-lighting';

export interface MovingArt {
  root: THREE.Group;
  sockets: Record<string, THREE.Object3D>;
  setState: (state: 'normal' | 'stunned' | 'damaged') => void;
  dispose: () => void;
}
const mat = (color: string, metalness = 0) => new THREE.MeshStandardMaterial({
  color, roughness: .76, metalness, flatShading: true, side: THREE.DoubleSide,
});
function box(parent: THREE.Object3D, name: string, dims: [number, number, number],
  pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dims), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function point(parent: THREE.Object3D, name: string, pos: [number, number, number]) {
  const node = new THREE.Object3D(); node.name = name; node.position.set(...pos); parent.add(node); return node;
}
function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(obj => { if (obj instanceof THREE.Mesh) {
    geometries.add(obj.geometry);
    (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
  } });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

/** The train is finite and rotated onto the world X crossing axis; root bounds match 24 × 2.8 m. */
export function createTrainArt(direction: -1 | 1 = 1, lod: 'near' | 'far' = 'near'): MovingArt {
  const root = new THREE.Group(); root.name = `haz_train_${direction}_${lod}`;
  const train = new THREE.Group(); train.name = 'train_body';
  // The authored nose is mirrored into output +Z, then +Z is aimed along the crossing velocity.
  train.scale.z = -1; train.rotation.y = direction * Math.PI / 2; root.add(train);
  const total = movingBalance.trainWidth, depth = movingBalance.trainDepth;
  const shell = mat('#c69b67'), roof = mat('#385f6b'), window = mat('#95c6c8', .05);
  const dark = mat('#243b43'), lamp = mat('#ffe1a1'), red = mat('#cb6551');
  const lengths = [5.4, 8.8, 8.8], centers = [-9.2, -2.1, 7.2];
  lengths.forEach((length, i) => {
    const z = centers[i], carriage = new THREE.Group();
    carriage.name = i === 0 ? 'locomotive' : `carriage_${i}`;
    carriage.position.z = z; train.add(carriage);
    box(carriage, `shell_${i}`, [depth * .90, 2.12, length - .08], [0, 1.36, 0], shell);
    box(carriage, `roof_${i}`, [depth * .98, .22, length - .05], [0, 2.53, 0], roof);
    box(carriage, `undercarriage_${i}`, [depth * .82, .22, length - .08], [0, .40, 0], dark);
    const count = lod === 'near' ? (i === 0 ? 2 : 4) : 2;
    for (const side of [-1, 1]) for (let n = 0; n < count; n++) {
      const offset = (n / count - .5 + .5 / count) * (length - .8);
      box(carriage, `window_${i}_${side}_${n}`, [.025, .64, Math.min(1.28, length / (count + .35))],
        [side * depth * .456, 1.72, offset], window);
    }
    for (const end of [-1, 1]) {
      const bogie = new THREE.Group(); bogie.name = `bogie_${i}_${end}`;
      bogie.position.set(0, .30, end * (length * .32)); carriage.add(bogie);
      for (const side of [-1, 1]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .12, lod === 'near' ? 10 : 6), dark);
        wheel.name = `wheel_${i}_${end}_${side}`; wheel.rotation.z = Math.PI / 2;
        wheel.position.x = side * depth * .37; bogie.add(wheel);
      }
    }
    if (i < 2) box(train, `coupler_${i}`, [.42, .14, .48], [0, .39, z + length / 2 + .15], dark);
  });
  // The front and tail stay legible whichever direction the crossing starts from.
  box(train, 'nose', [depth * .75, 1.52, .38], [0, 1.13, -11.92], roof);
  for (const side of [-1, 1]) {
    box(train, `headlamp_${side}`, [.24, .22, .035], [side * .65, 1.31, -12.10], lamp);
    box(train, `tail_lamp_${side}`, [.19, .18, .035], [side * .65, 1.27, 11.96], red);
  }
  const damaged = new THREE.Group(); damaged.name = 'damaged_overlay'; train.add(damaged);
  box(damaged, 'soot', [1.28, .37, .03], [0, 1.15, -12.13], dark);
  const sockets = { front: point(train, 'front_socket', [0, 1.1, -12]),
    rear: point(train, 'rear_socket', [0, 1.1, 12]),
    crossing_contact: point(root, 'crossing_contact', [0, 0, 0]) };
  const setState = (state: 'normal' | 'stunned' | 'damaged') => { damaged.visible = state === 'damaged'; };
  setState('normal');
  root.userData = { id: 'veh_train_A', axes: '+Y up, +Z forward; crossing along world X',
    widthM: total, lengthM: depth, finite: true, collisionRole: 'reference-only',
    motionSource: 'crossMotion', crossingSeconds: movingBalance.trainCrossSeconds };
  markGameplayAccentTarget(root);
  return { root, sockets, setState, dispose: () => disposeTree(root) };
}

/** Car7 master with service livery; gameplay keeps car7 HP, dimensions and speed. */
export function createAmbulanceArt(lod: 'near' | 'far' = 'near'): MovingArt {
  const base = createCar7Art(lod); base.setPaint('#e7eee3');
  const root = base.root; root.name = `veh_ambulance_${lod}`;
  const red = mat('#e0524d'), white = mat('#f1ede0'), dark = mat('#34515d');
  const service = new THREE.Group(); service.name = 'ambulance_service'; base.body.add(service);
  box(service, 'roof_beacon_base', [.78, .09, .36], [0, 1.86, .24], dark);
  for (const side of [-1, 1]) box(service, `beacon_${side}`,
    [.28, .15, .29], [side * .21, 1.98, .24], red);
  for (const side of [-1, 1]) {
    box(service, `medical_side_bar_${side}`, [.025, .13, 1.17],
      [side * 1.042, 1.02, -.48], red);
    box(service, `cross_side_vertical_${side}`, [.026, .36, .13],
      [side * 1.049, 1.12, -.95], red);
    box(service, `cross_side_horizontal_${side}`, [.026, .11, .36],
      [side * 1.052, 1.12, -.95], red);
  }
  box(service, 'rear_medical_vertical', [.12, .32, .027], [0, 1.02, -2.39], red);
  box(service, 'rear_medical_horizontal', [.31, .10, .028], [0, 1.02, -2.395], red);
  box(service, 'rear_light_strip', [.45, .065, .02], [0, 1.60, -2.39], white);
  const damage = new THREE.Group(); damage.name = 'service_damage'; service.add(damage);
  box(damage, 'darkened_panel', [.31, .23, .02], [.45, 1.14, -2.4], dark);
  const sockets = { ...base.sockets, beacon: point(service, 'beacon_socket', [0, 2.04, .24]) };
  const setState = (state: 'normal' | 'stunned' | 'damaged') => {
    damage.visible = state === 'damaged';
    base.setPaint(state === 'damaged' ? '#929b99' : '#e7eee3');
    base.setCondition(state === 'damaged' ? 'damaged' : 'clean');
  };
  setState('normal');
  root.userData = { ...root.userData, id: 'veh_ambulance_A', serviceRole: 'ambulance',
    widthM: 2.08, lengthM: 4.8, collisionRole: 'reference-only' };
  markGameplayAccentTarget(root);
  return { root, sockets, setState, dispose: () => base.dispose() };
}

export function createOfficerArt(kind: 'police' | 'militia', lod: 'near' | 'far' = 'near'): MovingArt {
  const person: PersonArt = createPersonArt('worker', lod);
  const root = person.root; root.name = `chr_${kind}_${lod}`;
  const civilianBag = root.getObjectByName('carried_bag');
  const civilianStrap = root.getObjectByName('bag_strap');
  if (civilianBag) civilianBag.visible = false;
  if (civilianStrap) civilianStrap.visible = false;
  const uniformColor = kind === 'police' ? '#dfbb70' : '#98a478';
  root.traverse(obj => { if (obj instanceof THREE.Mesh &&
    (obj.name.startsWith('coat_') || obj.name.startsWith('rain_fold_') || obj.name.startsWith('upper_arm_') ||
      obj.name.startsWith('forearm_'))) (obj.material as THREE.MeshStandardMaterial).color.set(uniformColor);
  });
  if (kind === 'police') {
    const trousers = root.getObjectByName('pants_pelvis') as THREE.Mesh;
    (trousers.material as THREE.MeshStandardMaterial).color.set('#cfaa63');
  }
  const cap = mat(kind === 'police' ? '#ad8c4a' : '#64734d');
  box(person.sockets.head.parent!, kind === 'police' ? 'police_cap' : 'militia_wide_hat',
    kind === 'police' ? [.43, .08, .29] : [.58, .055, .47], [0, .07, .08], cap);
  if (kind === 'police') {
    box(root.getObjectByName('torso_pivot')!, 'police_chest_badge', [.11, .07, .027],
      [.12, .44, .18], mat('#a44d43'));
  } else {
    box(root.getObjectByName('torso_pivot')!, 'militia_crossbody_strap', [.055, .62, .025],
      [.04, .31, .19], mat('#d6c087')).rotation.z = -.45;
    box(root, 'militia_side_bag', [.21, .29, .15], [.27, .63, -.06], cap);
  }
  const mark = new THREE.Group(); mark.name = 'stunned_mark'; root.add(mark);
  box(mark, 'small_mark', [.23, .13, .16], [0, 1.97, 0], mat('#d9b568'));
  const setState = (state: 'normal' | 'stunned' | 'damaged') => {
    mark.visible = state === 'stunned';
    person.setPose(state === 'stunned' ? 'recover' : 'stand');
  };
  setState('normal');
  root.userData = { ...root.userData, id: `chr_${kind}_A`, collisionRole: 'reference-only',
    npcWidthM: movingBalance.npcWidth, npcDepthM: movingBalance.npcDepth,
    motionSource: 'crossMotion' };
  markGameplayAccentTarget(root);
  return { root, sockets: person.sockets, setState, dispose: () => disposeTree(root) };
}

/** One cart silhouette spans the existing 1.8 × 2.1 m vendor footprint. */
export function createVendorArt(lod: 'near' | 'far' = 'near'): MovingArt {
  const root = new THREE.Group(); root.name = `haz_vendor_${lod}`;
  const wood = mat('#9c7250'), canvas = mat('#c8915e'), dark = mat('#294950');
  const fruit = mat('#de9956');
  box(root, 'cart_tray', [1.5, .18, 1.25], [0, .78, .19], wood);
  box(root, 'cart_lower', [1.24, .53, .98], [0, .46, .19], canvas);
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.23, .23, .11, 8), dark);
    wheel.name = `cart_wheel_${side}`; wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * .68, .28, -.05); root.add(wheel);
    box(root, `cart_handle_${side}`, [.07, .07, .62], [side * .52, .85, -.72], wood);
  }
  if (lod === 'near') for (const x of [-.38, 0, .38])
    box(root, `goods_${x}`, [.29, .18, .28], [x, .98, .18], fruit);
  const seller = createPersonArt('worker', lod);
  seller.root.name = 'vendor_person'; seller.root.scale.setScalar(.82);
  seller.root.position.set(0, 0, -.68); root.add(seller.root);
  const damaged = new THREE.Group(); damaged.name = 'vendor_damage'; root.add(damaged);
  box(damaged, 'fallen_goods', [.38, .13, .32], [.54, .14, .82], fruit);
  const setState = (state: 'normal' | 'stunned' | 'damaged') => {
    seller.setPose(state === 'stunned' ? 'recover' : 'stand');
    damaged.visible = state === 'damaged';
  };
  setState('normal');
  root.userData = { id: 'haz_vendor_A', axes: '+Y up, +Z forward',
    widthM: movingBalance.vendorWidth, lengthM: movingBalance.vendorLength,
    motionSource: 'crossMotion', collisionRole: 'reference-only' };
  markGameplayAccentTarget(root);
  return { root, sockets: { contact: point(root, 'contact', [0, 0, 0]) },
    setState, dispose: () => disposeTree(root) };
}
