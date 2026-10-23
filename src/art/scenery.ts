import * as THREE from 'three';
import { balance } from '../config';
import type { LandscapeKind } from '../landscape';

export interface SceneryArt { root: THREE.Group; dispose: () => void }
const mat = (color: string) => new THREE.MeshStandardMaterial({
  color, roughness: .88, flatShading: true, side: THREE.DoubleSide,
});
function box(parent: THREE.Object3D, name: string, size: [number, number, number],
  pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
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
  const mesh = new THREE.Mesh(shape, material); mesh.name = name; parent.add(mesh);
}
function house(parent: THREE.Object3D, name: string, x: number, z: number, width: number,
  floors: 1 | 2, palette: 'warm' | 'cool', near: boolean) {
  const root = new THREE.Group(); root.name = name; root.position.set(x, 0, z); parent.add(root);
  const wall = mat(palette === 'warm' ? '#bba98a' : '#a8b3aa');
  const trim = mat(palette === 'warm' ? '#756e61' : '#5f7377');
  const roofMat = mat(palette === 'warm' ? '#85675d' : '#687a7d');
  const glass = mat('#536c70'), wood = mat('#776855'), flood = mat('#7e8179');
  const height = floors === 2 ? 5.8 : 3.25;
  box(root, 'plaster', [width, height, 4.3], [0, height / 2, 0], wall);
  box(root, 'flood_stain', [width + .012, .26, 4.31], [0, .13, 0], flood);
  roof(root, 'pitched_sheet_roof', width + .5, 4.8, height + .08, roofMat);
  box(root, 'roof_ridge', [.11, .08, 4.85], [0, height + .49, 0], trim);
  box(root, 'front_door', [.9, 2.13, .045], [-width * .18, 1.07, 2.18], wood);
  box(root, 'front_window', [.96, .83, .045], [width * .23, 1.77, 2.18], glass);
  for (const side of [-1, 1]) {
    box(root, `side_window_${side}`, [.045, .72, .88],
      [side * (width / 2 + .025), 1.91, -.35], glass);
    box(root, `side_window_sill_${side}`, [.12, .07, 1.03],
      [side * (width / 2 + .04), 1.51, -.35], trim);
  }
  box(root, 'back_window', [.78, .70, .045], [width * .12, 1.84, -2.18], glass);
  box(root, 'front_awning', [width * .77, .10, 1.05], [0, 2.45, 2.68], roofMat).rotation.x = -.11;
  for (const side of [-1, 1]) box(root, `awning_brace_${side}`, [.07, .54, .07],
    [side * width * .31, 2.17, 2.92], trim);
  if (floors === 2) {
    box(root, 'upper_window', [width * .44, 1.02, .045], [0, 4.36, 2.18], glass);
    box(root, 'balcony_slab', [width * .78, .13, .78], [0, 3.46, 2.45], trim);
    box(root, 'balcony_rail', [width * .77, .48, .07], [0, 3.78, 2.82], trim);
  }
  if (near) {
    box(root, 'gutter', [.09, .10, 4.68], [width * .5, height + .09, 0], trim);
    box(root, 'window_sill', [1.09, .08, .18], [width * .23, 1.29, 2.25], trim);
    box(root, 'step', [1.2, .18, .6], [-width * .18, .09, 2.52], trim);
    box(root, 'rain_pipe', [.07, height + .02, .08],
      [width * .5 + .04, height / 2, -1.75], trim);
  }
  return root;
}
function tree(parent: THREE.Object3D, name: string, x: number, z: number,
  height: number, near: boolean) {
  const root = new THREE.Group(); root.name = name; root.position.set(x, 0, z); parent.add(root);
  const bark = mat('#655d50'), leaf = mat('#4e745d'), lighter = mat('#688269');
  taper(root, 'trunk', .18, .33, height * .63, [0, height * .315, 0], bark, 7);
  for (const [index, dx, dz, scale] of [[0, -.62, -.13, 1], [1, .63, .24, .92],
    [2, .04, .43, 1.05]] as const) {
    const branch = taper(root, `branch_${index}`, .07, .15, height * .29,
      [dx * .46, height * .62, dz * .4], bark, 6);
    branch.rotation.z = -dx * .55;
    const crown = taper(root, `crown_${index}`, .16 * scale, .74 * scale,
      height * .47 * scale, [dx, height * .82, dz], index === 1 ? lighter : leaf, 6);
    crown.rotation.z = dx * .10;
  }
  if (near) taper(root, 'root_base', .32, .46, .21, [0, .10, 0], bark, 7);
}

