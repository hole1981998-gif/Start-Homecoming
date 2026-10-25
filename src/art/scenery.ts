import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { balance } from '../config';
import type { LandscapeKind } from '../landscape';

export interface SceneryArt {
  root: THREE.Group;
  setVisualTime?: (elapsedSeconds: number) => void;
  dispose: () => void;
}
const mat = (color: string) => new THREE.MeshStandardMaterial({
  color, roughness: .88, flatShading: true, side: THREE.DoubleSide,
});
function box(parent: THREE.Object3D, name: string, size: [number, number, number],
  pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function batchStaticMeshes(root: THREE.Group, prefix = 'material_batch') {
  root.updateMatrixWorld(true);
  const toLocal = root.matrixWorld.clone().invert();
  const buckets = new Map<string, { material: THREE.MeshStandardMaterial;
    meshes: THREE.Mesh[]; geometries: THREE.BufferGeometry[] }>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh ||
      Array.isArray(object.material) || !(object.material instanceof THREE.MeshStandardMaterial) ||
      object.material.map || object.material.transparent) return;
    const material = object.material;
    const key = [material.color.getHexString(), material.roughness, material.metalness,
      material.flatShading, material.side].join('_');
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material, meshes: [], geometries: [] };
      buckets.set(key, bucket);
    }
    const transformed = object.geometry.clone();
    transformed.applyMatrix4(toLocal.clone().multiply(object.matrixWorld));
    const geometry = transformed.index ? transformed.toNonIndexed() : transformed;
    if (geometry !== transformed) transformed.dispose();
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    if (!geometry.getAttribute('uv')) geometry.setAttribute('uv',
      new THREE.Float32BufferAttribute(new Array(geometry.getAttribute('position').count * 2).fill(0), 2));
    bucket.meshes.push(object);
    bucket.geometries.push(geometry);
  });
  for (const [key, bucket] of buckets) {
    if (bucket.meshes.length < 2) {
      bucket.geometries.forEach(geometry => geometry.dispose());
      continue;
    }
    const merged = mergeGeometries(bucket.geometries);
    bucket.geometries.forEach(geometry => geometry.dispose());
    if (!merged) continue;
    const originalGeometry = new Set(bucket.meshes.map(mesh => mesh.geometry));
    const originalMaterials = new Set(bucket.meshes.flatMap(mesh =>
      Array.isArray(mesh.material) ? mesh.material : [mesh.material]));
    bucket.meshes.forEach(mesh => mesh.removeFromParent());
    originalGeometry.forEach(geometry => geometry.dispose());
    const orphanMaterials = (root.userData.batchOrphanMaterials ??= []) as THREE.Material[];
    originalMaterials.forEach(material => orphanMaterials.push(material));
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.name = `${prefix}_${key}`;
    root.add(mesh);
  }
}
/** Merge static detail per top-level prop, preserving building/tree roots for placement. Call before placing the cluster. */
export function optimizeNearScenery(root: THREE.Group): void {
  if (root.userData.lod !== 'near' || root.userData.optimized) return;
  for (const child of root.children) if (child instanceof THREE.Group)
    batchStaticMeshes(child, 'near_material_batch');
  root.userData.optimized = true;
}
function taper(parent: THREE.Object3D, name: string, top: number, bottom: number,
  height: number, pos: [number, number, number], material: THREE.Material, sides = 6) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function roof(parent: THREE.Object3D, name: string, width: number, length: number,
  y: number, material: THREE.Material) {
  const shape = new THREE.BufferGeometry();
  const x = width / 2, z = length / 2, e = .42;
  const tris = [
    [-x, y, -z], [0, y + e, -z], [-x, y, z], [0, y + e, -z], [0, y + e, z], [-x, y, z],
    [0, y + e, -z], [x, y, -z], [0, y + e, z], [x, y, -z], [x, y, z], [0, y + e, z],
  ].flat(2);
  shape.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3)); shape.computeVertexNormals();
  const mesh = new THREE.Mesh(shape, material); mesh.name = name; parent.add(mesh); return mesh;
}
function house(parent: THREE.Object3D, name: string, x: number, z: number, width: number,
  floors: 1 | 2, palette: 'warm' | 'cool' | 'ochre', near: boolean,
  use: 'home' | 'shop' = 'home') {
  const root = new THREE.Group(); root.name = name; root.position.set(x, 0, z); parent.add(root);
  const wall = mat(palette === 'warm' ? '#e4c79d' : palette === 'cool' ? '#a7c6ba' : '#d7a76d');
  const trim = mat(palette === 'warm' ? '#9b6c55' : palette === 'cool' ? '#567c78' : '#a86048');
  const roofMat = mat(palette === 'warm' ? '#ad6c54' : palette === 'cool' ? '#507c84' : '#934e46');
  const glass = mat('#426b75'), wood = mat('#845e44'), flood = mat('#8a8977');
  const lit = mat('#f1c578'), shade = mat('#394e50'), frame = mat('#f0dfb8');
  const height = floors === 2 ? 5.8 : 3.25;
  box(root, 'plaster', [width, height, 4.3], [0, height / 2, 0], wall);
  box(root, 'plinth', [width + .08, .34, 4.35], [0, .17, 0], trim);
  box(root, 'flood_stain', [width + .095, .12, 4.37], [0, .22, 0], flood);
  if (use === 'shop') {
    box(root, 'shop_roof_terrace', [width + .3, .16, 4.65], [0, height + .08, 0], roofMat);
    for (const side of [-1, 1])
      box(root, `shop_roof_side_parapet_${side}`, [.19, .66, 4.76],
        [side * (width / 2 + .07), height + .42, 0], trim);
    box(root, 'shop_roof_front_parapet', [width + .43, .62, .19],
      [0, height + .40, 2.37], trim);
    box(root, 'shop_roof_rear_parapet', [width + .43, .36, .19],
      [0, height + .25, -2.37], trim);
    box(root, 'shop_corner_tower', [width * .28, 1.02, .75],
      [-width * .34, height + .59, 1.92], wall);
    box(root, 'shop_corner_tower_cap', [width * .32, .16, .88],
      [-width * .34, height + 1.15, 1.92], roofMat);
  } else {
    roof(root, 'pitched_sheet_roof', width + .5, 4.8, height + .08, roofMat);
    box(root, 'roof_ridge', [.11, .08, 4.85], [0, height + .49, 0], trim);
    box(root, 'roof_eave_front', [width + .55, .09, .13], [0, height + .10, 2.36], trim);
  }
  box(root, 'front_door_recess', [1.08, 2.24, .025], [-width * .18, 1.13, 2.165], shade);
  box(root, 'front_door', [.88, 2.08, .045], [-width * .18, 1.06, 2.19], use === 'shop' ? lit : wood);
  box(root, 'door_lintel', [1.16, .12, .15], [-width * .18, 2.29, 2.24], trim);
  box(root, 'front_window_shadow', [1.12, .98, .025], [width * .23, 1.79, 2.165], shade);
  box(root, 'front_window', [.93, .79, .045], [width * .23, 1.79, 2.19], glass);
  for (const x of [-.55, .55]) box(root, `facade_pier_${x}`, [.11, height - .36, .16],
    [x * (width - .28), (height + .36) / 2, 2.19], trim);
  box(root, 'front_cornice', [width + .13, .12, .22], [0, height - .13, 2.2], trim);
  for (const side of [-1, 1]) {
    box(root, `side_window_recess_${side}`, [.025, .91, 1.04],
      [side * (width / 2 + .020), 1.91, -.35], shade);
    box(root, `side_window_${side}`, [.045, .72, .88],
      [side * (width / 2 + .045), 1.91, -.35], glass);
    box(root, `side_window_sill_${side}`, [.12, .07, 1.03],
      [side * (width / 2 + .06), 1.51, -.35], trim);
    box(root, `corner_column_${side}`, [.13, height - .35, .16],
      [side * (width / 2 + .02), (height + .35) / 2, -2.08], trim);
    if (floors === 2) {
      box(root, `upper_side_shadow_${side}`, [.025, .97, .96],
        [side * (width / 2 + .020), 4.32, -.52], shade);
      box(root, `upper_side_window_${side}`, [.045, .78, .77],
        [side * (width / 2 + .045), 4.32, -.52], glass);
      box(root, `upper_side_sill_${side}`, [.12, .065, .89],
        [side * (width / 2 + .06), 3.91, -.52], frame);
    }
  }
  box(root, 'rear_service_door_recess', [.91, 1.96, .03], [-width * .17, 1.00, -2.17], shade);
  box(root, 'rear_service_door', [.74, 1.79, .045], [-width * .17, .92, -2.20], wood);
  box(root, 'rear_window_recess', [.96, .90, .025], [width * .24, 1.85, -2.17], shade);
  box(root, 'back_window', [.78, .70, .045], [width * .24, 1.85, -2.20], glass);
  box(root, 'back_window_sill', [1.03, .07, .17], [width * .24, 1.43, -2.26], frame);
  if (floors === 2) {
    box(root, 'rear_upper_window_recess', [width * .43, .98, .025], [0, 4.25, -2.17], shade);
    box(root, 'rear_upper_window', [width * .36, .83, .045], [0, 4.25, -2.20], glass);
    box(root, 'rear_upper_lintel', [width * .48, .11, .18], [0, 4.80, -2.20], trim);
  }
  box(root, 'front_awning', [width * .85, .10, 1.22], [0, 2.49, 2.70], use === 'shop' ? lit : roofMat).rotation.x = -.11;
  box(root, 'awning_valance', [width * .85, .25, .045], [0, 2.29, 3.27], use === 'shop' ? trim : roofMat);
  for (const side of [-1, 1]) box(root, `awning_brace_${side}`, [.07, .54, .07],
    [side * width * .36, 2.17, 2.92], trim);
  if (floors === 2) {
    box(root, 'upper_window_frame', [width * .50, 1.15, .07], [0, 4.36, 2.19], frame);
    box(root, 'upper_window', [width * .43, .97, .045], [0, 4.36, 2.24], glass);
    box(root, 'balcony_slab', [width * .78, .13, .78], [0, 3.46, 2.45], trim);
    box(root, 'balcony_rail', [width * .77, .07, .07], [0, 4.03, 2.82], trim);
    for (const x of [-.32, 0, .32]) box(root, `balcony_baluster_${x}`, [.055, .43, .055],
      [x * width, 3.78, 2.82], trim);
  }
  if (near) {
    box(root, 'gutter', [.09, .10, 4.68], [width * .5, height + .09, 0], trim);
    box(root, 'window_sill', [1.09, .08, .18], [width * .23, 1.29, 2.25], trim);
    box(root, 'step', [1.2, .18, .6], [-width * .18, .09, 2.52], trim);
    box(root, 'rain_pipe', [.07, height + .02, .08],
      [width * .5 + .04, height / 2, -1.75], trim);
    box(root, 'rear_drain_line', [.055, height * .72, .065],
      [-width * .47, height * .36, -2.22], trim);
    box(root, 'back_storm_mark', [.39, .43, .012],
      [width * .39, .53, -2.205], flood);
    box(root, 'shutter', [.37, .81, .065], [width * .23 + .67, 1.79, 2.23], trim).rotation.y = -.38;
    box(root, 'door_handle', [.04, .04, .05], [-width * .18 + .29, 1.05, 2.23], frame);
    if (use === 'shop') {
      box(root, 'shop_sign_back', [width * .69, .40, .09], [0, 2.97, 2.23], trim);
      box(root, 'shop_sign_face', [width * .62, .30, .018], [0, 2.97, 2.285], lit);
      for (const x of [-.24, 0, .24]) box(root, `sign_symbol_${x}`, [.10, .11, .025],
        [x * width, 2.97, 2.30], shade);
      box(root, 'shop_warm_inner', [.73, .57, .06], [width * .23, 1.72, 2.25], lit);
    }
    const pot = mat('#b26c4c'), foliage = mat('#4d9860');
    for (const side of [-1, 1]) {
      const plant = new THREE.Group(); plant.name = `sheltered_planter_${side}`;
      plant.position.set(side * width * .39, 0, 2.64); root.add(plant);
      taper(plant, 'clay_pot', .21, .15, .29, [0, .20, 0], pot, 7);
      for (const lean of [-1, 0, 1]) {
        const leaf = taper(plant, `broad_leaf_${lean}`, .02, .17, .40,
          [lean * .12, .52, 0], foliage, 5);
        leaf.rotation.z = lean * .42;
      }
    }
  }
  return root;
}
function midrise(parent: THREE.Object3D, x: number, z: number, near: boolean,
  palette: number) {
  const root = new THREE.Group(); root.name = 'midrise_apartments';
  root.position.set(x, 0, z); parent.add(root);
  const wall = mat(['#d9ba93', '#b8c8b1', '#d2b3a4'][palette]);
  const trim = mat(['#815e55', '#627b70', '#815e66'][palette]);
  const glass = mat('#416b72'), shadow = mat('#384d50'), warm = mat('#e8bb74');
  box(root, 'midrise_main_mass', [5.7, 10.5, 5.0], [0, 5.25, 0], wall);
  box(root, 'midrise_stair_tower', [1.15, 11.55, 4.7], [-2.25, 5.78, -.12], trim);
  box(root, 'flat_roof_parapet', [6.1, .45, 5.45], [0, 10.65, 0], trim);
  box(root, 'rooftop_water_tank', [1.35, 1.08, 1.3], [1.45, 11.42, -.85], shadow);
  box(root, 'shop_ground_recess', [4.15, 2.2, .05], [.5, 1.3, 2.53], shadow);
  for (let floor = 0; floor < 3; floor++) {
    const y = 3.55 + floor * 2.37;
    box(root, `midrise_balcony_slab_${floor}`, [4.53, .16, .91], [.44, y - .96, 2.76], trim);
    box(root, `midrise_balcony_rail_${floor}`, [4.42, .08, .07], [.44, y - .13, 3.17], trim);
    for (const side of [-1, 1]) {
      const wx = .4 + side * 1.07;
      box(root, `midrise_window_recess_${floor}_${side}`, [1.48, 1.46, .04],
        [wx, y, 2.53], shadow);
      box(root, `midrise_window_${floor}_${side}`, [1.18, 1.19, .045],
        [wx, y, 2.58], floor === 1 && side === 1 ? warm : glass);
      box(root, `midrise_baluster_${floor}_${side}`, [.07, .67, .07],
        [wx, y - .49, 3.17], trim);
    }
    for (const side of [-1, 1]) {
      box(root, `midrise_side_recess_${floor}_${side}`, [.035, 1.43, 1.05],
        [side * 2.86, y, -.48], shadow);
      box(root, `midrise_side_window_${floor}_${side}`, [.05, 1.16, .84],
        [side * 2.89, y, -.48], glass);
      box(root, `midrise_side_sill_${floor}_${side}`, [.16, .075, 1.18],
        [side * 2.94, y - .67, -.48], trim);
    }
  }
  box(root, 'midrise_shop_window', [2.16, 1.72, .06], [.25, 1.31, 2.57], glass);
  box(root, 'midrise_shop_door', [.91, 2.03, .07], [1.78, 1.02, 2.57], warm);
  box(root, 'midrise_shop_awning', [4.55, .13, .93], [.32, 2.50, 2.84], trim);
  if (near) {
    for (let i = 0; i < 3; i++) box(root, `midrise_vertical_mullion_${i}`,
      [.055, 1.7, .045], [-.61 + i * .6, 1.31, 2.62], trim);
    box(root, 'roofline_antenna', [.04, 1.35, .04], [-1.8, 11.5, -.7], shadow);
    box(root, 'stairwell_window', [.055, 1.9, .72], [-2.85, 7.8, 0], warm);
  }
  return root;
}
function backlotBlock(parent: THREE.Object3D, x: number, z: number,
  style: 0 | 1 | 2, near: boolean) {
  const root = new THREE.Group(); root.name = `backlot_${style}`;
  root.position.set(x, 0, z); parent.add(root);
  const width = [6.3, 7.1, 5.7][style], depth = [5.8, 6.7, 6.2][style];
  const height = [7.1, 14.2, 9.3][style];
  const wall = mat(['#d0b789', '#9fc3ae', '#d3a783'][style]);
  const sideWall = mat(['#bd9f78', '#84ad9d', '#bf916e'][style]);
  const trim = mat(['#8e644e', '#567b71', '#9d5f51'][style]);
  const shade = mat('#354e53'), frame = mat('#dfd5b6');
  box(root, 'backlot_main', [width, height, depth], [0, height / 2, 0], wall);
  box(root, 'backlot_shaded_wing', [.24, height, depth + .08],
    [-width * .48, height / 2, 0], sideWall);
  box(root, 'backlot_plinth', [width + .12, .36, depth + .10],
    [0, .18, 0], trim);
  box(root, 'backlot_vertical_bay', [.25, height - .38, .12],
    [width * .38, (height + .38) / 2, depth / 2 + .05], trim);
  if (style === 0) {
    roof(root, 'backlot_pitched_roof', width + .48, depth + .48, height + .05, trim);
    box(root, 'backlot_roof_ridge', [.12, .08, depth + .50],
      [0, height + .50, 0], frame);
  } else {
    box(root, 'backlot_parapet', [width + .36, .38, depth + .30],
      [0, height + .17, 0], trim);
    box(root, 'backlot_roof_crown', [width * .58, .17, depth * .56],
      [0, height + .42, -.20], frame);
    box(root, 'backlot_water_tank', [style === 1 ? 1.3 : .84, .86, 1.05],
      [width * .24, height + .76, -.8], shade);
  }
  const floors = style === 1 ? 5 : style === 0 ? 2 : 3;
  const windowCount = floors * 2;
  const recesses = new THREE.InstancedMesh(new THREE.BoxGeometry(1.12, 1.25, .035),
    shade, windowCount);
  const windows = new THREE.InstancedMesh(new THREE.BoxGeometry(.91, 1.03, .045),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .38 }), windowCount);
  const rearRecesses = new THREE.InstancedMesh(new THREE.BoxGeometry(1.02, 1.13, .035),
    shade, windowCount);
  const rearWindows = new THREE.InstancedMesh(new THREE.BoxGeometry(.81, .92, .045),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .45 }), windowCount);
  recesses.name = 'backlot_window_recesses'; windows.name = 'backlot_windows';
  rearRecesses.name = 'backlot_rear_recesses'; rearWindows.name = 'backlot_rear_windows';
  const dummy = new THREE.Object3D();
  for (let floor = 0; floor < floors; floor++) {
    const y = 2.05 + floor * (style === 1 ? 2.55 : style === 0 ? 2.55 : 2.38);
    for (let column = 0; column < 2; column++) {
      const i = floor * 2 + column;
      const wx = (column ? 1 : -1) * width * .22;
      dummy.position.set(wx, y, depth / 2 + .025); dummy.updateMatrix();
      recesses.setMatrixAt(i, dummy.matrix);
      dummy.position.z += .035; dummy.updateMatrix(); windows.setMatrixAt(i, dummy.matrix);
      windows.setColorAt(i, new THREE.Color(floor === 1 && column === 0 ? '#e9bd78' : '#527e83'));
      dummy.position.set(wx, y, -depth / 2 - .025); dummy.updateMatrix();
      rearRecesses.setMatrixAt(i, dummy.matrix);
      dummy.position.z -= .035; dummy.updateMatrix(); rearWindows.setMatrixAt(i, dummy.matrix);
      rearWindows.setColorAt(i, new THREE.Color(floor === 0 && column === 1 ? '#d9b782' : '#55787c'));
    }
    if (near) {
      box(root, `backlot_floor_band_${floor}`, [width + .08, .085, .16],
        [0, y - .80, depth / 2 + .06], trim);
      box(root, `backlot_rear_floor_band_${floor}`, [width + .08, .075, .15],
        [0, y - .80, -depth / 2 - .06], trim);
      for (const side of [-1, 1]) {
        box(root, `backlot_side_recess_${floor}_${side}`, [.035, 1.03, .94],
          [side * (width / 2 + .02), y, -.70], shade);
        box(root, `backlot_side_window_${floor}_${side}`, [.055, .80, .76],
          [side * (width / 2 + .04), y, -.70], frame);
      }
    }
  }
  root.add(recesses, windows, rearRecesses, rearWindows);
  if (near) {
    box(root, 'backlot_door', [.91, 1.91, .055],
      [width * .25, .96, depth / 2 + .08], shade);
    box(root, 'backlot_canopy', [width * .62, .12, .91],
      [-width * .12, 2.80, depth / 2 + .43], trim);
    box(root, 'backlot_sign', [width * .45, .35, .055],
      [-width * .12, 2.96, depth / 2 + .11], frame);
    box(root, 'backlot_rear_service_door', [.94, 1.94, .06],
      [-width * .22, .97, -depth / 2 - .08], shade);
    box(root, 'backlot_rear_service_canopy', [1.32, .12, .60],
      [-width * .22, 2.06, -depth / 2 - .33], trim);
  }
  return root;
}
function wideStorefront(parent: THREE.Object3D, x: number, z: number, near: boolean,
  palette: number) {
  const root = new THREE.Group(); root.name = 'wide_storefront';
  root.position.set(x, 0, z); parent.add(root);
  const wall = mat(['#c89f78', '#b1c7ae', '#d2b592'][palette]);
  const trim = mat(['#a44f40', '#4f8278', '#9a6e54'][palette]);
  const shadow = mat('#354b51'), glass = mat('#60959a'), warm = mat('#edc77f');
  box(root, 'store_wide_mass', [8.2, 3.35, 4.3], [0, 1.68, 0], wall);
  box(root, 'store_roof_band', [8.6, .27, 4.65], [0, 3.45, 0], trim);
  roof(root, 'store_pitched_roof', 8.6, 4.65, 3.53, trim);
  box(root, 'store_signboard', [7.45, .53, .12], [0, 2.94, 2.27], trim);
  box(root, 'store_sign_inset', [6.67, .35, .02], [0, 2.94, 2.35], warm);
  for (const i of [-1, 0, 1]) {
    box(root, `store_glass_recess_${i}`, [1.72, 1.72, .035],
      [i * 2.14, 1.36, 2.18], shadow);
    box(root, `store_glass_${i}`, [1.53, 1.56, .045],
      [i * 2.14, 1.36, 2.22], i === 0 ? warm : glass);
    box(root, `store_awning_panel_${i}`, [2.35, .10, 1.37],
      [i * 2.35, 2.57, 2.67], i === 0 ? warm : trim).rotation.x = -.08;
    box(root, `store_awning_valance_${i}`, [2.35, .26, .06],
      [i * 2.35, 2.34, 3.31], i === 0 ? trim : warm);
  }
  for (const side of [-1, 1]) {
    box(root, `store_corner_pier_${side}`, [.25, 2.61, .21],
      [side * 3.91, 1.31, 2.22], trim);
    box(root, `store_side_loading_${side}`, [.055, 1.67, 1.35],
      [side * 4.13, 1.25, -.66], shadow);
    box(root, `store_side_window_${side}`, [.065, 1.19, 1.09],
      [side * 4.16, 1.31, -.66], glass);
    box(root, `store_side_shutter_${side}`, [.15, 1.47, .26],
      [side * 4.20, 1.31, .12], trim);
  }
  if (near) {
    for (let i = 0; i < 4; i++) box(root, `store_sign_glyph_${i}`,
      [.35, .15, .02], [-1.03 + i * .69, 2.94, 2.37], trim);
    box(root, 'shopfront_step', [7.4, .12, .51], [0, .06, 2.45], mat('#8f8270'));
  }
  return root;
}
function pocketPark(parent: THREE.Object3D, x: number, z: number, near: boolean,
  roadsideSide: -1 | 1) {
  const root = new THREE.Group(); root.name = 'pocket_park';
  root.position.set(x, 0, z); parent.add(root);
  const lawn = mat('#77a45c'), path = mat('#cfb990'), edge = mat('#8c8069');
  box(root, 'park_lawn', [7.5, .07, 7.7], [0, -.075, 0], lawn);
  box(root, 'park_path', [1.22, .02, 7.4], [-.3, -.027, 0], path);
  box(root, 'park_entrance', [2.1, .025, 1.37],
    [-roadsideSide * 2.93, -.025, 0], path);
  for (const side of [-1, 1]) {
    tree(root, `park_flowering_tree_${side}`, side * 2.34, side * 2.1,
      side < 0 ? 4.6 : 3.8, near, 'flowering');
    box(root, `park_bench_seat_${side}`, [1.42, .11, .45],
      [side * 1.9, .46, -side * 1.65], edge);
    box(root, `park_bench_back_${side}`, [1.42, .48, .09],
      [side * 1.9, .73, -side * 1.91], edge);
    for (const dx of [-.52, .52]) box(root, `bench_leg_${side}_${dx}`,
      [.075, .46, .08], [side * 1.9 + dx, .23, -side * 1.65], edge);
  }
  if (near) {
    box(root, 'park_low_wall', [7.8, .43, .24], [0, .16, -3.83], edge);
    box(root, 'park_lamp_post', [.08, 3.42, .08], [.4, 1.71, 2.6], edge);
    box(root, 'park_lamp', [.34, .34, .34], [.4, 3.45, 2.6], mat('#e6c78a'));
    const timber = mat('#9b7550'), trellis = mat('#c7a475');
    for (const px of [-2.15, -.55]) for (const pz of [-.45, 1.45])
      box(root, `pergola_post_${px}_${pz}`, [.13, 2.57, .13],
        [px, 1.28, pz], timber);
    for (let i = 0; i < 5; i++) box(root, `pergola_roof_slat_${i}`,
      [2.03, .09, .17], [-1.35, 2.62, -.48 + i * .48], trellis);
    const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0),
      mat('#e5b884'), 14);
    flowers.name = 'park_flower_border';
    const flower = new THREE.Object3D();
    for (let i = 0; i < 14; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      flower.position.set(side * (2.8 + (i % 3) * .13), .20,
        -3 + Math.floor(i / 2) * .89);
      flower.rotation.set(0, i * .7, 0);
      flower.scale.set(.16, .22 + i % 3 * .025, .15);
      flower.updateMatrix(); flowers.setMatrixAt(i, flower.matrix);
    }
    root.add(flowers);
  }
  return root;
}
function tree(parent: THREE.Object3D, name: string, x: number, z: number,
  height: number, near: boolean, species: 'rain' | 'palm' | 'flowering' = 'rain') {
  const root = new THREE.Group(); root.name = name; root.position.set(x, 0, z); parent.add(root);
  const bark = mat('#765b45'), leaf = mat('#397a55'), lighter = mat('#78a45c');
  const lightTip = mat('#a1ba66');
  if (species === 'palm') {
    const trunk = taper(root, 'leaning_palm_trunk', .10, .26, height * .86,
      [0, height * .43, 0], bark, 8);
    trunk.rotation.z = -.10;
    for (let i = 0; i < (near ? 8 : 6); i++) {
      const angle = i * Math.PI * 2 / (near ? 8 : 6);
      const radial = [Math.sin(angle), Math.cos(angle)];
      const sideways = [Math.cos(angle), -Math.sin(angle)];
      const at = (distance: number, spread: number, y: number): [number, number, number] =>
        [radial[0] * distance + sideways[0] * spread, y,
          radial[1] * distance + sideways[1] * spread];
      const start = at(0, 0, height * .89);
      const left1 = at(height * .15, height * .065, height * .94);
      const right1 = at(height * .15, -height * .065, height * .94);
      const left2 = at(height * .27, height * .047, height * .82);
      const right2 = at(height * .27, -height * .047, height * .82);
      const tip = at(height * .36, 0, height * .65);
      const points = [start, left1, right1, left1, left2, right1,
        right1, left2, right2, left2, tip, right2].flat(2);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
      geometry.computeVertexNormals();
      const frond = new THREE.Mesh(geometry, i % 3 === 0 ? lighter : leaf);
      frond.name = `palm_frond_${i}`;
      root.add(frond);
    }
    taper(root, 'palm_crown_core', .12, .29, .44, [0, height * .88, 0], lighter, 8);
    return;
  }
  const trunkHeight = species === 'flowering' ? .56 : .68;
  taper(root, 'trunk', .15, .31, height * trunkHeight,
    [0, height * trunkHeight / 2, 0], bark, 7);
  for (const [index, dx, dz, scale] of [[0, -.73, -.18, 1], [1, .70, .18, .91],
    [2, .05, .51, 1.06], [3, -.22, -.42, .84]] as const) {
    const branch = taper(root, `branch_${index}`, .07, .15, height * .29,
      [dx * .48, height * (species === 'flowering' ? .51 : .62), dz * .42], bark, 6);
    branch.rotation.z = -dx * .55;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, near ? 1 : 0),
      index === 1 ? lighter : leaf);
    crown.name = `crown_${index}`;
    crown.scale.set(height * (species === 'flowering' ? .30 : .22) * scale,
      height * (species === 'flowering' ? .13 : .18) * scale,
      height * .19 * scale);
    crown.position.set(dx * (species === 'flowering' ? 1.24 : 1),
      height * ((species === 'flowering' ? .66 : .78) + index * .014), dz);
    root.add(crown);
    if (near && index < 3) {
      const tip = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0),
        species === 'flowering' ? mat('#e7b789') : lightTip);
      tip.name = `sunlit_leaf_mass_${index}`;
      tip.scale.set(height * .105, height * .07, height * .095);
      tip.position.set(dx + .13, height * ((species === 'flowering' ? .75 : .90) + index * .012), dz - .18);
      root.add(tip);
    }
  }
  if (near) taper(root, 'root_base', .31, .42, .24, [0, .12, 0], bark, 7);
}

