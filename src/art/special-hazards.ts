import * as THREE from 'three';
import { createCar4Art } from './car4';
import { markGameplayAccentTarget } from './storm-lighting';

export interface SpecialArt { root: THREE.Group; dispose: () => void }
const mat = (color: string) => new THREE.MeshStandardMaterial({
  color, roughness: .85, flatShading: true, side: THREE.DoubleSide,
});
function box(parent: THREE.Object3D, name: string, size: [number, number, number],
  pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(obj => { if (obj instanceof THREE.Mesh) {
    geometries.add(obj.geometry);
    (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
  } });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

/** Reuses two car4 masters; the existing 6.2 × 5 m accident collider remains authoritative. */
export function createAccidentArt(lod: 'near' | 'far' = 'near'): SpecialArt {
  const root = new THREE.Group(); root.name = `haz_accident_${lod}`;
  const left = createCar4Art(lod), right = createCar4Art(lod);
  left.setPaint('#a17869'); right.setPaint('#748e93');
  left.setCondition('destroyed'); right.setCondition('damaged');
  left.root.name = 'accident_left_car'; right.root.name = 'accident_right_car';
  left.root.position.set(-1.05, .01, -.09); right.root.position.set(1.04, .01, .11);
  left.root.rotation.y = .22; right.root.rotation.y = -.22;
  root.add(left.root, right.root);
  const dark = mat('#4b4a46'), metal = mat('#9a9e97');
  if (lod === 'near') for (const [i, x, z] of [[0, -.16, -.60], [1, .35, .32], [2, -.46, .59]] as const)
    box(root, `debris_${i}`, [.20, .045, .13], [x, .03, z], i === 1 ? metal : dark).rotation.y = i * .43;
  root.userData = { id: 'haz_accident_A', axes: '+Y up, +Z forward',
    widthM: 6.2, lengthM: 5, collisionRole: 'reference-only', terminal: true,
    source: 'two reused car4 masters' };
  markGameplayAccentTarget(root);
  return { root, dispose: () => disposeTree(root) };
}

/** One essential shop silhouette; the simulation's interaction point stays unchanged. */
export function createShopArt(lod: 'near' | 'far' = 'near'): SpecialArt {
  const root = new THREE.Group(); root.name = `srv_shop_${lod}`;
  // Keep the service point compact beside the road; its simulation reach is unchanged.
  root.scale.set(.86, .91, .77);
  const plaster = mat('#718986'), trim = mat('#385a62'), roof = mat('#925e48');
  const wood = mat('#806e59'), glass = mat('#3f6770'), warm = mat('#f2c37c');
  warm.emissive.set('#c97938'); warm.emissiveIntensity = .19;
  box(root, 'shop_plaster', [3.36, 2.6, 3.9], [0, 1.30, -.2], plaster);
  box(root, 'shop_roof', [3.78, .16, 4.34], [0, 2.68, -.18], roof);
  for (const side of [-1, 1])
    box(root, `pitched_tin_roof_${side}`, [2.0, .13, 4.33],
      [side * .92, 2.96, -.18], roof).rotation.z = -side * .25;
  box(root, 'shop_front_recess', [2.78, 1.90, .025], [0, 1.31, 1.765], trim);
  box(root, 'open_shop_front', [2.48, 1.55, .035], [0, 1.31, 1.77], glass);
  box(root, 'shop_front_lintel', [2.92, .15, .16], [0, 2.15, 1.84], trim);
  box(root, 'service_counter', [2.76, .81, .54], [0, .48, 1.98], wood);
  box(root, 'rain_awning', [3.73, .11, 1.15], [0, 2.58, 2.23], roof).rotation.x = -.10;
  box(root, 'rain_awning_valance', [3.65, .28, .09], [0, 2.37, 2.78], warm);
  for (const side of [-1, 1]) {
    box(root, `front_post_${side}`, [.16, 2.56, .16], [side * 1.58, 1.28, 1.82], trim);
    box(root, `repair_sign_post_${side}`, [.07, .64, .08], [side * .32, 2.90, 2.16], trim);
    // Runtime turns the service point toward the verge. The driver approaches
    // along the road, so either side wall can be the first visible face.
    box(root, `side_service_window_${side}`, [.055, 1.12, 1.62],
      [side * 1.715, 1.02, -.22], glass);
    box(root, `side_service_sign_${side}`, [.07, .67, 1.42],
      [side * 1.73, 2.05, -.20], warm);
    box(root, `side_cross_vertical_${side}`, [.09, .39, .12],
      [side * 1.78, 2.05, -.20], trim);
    box(root, `side_cross_horizontal_${side}`, [.09, .12, .45],
      [side * 1.78, 2.05, -.20], trim);
  }
  box(root, 'repair_sign', [1.10, .50, .10], [0, 3.17, 2.16], warm);
  box(root, 'repair_cross_vertical', [.08, .31, .014], [0, 3.17, 2.22], trim);
  box(root, 'repair_cross_horizontal', [.27, .08, .014], [0, 3.17, 2.23], trim);
  if (lod === 'near') {
    box(root, 'waterline_stain', [3.37, .22, 3.92], [0, .12, -.2], trim);
    box(root, 'counter_toolbox', [.48, .24, .29], [-.77, .98, 1.91], trim);
  }
  root.userData = { id: 'srv_shop_A', axes: '+Y up, +Z forward', collisionRole: 'decorative-service',
    interactionSource: 'existing shop entity; place on verge, no new transaction timer' };
  return { root, dispose: () => disposeTree(root) };
}
