import * as THREE from 'three';

export type SurfaceHazardKind = 'water' | 'pothole';
export type PropHazardKind = 'cargo_crate' | 'cargo_barrel' | 'fuel' | 'repair' |
  'barrier' | 'fallen_tree';
export interface HazardArt {
  root: THREE.Group;
  sockets: Record<string, THREE.Object3D>;
  setState: (state: 'normal' | 'used' | 'broken') => void;
  dispose: () => void;
}
const material = (color: string, roughness = .9) =>
  new THREE.MeshStandardMaterial({ color, roughness, flatShading: true, side: THREE.DoubleSide });
function box(parent: THREE.Object3D, name: string, size: [number, number, number],
  pos: [number, number, number], mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function cylinder(parent: THREE.Object3D, name: string, rTop: number, rBottom: number,
  height: number, pos: [number, number, number], mat: THREE.Material, sides = 7) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, sides), mat);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function point(parent: THREE.Object3D, name: string, pos: [number, number, number]) {
  const node = new THREE.Object3D(); node.name = name; node.position.set(...pos); parent.add(node); return node;
}
function patch(parent: THREE.Object3D, name: string, width: number, length: number,
  y: number, material: THREE.Material) {
  const outline: [number, number][] = [[-.47, -.48], [-.17, -.49], [.34, -.47], [.49, -.33],
    [.46, .11], [.48, .48], [.20, .49], [-.34, .46], [-.49, .34], [-.46, -.15]];
  const positions: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    positions.push(0, y, 0, a[0] * width, y, a[1] * length,
      b[0] * width, y, b[1] * length);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material); mesh.name = name; parent.add(mesh); return mesh;
}
function finish(root: THREE.Group, sockets: Record<string, THREE.Object3D>,
  worn?: THREE.Object3D, broken?: THREE.Object3D): HazardArt {
  const setState = (state: 'normal' | 'used' | 'broken') => {
    if (worn) worn.visible = state === 'used' || state === 'broken';
    if (broken) broken.visible = state === 'broken';
  };
  setState('normal');
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    root.traverse(obj => { if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
    } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  };
  return { root, sockets, setState, dispose };
}

/** Geometry uses the current simulation entity width/length verbatim; no gameplay collider lives here. */
export function createSurfaceHazardArt(kind: SurfaceHazardKind, width: number, length: number,
  lod: 'near' | 'far' = 'near'): HazardArt {
  if (!Number.isFinite(width) || !Number.isFinite(length) || width <= 0 || length <= 0)
    throw new Error('Invalid hazard footprint');
  const root = new THREE.Group(); root.name = `haz_${kind}_${lod}`;
  root.userData = { id: root.name, widthM: width, lengthM: length,
    axes: '+Y up, +Z forward', collisionRole: 'reference-only' };
  const edge = material(kind === 'water' ? '#45534e' : '#504b43');
  const center = material(kind === 'water' ? '#426c73' : '#242c2d', kind === 'water' ? .32 : .98);
  const glint = material('#93aeb0', .27), debris = material('#827363');
  patch(root, 'readable_footprint', width, length, .015, edge);
  patch(root, kind === 'water' ? 'deep_water' : 'pothole_depth',
    width * .82, length * .86, .022, center);
  if (kind === 'water') {
    for (let i = 0; i < (lod === 'near' ? 5 : 2); i++) {
      const z = (i / (lod === 'near' ? 5 : 2) - .42) * length * .72;
      box(root, `water_ripple_${i}`, [width * (.20 + (i % 3) * .10), .006, .025],
        [((i * 7) % 5 - 2) * width * .09, .032, z], glint);
    }
    for (const side of [-1, 1]) for (const z of [-.26, .27])
      box(root, `wet_bank_${side}_${z}`,
        [Math.min(.05, width * .025), .006, length * .14],
        [side * width * .43, .026, z * length], glint);
  } else {
    for (const side of [-1, 1]) {
      box(root, `broken_rim_${side}`, [width * .09, .05, length * .62],
        [side * width * .39, .044, side * length * .04], debris);
      if (lod === 'near') box(root, `rim_fragment_${side}`, [width * .15, .045, length * .11],
        [side * width * .29, .045, -length * .34], edge).rotation.y = side * .25;
    }
  }
  return finish(root, { contact: point(root, 'contact', [0, .03, 0]) });
}