/** Five existing 96 m landscape families; place on the matching roadside half only. */
export function createSceneryCluster(kind: LandscapeKind, side: -1 | 1,
  lod: 'near' | 'far' = 'near'): SceneryArt {
  const root = new THREE.Group(); root.name = `env_${kind}_${side}_${lod}`;
  const verge = balance.laneWidth * balance.laneCount / 2 + 3.2;
  const x = (offset: number) => side * (verge + offset);
  const near = lod === 'near';
  if (kind === 'city') {
    house(root, 'narrow_two_storey', x(3.0), -10, 3.7, 2, 'cool', near).rotation.y = -side * Math.PI / 2;
    house(root, 'porch_house', x(3.1), 3, 4.5, 1, 'warm', near).rotation.y = -side * Math.PI / 2;
    house(root, 'corner_shop', x(3.4), 16, 4.1, 2, 'warm', near).rotation.y = -side * Math.PI / 2;
    const wall = mat('#81867c');
    for (const z of [-15, 9]) box(root, `boundary_wall_${z}`, [.25, 1.04, 4.2],
      [x(.8), .52, z], wall);
  } else if (kind === 'trees') {
    tree(root, 'rain_tree_A', x(1.8), -10, 5.6, near);
    tree(root, 'rain_tree_B', x(4.1), 3, 6.3, near);
    tree(root, 'rain_tree_C', x(2.0), 17, 4.7, near);
    const bush = mat('#5e7f61');
    for (const z of [-17, -2, 11, 23]) taper(root, `understory_${z}`,
      .11, .95, 1.10, [x(1.1), .52, z], bush, 6);
  } else if (kind === 'cliffs') {
    const rock = mat('#8c7867'), shadow = mat('#695d55'), soil = mat('#6b684e');
    for (const [i, z, width, height] of [[0, -13, 8, 5.2], [1, 1, 10, 7.1],
      [2, 17, 7, 4.4]] as const) {
      taper(root, `cliff_mass_${i}`, width * .26, width * .55, height,
        [x(6.2), height * .5, z], i === 1 ? shadow : rock, 5);
      box(root, `strata_${i}`, [width * .6, .16, 2.4],
        [x(5.6), height * .35, z], soil).rotation.z = side * .06;
    }
  } else if (kind === 'rice') {
    const soil = mat('#77785b'), paddy = mat('#9ca271'), water = mat('#7f9c93');
    for (let i = 0; i < 3; i++) {
      const z = -15 + i * 15;
      box(root, `paddy_water_${i}`, [10.5, .03, 12.2], [x(7.1), -.08, z], water);
      for (const edgeZ of [-1, 1]) box(root, `bund_${i}_${edgeZ}`,
        [11.2, .25, .32], [x(7.1), .02, z + edgeZ * 6.3], soil);
      for (let row = 0; row < (near ? 5 : 3); row++) box(root, `rice_row_${i}_${row}`,
        [9.3, .10, .15], [x(7.1), .055, z - 4.4 + row * (near ? 2.1 : 3.2)], paddy);
    }
    tree(root, 'field_edge_tree', x(2), 23, 4.6, near);
  } else {
    const shore = mat('#8e8d79'), sea = mat('#5b8994'), foam = mat('#a6b9ae');
    box(root, 'seawall', [.38, .78, 43], [x(.7), .30, 3], shore);
    box(root, 'water_plane', [18, .025, 43], [x(10.1), -.16, 3], sea);
    for (const z of [-16, -7, 3, 12, 21]) box(root, `water_edge_${z}`,
      [.15, .012, 3.8], [x(1.5), -.12, z], foam);
    if (near) for (const z of [-11, 13]) box(root, `seawall_post_${z}`,
      [.28, 1.0, .28], [x(.7), .64, z], shore);
  }
  root.userData = { id: `env_${kind}_A`, axes: '+Y up, +Z forward',
    roadsideSide: side, regionLengthM: 96, placementSource: 'roadsideRegions',
    collisionRole: 'decorative-only', noSpawnChange: true };
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    root.traverse(obj => { if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
    } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  };
  return { root, dispose };
}