/** Five existing 96 m landscape families; place on the matching roadside half only. */
export function createSceneryCluster(kind: LandscapeKind, side: -1 | 1,
  lod: 'near' | 'far' = 'near', variantSeed = 0): SceneryArt {
  const root = new THREE.Group(); root.name = `env_${kind}_${side}_${lod}`;
  const waveSurfaces: { geometry: THREE.BufferGeometry; base: Float32Array;
    amplitude: number; phase: number }[] = [];
  const verge = balance.laneWidth * balance.laneCount / 2 + 3.2;
  const x = (offset: number) => side * (verge + offset);
  const near = lod === 'near';
  if (kind === 'city') {
    const variation = (slot: number) => {
      const n = Math.sin((variantSeed + 1) * 127.1 + slot * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const jitter = (slot: number) => (variation(slot) - .5) * 1.4;
    const palette = (slot: number) => Math.floor(variation(slot + 23) * 3);
    const palettes = ['warm', 'cool', 'ochre'] as const;
    const pavement = mat('#a9a88b'), curb = mat('#e0c8a4'), wall = mat('#aa9473');
    const grass = mat('#6e9965');
    box(root, 'sidewalk_base', [4.5, .10, 66], [x(1.2), -.08, 7], pavement);
    box(root, 'sidewalk_curb', [.18, .22, 66], [x(-1.14), -.01, 7], curb);
    box(root, 'backlot_courtyard', [12.6, .06, 68], [x(11.15), -.105, 7], mat('#8ea180'));
    const slots = [-20, -10, 3, 13, 23, 34];
    const order = [0, 1, 2, 3, 4, 5];
    if (variantSeed !== 0) for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(variation(i + 61) * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let slot = 0; slot < slots.length; slot++) {
      const module = order[slot];
      const z = slots[slot] + (variantSeed === 0 && module === 2 ? 0 : jitter(slot));
      const setback = module === 2 && variantSeed === 0 ? 0 : variation(slot + 41) * 1.4;
      const yaw = (variation(slot + 54) - .5) * .12;
      let building: THREE.Object3D | undefined;
      if (module === 0) building = house(root, 'narrow_two_storey', x(.55 + setback), z,
        3.45 + variation(slot + 72) * .65, 2, palettes[palette(slot)], near);
      else if (module === 1) building = midrise(root, x(.55 + setback), z, near, palette(slot));
      else if (module === 2) building = house(root, 'porch_house', x(.48 + setback), z,
        4.5, 1, palettes[palette(slot)], near);
      else if (module === 3) building = wideStorefront(root, x(.48 + setback), z,
        near, palette(slot));
      else if (module === 4) pocketPark(root, x(3.7 + setback * .55), z, near, side);
      else building = house(root, 'corner_shop', x(.58 + setback), z,
        3.85 + variation(slot + 81) * .60, 2,
        palettes[palette(slot)], near, 'shop');
      if (building) building.rotation.y = -side * Math.PI / 2 + yaw;
    }
    for (const [i, z] of [[0, -18], [1, 7], [2, 30]] as const) {
      const block = backlotBlock(root, x(10.2 + variation(i + 89) * 2),
        z + jitter(i + 9), i, near);
      block.rotation.y = -side * Math.PI / 2;
    }
    for (const z of [-11, 19]) {
      box(root, `backlot_link_${z}`, [8.3, .045, 1.7],
        [x(5.55), -.06, z], pavement);
      box(root, `backlot_hedge_${z}`, [2.2, .45, .42],
        [x(9.1), .22, z + 2.25], grass);
    }
    if (near) {
      const timber = mat('#906e50'), sheet = mat('#ad6d54'), soil = mat('#5a624d');
      const shedDoor = mat('#374a49'), line = mat('#d9d0b4');
      for (const [i, z] of [-3, 17].entries()) {
        box(root, `courtyard_garden_${i}`, [2.5, .23, 1.28],
          [x(10.55 + i * .7), .07, z], timber);
        box(root, `courtyard_garden_soil_${i}`, [2.20, .04, 1.03],
          [x(10.55 + i * .7), .20, z], soil);
        for (const dx of [-.64, 0, .64])
          taper(root, `courtyard_crop_${i}_${dx}`, .09, .18, .46,
            [x(10.55 + i * .7) + dx, .45, z], grass, 5);
      }
      box(root, 'courtyard_shed_body', [2.13, 2.10, 2.35],
        [x(13.6), 1.05, -4.7], timber);
      const shedRoof = roof(root, 'courtyard_shed_pitched_roof', 2.52, 2.63, 2.12, sheet);
      shedRoof.position.set(x(13.6), 0, -4.7);
      box(root, 'courtyard_shed_ridge', [.08, .08, 2.69],
        [x(13.6), 2.58, -4.7], timber);
      box(root, 'courtyard_shed_door', [.70, 1.59, .055],
        [x(13.6) - .34, .80, -3.49], shedDoor);
      box(root, 'courtyard_shed_window', [.53, .52, .055],
        [x(13.6) + .55, 1.42, -3.49], mat('#557b7b'));
      box(root, 'courtyard_shed_threshold', [1.02, .09, .35],
        [x(13.6) - .34, .05, -3.22], sheet);
      for (const z of [11, 16])
        taper(root, `courtyard_clothes_post_${z}`, .055, .075, 2.25,
          [x(12.8), 1.12, z], timber, 6);
      box(root, 'courtyard_clothesline', [.025, .025, 5],
        [x(12.8), 2.20, 13.5], line);
      for (const [i, color] of ['#d8a37d', '#afbf9d', '#ca7966'].entries())
        box(root, `courtyard_laundry_${i}`, [.075, .57 + i * .1, .76],
          [x(12.8), 1.90, 12 + i * 1.45], mat(color));
    }
    for (const z of [-25, 30]) {
      box(root, `boundary_wall_${z}`, [.22, .78, 3.2], [x(-.82), .39, z], wall);
      box(root, `wall_cap_${z}`, [.30, .08, 3.30], [x(-.82), .82, z], curb);
    }
    for (const z of [-26, 8, 29]) box(root, `rain_garden_${z}`,
      [1.22, .06, 1.65], [x(-.25), -.01, z], grass);
    if (near) {
      tree(root, 'courtyard_tree', x(2.2), 39, 4.7, true, 'flowering');
      for (const [i, z] of [-7, 22].entries()) {
        const shiftedZ = z + (variation(i + 105) - .5) * 3;
        tree(root, `street_tree_${i}`, x(-.48), shiftedZ,
          i === 0 ? 3.8 : 4.3, true, i === 0 ? 'flowering' : 'rain');
        taper(root, `street_tree_bed_${i}`, .47, .53, .08,
          [x(-.48), -.015, shiftedZ], grass, 8);
      }
      const lampMetal = mat('#557177');
      const lampGlass = new THREE.MeshStandardMaterial({ color: '#f0d399',
        emissive: '#b9823c', emissiveIntensity: .26, roughness: .35 });
      for (const z of [-15, 5, 28]) {
        taper(root, `streetlamp_pole_${z}`, .045, .09, 4.15,
          [x(-.78), 2.075, z], lampMetal, 7);
        box(root, `streetlamp_arm_${z}`, [.62, .065, .07],
          [x(-1.02), 4.05, z], lampMetal);
        box(root, `streetlamp_head_${z}`, [.34, .18, .31],
          [x(-1.29), 3.95, z], lampGlass);
      }
      for (const z of [-18, 4, 32]) box(root, `drain_slot_${z}`,
        [.11, .018, .35], [x(-1.18), .105, z], mat('#67716b'));
    }
  } else if (kind === 'trees') {
    const grass = mat('#759b65'), soil = mat('#926c4e');
    box(root, 'green_verge', [6.3, .07, 55], [x(2.0), -.10, 3], grass);
    for (const z of [-10, 3, 17]) taper(root, `tree_soil_ring_${z}`,
      .78, .90, .075, [x(z === 3 ? 3.3 : 1.7), -.055, z], soil, 9);
    tree(root, 'rain_tree_A', x(1.7), -10, 5.6, near, 'rain');
    tree(root, 'rain_tree_B', x(3.3), 3, 6.3, near, 'palm');
    tree(root, 'rain_tree_C', x(1.7), 17, 4.7, near, 'flowering');
    tree(root, 'rain_tree_D', x(4.6), -19, 3.65, near, 'flowering');
    tree(root, 'rain_tree_E', x(4.35), 26, 4.15, near, 'rain');
    const bush = mat('#4f8a59'), bushLight = mat('#86ae63');
    for (const [index, z] of [-23, -17, -3, 10, 22, 28].entries()) {
      const shrub = new THREE.Group(); shrub.name = `understory_${z}`;
      shrub.position.set(x(index % 2 ? .7 : 3.3), .46, z); root.add(shrub);
      for (const [i, dx, dz, scale] of [[0, -.38, -.10, .60], [1, .22, -.26, .71],
        [2, .08, .32, .55]] as const) {
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), i === 1 ? bushLight : bush);
        crown.name = `shrub_leaf_${i}`; crown.scale.set(scale, scale * .68, scale * .72);
        crown.position.set(dx, i === 1 ? .18 : 0, dz); shrub.add(crown);
      }
    }
    const grassTufts = new THREE.InstancedMesh(new THREE.ConeGeometry(.14, .48, 5),
      mat('#ffffff'), near ? 44 : 20);
    grassTufts.name = 'seeded_verge_grass';
    const tuft = new THREE.Object3D();
    for (let i = 0; i < grassTufts.count; i++) {
      const a = Math.sin((i + 1) * 53.19 + variantSeed * 7.31) * 43758.5453;
      const b = Math.sin((i + 1) * 91.47 + variantSeed * 3.73) * 22578.1459;
      const fx = a - Math.floor(a), fz = b - Math.floor(b);
      const size = .56 + ((i * 7) % 5) * .13;
      tuft.position.set(x(.2 + fx * 4.6), .14 * size, -24 + fz * 53);
      tuft.rotation.set(0, i * 1.73, (i % 3 - 1) * .09);
      tuft.scale.set(size, size, size);
      tuft.updateMatrix(); grassTufts.setMatrixAt(i, tuft.matrix);
      grassTufts.setColorAt(i, new THREE.Color(i % 4 === 0 ? '#9ab968' : '#619457'));
    }
    root.add(grassTufts);
  } else if (kind === 'cliffs') {
    const toe = mat('#8f775d');
    const face = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true,
      roughness: .94, flatShading: true, side: THREE.DoubleSide });
    const upper = mat('#c19b75');
    const grass = mat('#70935e');
    const profile = [
      { z: -26, h: 2.4, shift: .2 }, { z: -19, h: 4.7, shift: -.2 },
      { z: -14, h: 3.2, shift: .45 }, { z: -5, h: 6.7, shift: -.3 },
      { z: 3, h: 5.6, shift: .1 }, { z: 9, h: 3.6, shift: .55 },
      { z: 16, h: 6.1, shift: -.2 }, { z: 21, h: 5.1, shift: .05 },
      { z: 26, h: 3.1, shift: .3 },
    ];
    const rows = [
      (p: typeof profile[number]): [number, number, number] => [x(1.2 + p.shift), 0, p.z],
      (p: typeof profile[number]): [number, number, number] => [x(2.8 + p.shift), p.h * .34, p.z],
      (p: typeof profile[number]): [number, number, number] => [x(5.1 + p.shift), p.h, p.z],
      (p: typeof profile[number]): [number, number, number] => [x(9.8 + p.shift), p.h * .79, p.z],
      (p: typeof profile[number]): [number, number, number] => [x(14.2 + p.shift), .04, p.z],
    ];
    for (let band = 0; band < rows.length - 1; band++) {
      const positions: number[] = [];
      const faceColors: number[] = [];
      for (let i = 0; i < profile.length - 1; i++) {
        const a = rows[band](profile[i]), b = rows[band + 1](profile[i]);
        const c = rows[band](profile[i + 1]), d = rows[band + 1](profile[i + 1]);
        positions.push(...a, ...b, ...c, ...c, ...b, ...d);
        if (band === 1) {
          const base = new THREE.Color(i % 3 === 0 ? '#ac8869' : '#a58164');
          for (const shade of [1, .93]) for (let vertex = 0; vertex < 3; vertex++) {
            const color = base.clone().multiplyScalar(shade);
            faceColors.push(color.r, color.g, color.b);
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      if (band === 1) geometry.setAttribute('color', new THREE.Float32BufferAttribute(faceColors, 3));
      geometry.computeVertexNormals();
      const layer = new THREE.Mesh(geometry, [toe, face, upper, grass][band]);
      layer.name = ['cliff_toe', 'faceted_rock_face', 'sunlit_rim', 'grassy_back'][band];
      root.add(layer);
    }
    const facePoint = (p: typeof profile[number], t: number) => {
      const low = rows[1](p), high = rows[2](p);
      return [low[0] + (high[0] - low[0]) * t - side * .035,
        low[1] + (high[1] - low[1]) * t + .03, p.z] as const;
    };
    for (const [band, t, width, color] of [[0, .28, .054, '#92765e'],
      [1, .69, .036, '#ba9471']] as const) {
      const vertices: number[] = [];
      for (let i = 0; i < profile.length - 1; i++) {
        if ((i + band) % 3 === 2 || (band === 1 && i % 2 === 0)) continue;
        const start = t + Math.sin(i * 4.3 + band) * .065;
        const end = t + Math.sin((i + 1) * 4.3 + band) * .065;
        const a = facePoint(profile[i], start), b = facePoint(profile[i], start + width);
        const c = facePoint(profile[i + 1], end), d = facePoint(profile[i + 1], end + width);
        vertices.push(...a, ...b, ...c, ...c, ...b, ...d);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      const seam = new THREE.Mesh(geometry, mat(color));
      seam.name = `cliff_rock_stratum_${band}`; root.add(seam);
    }
    const heightAt = (z: number) => {
      const i = Math.max(0, profile.findIndex((point, index) => index < profile.length - 1 &&
        z >= point.z && z <= profile[index + 1].z));
      const a = profile[i], b = profile[Math.min(i + 1, profile.length - 1)];
      return THREE.MathUtils.lerp(a.h, b.h, (z - a.z) / (b.z - a.z || 1));
    };
    const rockCount = near ? 14 : 7;
    const scatteredRock = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0),
      mat('#ffffff'), rockCount);
    scatteredRock.name = 'cliff_fallen_scree';
    const stone = new THREE.Object3D();
    for (let i = 0; i < rockCount; i++) {
      const z = -24 + i * (49 / rockCount) + Math.sin(i * 6.1) * 1.2;
      const size = .30 + (i * 7 % 5) * .085;
      stone.position.set(x(.48 + (i * 3 % 6) * .28), size * .29, z);
      stone.rotation.set(i * .43, i * .72, i * .16);
      stone.scale.set(size * 1.3, size * .56, size);
      stone.updateMatrix(); scatteredRock.setMatrixAt(i, stone.matrix);
      scatteredRock.setColorAt(i, new THREE.Color(i % 3 === 0 ? '#b09473' : '#806d59'));
    }
    root.add(scatteredRock);
    const shrubs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0),
      mat('#ffffff'), near ? 14 : 7);
    shrubs.name = 'cliff_crest_shrubs';
    for (let i = 0; i < shrubs.count; i++) {
      const z = -23 + i * (48 / shrubs.count) + Math.sin(i * 4.7) * .7;
      const size = .26 + (i * 5 % 4) * .11;
      stone.position.set(x(6.9 + (i % 3) * 1.15), heightAt(z) * .92 + size * .24, z);
      stone.rotation.set(0, i * .91, 0);
      stone.scale.set(size * 1.35, size * .66, size);
      stone.updateMatrix(); shrubs.setMatrixAt(i, stone.matrix);
      shrubs.setColorAt(i, new THREE.Color(i % 4 === 0 ? '#a1ab69' : '#64875d'));
    }
    root.add(shrubs);
    if (near) for (const z of [-14, 17]) {
      const ledge = new THREE.Group(); ledge.position.y = heightAt(z) * .88; root.add(ledge);
      tree(ledge, `cliff_rim_tree_${z}`, x(8.1), z, z < 0 ? 3.6 : 3.1, true, 'rain');
    }
  } else if (kind === 'rice') {
    const soil = mat('#8d7853'), paddy = mat('#8dbb61');
    const water = new THREE.MeshStandardMaterial({ color: '#6fa6a0', roughness: .38,
      metalness: .04, side: THREE.DoubleSide });
    const rowCount = near ? 7 : 4, columnCount = near ? 8 : 5;
    const leafPositions: number[] = [];
    for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
      const dx = Math.sin(angle), dz = Math.cos(angle), px = dz, pz = -dx;
      const left = [-px * .085, 0, -pz * .085], right = [px * .085, 0, pz * .085];
      const midLeft = [dx * .12 - px * .050, .34, dz * .12 - pz * .050];
      const midRight = [dx * .12 + px * .050, .34, dz * .12 + pz * .050];
      const tip = [dx * .33, .64, dz * .33];
      leafPositions.push(...left, ...right, ...midLeft,
        ...right, ...midRight, ...midLeft, ...midLeft, ...midRight, ...tip);
    }
    const leafGeometry = new THREE.BufferGeometry();
    leafGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leafPositions, 3));
    leafGeometry.computeVertexNormals();
    const sprouts = new THREE.InstancedMesh(leafGeometry,
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .88,
        side: THREE.DoubleSide, flatShading: true }), 3 * rowCount * columnCount);
    sprouts.name = 'rice_tufts';
    const dummy = new THREE.Object3D(), green = new THREE.Color();
    let tuft = 0;
    for (let i = 0; i < 3; i++) {
      const z = -15 + i * 15;
      const paddyGeometry = new THREE.PlaneGeometry(10.5, 12.2,
        near ? 16 : 8, near ? 20 : 8);
      paddyGeometry.rotateX(-Math.PI / 2);
      const paddy = new THREE.Mesh(paddyGeometry, water);
      paddy.name = `paddy_water_${i}`;
      paddy.position.set(x(7.1), -.055, z);
      root.add(paddy);
      if (near) waveSurfaces.push({ geometry: paddyGeometry,
        base: Float32Array.from(paddyGeometry.getAttribute('position').array as Float32Array),
        amplitude: .012, phase: i * 1.7 });
      for (const edgeZ of [-1, 1]) box(root, `bund_${i}_${edgeZ}`,
        [11.2, .25, .32], [x(7.1), .02, z + edgeZ * 6.3], soil);
      for (const edgeX of [-1, 1]) box(root, `side_bund_${i}_${edgeX}`,
        [.34, .21, 12.2], [x(7.1 + edgeX * 5.33), .01, z], soil);
      for (let row = 0; row < rowCount; row++) for (let column = 0; column < columnCount; column++) {
        dummy.position.set(x(7.1) + (column - (columnCount - 1) / 2) * (9.0 / columnCount),
          -.05, z - 4.8 + row * (9.6 / rowCount));
        dummy.rotation.set(0, (row * 3 + column) * .31, (column % 3 - 1) * .10);
        dummy.scale.setScalar(.78 + ((row * 7 + column * 3 + i) % 4) * .09);
        dummy.updateMatrix(); sprouts.setMatrixAt(tuft, dummy.matrix);
        green.set((row + column) % 4 === 0 ? '#a8c36a' : '#699e5b');
        sprouts.setColorAt(tuft, green); tuft++;
      }
    }
    root.add(sprouts);
    box(root, 'field_edge_irrigation', [.7, .035, 43], [x(.25), -.08, 2], water);
    box(root, 'irrigation_footbridge', [1.43, .09, .56], [x(.25), .015, 8], soil);
    for (const z of [-11, 4, 20]) box(root, `ditch_reed_patch_${z}`,
      [.22, .34, .34], [x(.15), .12, z], paddy);
    tree(root, 'field_edge_tree', x(2), 23, 4.6, near, 'palm');
  } else {
    const shore = mat('#b0a485'), seam = mat('#7d8c7f');
    const sea = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .34,
      metalness: .04, clearcoat: .58, clearcoatRoughness: .19, side: THREE.DoubleSide });
    const foam = mat('#c4d8c0');
    box(root, 'seawall', [.38, .78, 43], [x(.7), .30, 3], shore);
    box(root, 'seawall_cap', [.55, .11, 43], [x(.7), .73, 3], shore);
    const waterGeometry = new THREE.PlaneGeometry(18, 43,
      near ? 22 : 10, near ? 54 : 26);
    waterGeometry.rotateX(-Math.PI / 2);
    const points = waterGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colors: number[] = [];
    const shallowColor = new THREE.Color('#79b5ae'), deepColor = new THREE.Color('#3d778b');
    for (let i = 0; i < points.count; i++) {
      const px = points.getX(i), pz = points.getZ(i);
      const depth = side === 1 ? (px + 9) / 18 : (9 - px) / 18;
      points.setY(i, Math.sin(pz * .56 + px * .31) * .024 +
        Math.cos(pz * .31 - px * .42) * .012);
      const color = shallowColor.clone().lerp(deepColor, depth * .83);
      color.multiplyScalar(.96 + Math.sin(pz * .42 + px * .23) * .035);
      colors.push(color.r, color.g, color.b);
    }
    waterGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    waterGeometry.computeVertexNormals();
    const waterSurface = new THREE.Mesh(waterGeometry, sea);
    waterSurface.name = 'water_plane'; waterSurface.position.set(x(10.1), -.145, 3);
    root.add(waterSurface);
    waveSurfaces.push({ geometry: waterGeometry,
      base: Float32Array.from(points.array as Float32Array),
      amplitude: near ? .025 : .012, phase: side });
    for (const z of [-16, -7, 3, 12, 21]) {
      box(root, `water_edge_${z}`, [.11, .012, 3.8], [x(1.48), -.115, z], foam);
      box(root, `wall_vertical_seam_${z}`, [.026, .58, .035],
        [x(.7) - side * .20, .30, z + 3.1], seam);
    }
    const ripples = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .006, .035),
      foam, near ? 28 : 12);
    ripples.name = 'sea_ripples';
    const wave = new THREE.Object3D();
    for (let i = 0; i < ripples.count; i++) {
      const z = -18 + i * (39 / ripples.count) + Math.sin(i * 7.1) * .8;
      const offset = 2.3 + ((i * 11) % 15) * 1.03;
      wave.position.set(x(offset), -.098, z);
      wave.rotation.set(0, (i % 5 - 2) * .07, 0);
      wave.scale.set(.75 + i % 4 * .35, 1, 1);
      wave.updateMatrix(); ripples.setMatrixAt(i, wave.matrix);
    }
    root.add(ripples);
    const rock = mat('#718b80');
    for (let i = 0; i < (near ? 9 : 5); i++) {
      const size = .26 + i % 4 * .11;
      const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), i % 3 === 0 ? shore : rock);
      stone.name = `shore_rock_${i}`;
      stone.scale.set(size * 1.24, size * .42, size);
      stone.position.set(x(1.7 + i % 3 * .45), -.07, -17 + i * 4.7);
      root.add(stone);
    }
    if (near) {
      for (const z of [-15, -3, 9, 21]) {
        box(root, `seawall_post_${z}`, [.29, 1.08, .29], [x(.7), .62, z], shore);
        box(root, `post_cap_${z}`, [.36, .09, .36], [x(.7), 1.20, z], seam);
      }
      box(root, 'storm_drain_outlet', [.08, .24, .62], [x(.7) - side * .22, .30, 2], seam);
      const jetty = new THREE.Group(); jetty.name = 'harbor_jetty'; root.add(jetty);
      const wood = mat('#9b7654'), woodLight = mat('#b48b61'), rope = mat('#d1b889');
      const dockZ = -9.8;
      for (let i = 0; i < 10; i++) {
        box(jetty, `deck_plank_${i}`, [.50, .13, 1.72],
          [x(1.25 + i * .53), .56, dockZ], i % 3 === 0 ? woodLight : wood);
      }
      for (const offset of [1.8, 5.8]) for (const edge of [-1, 1]) {
        box(jetty, `jetty_support_${offset}_${edge}`, [.21, .85, .21],
          [x(offset), .19, dockZ + edge * .73], wood);
      }
      for (const edge of [-1, 1]) {
        box(jetty, `mooring_bollard_${edge}`, [.27, .34, .27],
          [x(5.95), .78, dockZ + edge * .64], seam);
        box(jetty, `mooring_rope_${edge}`, [.66, .045, .045],
          [x(5.54), .88, dockZ + edge * .64], rope);
      }
      box(jetty, 'rolled_fishing_net', [.71, .24, .50], [x(2.2), .74, dockZ + .35],
        mat('#6f9e8e'));
    }
  }
  root.userData = { id: `env_${kind}_A`, axes: '+Y up, +Z forward', variantSeed, lod,
    roadsideSide: side, regionLengthM: 96, placementSource: 'roadsideRegions',
    collisionRole: 'decorative-only', noSpawnChange: true };
  if (!near) batchStaticMeshes(root, 'far_material_batch');
  const setVisualTime = waveSurfaces.length ? (elapsedSeconds: number) => {
    const t = Math.max(0, elapsedSeconds);
    for (const surface of waveSurfaces) {
      const attribute = surface.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = attribute.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = surface.base[i], z = surface.base[i + 2];
        positions[i + 1] = surface.base[i + 1] + surface.amplitude *
          (Math.sin(x * 1.25 + z * .72 + t * 1.8 + surface.phase) +
            .46 * Math.sin(x * 2.4 - z * 1.33 - t * 1.15));
      }
      attribute.needsUpdate = true;
      surface.geometry.computeVertexNormals();
    }
  } : undefined;
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    root.traverse(obj => { if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
    }
      for (const material of (obj.userData.batchOrphanMaterials ?? []) as THREE.Material[])
        materials.add(material);
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  };
  return { root, setVisualTime, dispose };
}