/** Small, legible props; reuse these for dropped cargo and pickups. */
export function createPropHazardArt(kind: PropHazardKind, lod: 'near' | 'far' = 'near'): HazardArt {
  const root = new THREE.Group(); root.name = `haz_${kind}_${lod}`;
  root.userData = { id: root.name, axes: '+Y up, +Z forward', collisionRole: 'reference-only' };
  const steel = material('#576368'), dark = material('#2c373b'), wood = material('#816956');
  const woodLight = material('#aa8b6b'), amber = material('#e2ab55'), red = material('#bd6961');
  const white = material('#e7dfc8'), green = material('#63887a'), worn = new THREE.Group();
  worn.name = 'used_overlay'; root.add(worn);
  const broken = new THREE.Group(); broken.name = 'broken_overlay'; root.add(broken);
  let top = .9;
  if (kind === 'cargo_crate') {
    box(root, 'crate_body', [.8, .7, .8], [0, .36, 0], wood);
    for (const side of [-1, 1]) {
      box(root, `crate_frame_x_${side}`, [.075, .76, .84], [side * .36, .38, 0], woodLight);
      box(root, `crate_frame_z_${side}`, [.84, .76, .075], [0, .38, side * .36], woodLight);
      if (lod === 'near') box(root, `crate_lid_${side}`, [.84, .05, .08], [0, .73, side * .24], dark);
    }
    box(broken, 'split_plank', [.75, .08, .1], [.4, .61, .22], woodLight).rotation.z = -.45;
  } else if (kind === 'cargo_barrel') {
    cylinder(root, 'barrel_body', .32, .34, .75, [0, .39, 0], steel, 9);
    for (const y of [.13, .65]) cylinder(root, `steel_band_${y}`, .35, .35, .07,
      [0, y, 0], dark, 9);
    cylinder(root, 'barrel_lid', .30, .30, .04, [0, .78, 0], steel, 9);
    box(broken, 'barrel_dent', [.34, .2, .06], [0, .4, .31], dark);
  } else if (kind === 'fuel') {
    box(root, 'fuel_can', [.62, .75, .32], [0, .39, 0], red);
    box(root, 'can_handle', [.3, .11, .08], [0, .82, 0], dark);
    box(root, 'can_spout', [.14, .10, .14], [.23, .78, 0], steel);
    if (lod === 'near') box(root, 'fuel_mark', [.12, .25, .016], [0, .43, .17], white);
  } else if (kind === 'repair') {
    box(root, 'repair_box', [.7, .55, .5], [0, .29, 0], green);
    box(root, 'repair_lid', [.74, .12, .54], [0, .6, 0], dark);
    box(root, 'repair_handle', [.25, .07, .11], [0, .7, 0], steel);
    box(root, 'cross_vertical', [.09, .3, .02], [0, .3, .26], white);
    box(root, 'cross_horizontal', [.27, .09, .02], [0, .3, .27], white);
    top = .74;
  } else if (kind === 'barrier') {
    top = 1.05;
    for (const x of [-2.72, 0, 2.72]) {
      box(root, `barrier_foot_${x}`, [.28, .10, .68], [x, .05, 0], dark);
      box(root, `barrier_post_${x}`, [.13, 1.02, .12], [x, .55, 0], steel);
    }
    box(root, 'barrier_board', [5.7, .45, .12], [0, .78, 0], amber);
    for (const x of [-2.15, -1.28, -.43, .43, 1.28, 2.15]) {
      box(root, `stripe_${x}`, [.20, .46, .018], [x, .78, .068], dark).rotation.z = -.39;
    }
    box(broken, 'fallen_board', [2.1, .19, .12], [2.1, .21, .45], amber).rotation.z = -.14;
  } else {
    top = .9;
    const trunk = cylinder(root, 'fallen_trunk', .18, .24, 4.3, [0, .29, 0], wood, 7);
    trunk.rotation.z = Math.PI / 2;
    for (const x of [-1.65, -.85, .45, 1.4]) {
      const branch = cylinder(root, `branch_${x}`, .04, .09, .7,
        [x, .40, x % 1 < 0 ? -.28 : .28], wood, 5);
      branch.rotation.x = .8; branch.rotation.z = x < 0 ? -.5 : .5;
      if (lod === 'near') cylinder(root, `leaf_clump_${x}`, .28, .4, .22,
        [x, .60, x % 1 < 0 ? -.5 : .5], green, 6);
    }
    box(broken, 'splinter', [.42, .07, .16], [2.1, .36, 0], woodLight).rotation.z = .5;
  }
  box(worn, 'mud_mark', [kind === 'barrier' ? 1.5 : .22, .018, .12],
    [0, .1, .1], wood);
  const sockets = { contact: point(root, 'contact', [0, .02, 0]),
    top: point(root, 'top_socket', [0, top, 0]) };
  return finish(root, sockets, worn, broken);
}
