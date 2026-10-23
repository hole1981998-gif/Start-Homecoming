import * as THREE from 'three';
import type { VehicleCondition } from './condition';

export interface Car7Art {
  root: THREE.Group;
  body: THREE.Group;
  wheels: Record<'frontLeft' | 'frontRight' | 'rearLeft' | 'rearRight', THREE.Group>;
  seats: Record<string, THREE.Object3D>;
  sockets: Record<string, THREE.Object3D>;
  setPaint: (color: string) => void;
  setCondition: (condition: VehicleCondition) => void;
  dispose: () => void;
}
function mat(color: string, roughness = .6, metalness = .08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true, side: THREE.DoubleSide });
}
function box(parent: THREE.Object3D, name: string, dims: [number, number, number],
  pos: [number, number, number], material: THREE.Material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...dims), material); m.name = name; m.position.set(...pos); parent.add(m); return m;
}
function panel(parent: THREE.Object3D, name: string, pts: [number, number, number][], material: THREE.Material) {
  const v: number[] = [];
  for (let i = 1; i < pts.length - 1; i++) v.push(...pts[0], ...pts[i], ...pts[i + 1]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.name = name; parent.add(m); return m;
}
function point(parent: THREE.Object3D, name: string, pos: [number, number, number]) {
  const p = new THREE.Object3D(); p.name = name; p.position.set(...pos); parent.add(p); return p;
}

/** Tall seven-seater family master, not a stretched car4 shell. Metres, +Y up, +Z forward. */
export function createCar7Art(lod: 'near' | 'far' = 'near'): Car7Art {
  const root = new THREE.Group(); root.name = 'veh_car7_root';
  const body = new THREE.Group(); body.name = 'suspensionVisual'; root.add(body);
  const paint = mat('#6d9c91', .44, .15), light = mat('#a9c5b4', .47, .12), dark = mat('#396c69', .56, .1);
  const glass = mat('#496c72', .23, .08), glassDeep = mat('#2d4e57', .27, .06);
  const rubber = mat('#1e2b31', .9), alloy = mat('#c2cdca', .4, .46), trim = mat('#35464a', .64, .12);
  const tail = mat('#ba444a', .34), amber = mat('#ebbd85', .37), cream = mat('#eee2c5', .72), mud = mat('#64625b', 1);
  const damage = mat('#426065', .9);

  box(body, 'central_floor', [1.58, .30, 4.37], [0, .50, 0], dark);
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape(); shape.moveTo(-2.31, .39);
    for (const center of [-1.63, 1.48]) {
      shape.lineTo(center - .45, .39);
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        shape.lineTo(center - .45 + .9 * t, .37 + .46 * Math.sin(Math.PI * t));
      }
    }
    shape.lineTo(2.32, .39); shape.lineTo(2.34, 1.11); shape.lineTo(2.13, 1.25);
    shape.lineTo(-2.23, 1.24); shape.lineTo(-2.34, 1.10); shape.closePath();
    const sideMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), paint);
    sideMesh.name = `arched_side_${side}`; sideMesh.rotation.y = -Math.PI / 2; sideMesh.position.x = side * .97; body.add(sideMesh);
    for (const center of [-1.63, 1.48]) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i * Math.PI / 12;
        pts.push(new THREE.Vector3(side * .985, .37 + .46 * Math.sin(t), center + .45 * Math.cos(t)));
      }
      const lip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, .028, 4), dark);
      lip.name = `fender_lip_${side}_${center}`; body.add(lip);
    }
    box(body, `lower_rocker_${side}`, [.045, .07, 1.71], [side * .978, .45, -.02], trim);
    box(body, `high_belt_line_${side}`, [.044, .07, 3.59], [side * .978, 1.205, -.06], light);
  }
  // Long high roof, high rear hatch and short bonnet define an MPV/crossover silhouette.
  box(body, 'raised_roof', [1.68, .11, 3.50], [0, 1.81, -.38], light);
  box(body, 'roof_rear_edge', [1.72, .12, .15], [0, 1.76, -2.18], dark);
  panel(body, 'short_bonnet', [[-.83, 1.22, 1.50], [.83, 1.22, 1.50],
    [.76, 1.10, 2.26], [-.76, 1.10, 2.26]], light);
  box(body, 'front_nose', [1.77, .32, .16], [0, .80, 2.29], paint);
  box(body, 'rear_hatch_lower', [1.77, .55, .13], [0, .91, -2.31], dark);
  box(body, 'rear_hatch_middle', [1.69, .15, .08], [0, 1.25, -2.31], paint);
  const windscreen = panel(body, 'windscreen', [[-.78, 1.78, 1.29], [.78, 1.78, 1.29],
    [.87, 1.24, 1.54], [-.87, 1.24, 1.54]], glass);
  windscreen.userData.materialRole = 'glass';
  panel(body, 'rear_hatch_glass', [[.79, 1.75, -2.16], [-.79, 1.75, -2.16],
    [-.87, 1.30, -2.28], [.87, 1.30, -2.28]], glassDeep);
  for (const side of [-1, 1]) {
    panel(body, `front_door_glass_${side}`, [[side * .82, 1.75, .24], [side * .82, 1.75, 1.20],
      [side * .94, 1.26, 1.46], [side * .94, 1.26, .25]], glass);
    panel(body, `middle_glass_${side}`, [[side * .82, 1.75, -1.00], [side * .82, 1.75, .19],
      [side * .94, 1.26, .19], [side * .94, 1.26, -1.00]], glass);
    panel(body, `third_row_glass_${side}`, [[side * .82, 1.75, -1.94], [side * .82, 1.75, -1.05],
      [side * .94, 1.26, -1.05], [side * .94, 1.26, -2.05]], glassDeep);
    for (const z of [-1.04, .22]) box(body, `window_pillar_${side}_${z}`, [.075, .48, .085],
      [side * .885, 1.50, z], trim);
    panel(body, `a_pillar_${side}`, [[side * .82, 1.78, 1.18], [side * .82, 1.78, 1.29],
      [side * .94, 1.23, 1.56], [side * .94, 1.23, 1.43]], paint);
    box(body, `roof_rail_${side}`, [.065, .07, 2.94], [side * .70, 1.92, -.34], trim);
    box(body, `rail_foot_front_${side}`, [.08, .09, .13], [side * .70, 1.84, .85], alloy);
    box(body, `rail_foot_rear_${side}`, [.08, .09, .13], [side * .70, 1.84, -1.56], alloy);
  }

  const wheels = {} as Car7Art['wheels'];
  for (const [name, x, z] of [
    ['frontLeft', -.88, 1.48], ['frontRight', .88, 1.48],
    ['rearLeft', -.88, -1.63], ['rearRight', .88, -1.63],
  ] as const) {
    const pivot = new THREE.Group(); pivot.name = `${name}_steer`; pivot.position.set(x, .38, z); root.add(pivot);
    const spin = new THREE.Group(); spin.name = `${name}_spin`; pivot.add(spin);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .22, lod === 'near' ? 12 : 8), rubber);
    tyre.rotation.z = Math.PI / 2; spin.add(tyre);
    for (const facing of [-1, 1]) {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.21, .21, .014, lod === 'near' ? 10 : 6), alloy);
      hub.rotation.z = Math.PI / 2; hub.position.x = facing * .12; spin.add(hub);
      if (lod === 'near') for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        box(spin, `hub_spoke_${name}_${facing}_${i}`, [.02, .045, .14],
          [facing * .13, Math.cos(a) * .08, Math.sin(a) * .08], cream).rotation.x = a;
      }
    }
    wheels[name] = pivot;
    pivot.userData.spin = spin;
    pivot.userData.steerable = name.startsWith('front');
  }
  for (const side of [-1, 1]) {
    // Tall vertical taillights are the car7 rear identity at game distance.
    box(body, `tail_column_${side}`, [.19, .56, .055], [side * .77, 1.17, -2.385], tail);
    box(body, `tail_clear_${side}`, [.13, .12, .06], [side * .77, 1.45, -2.405], amber);
    box(body, `headlamp_${side}`, [.37, .16, .05], [side * .65, 1.11, 2.37], cream);
    box(body, `front_indicator_${side}`, [.10, .10, .05], [side * .89, 1.00, 2.35], amber);
    box(body, `mirror_stalk_${side}`, [.06, .12, .10], [side * .94, 1.34, 1.21], trim);
    box(body, `mirror_${side}`, [.10, .14, .20], [side * .97, 1.39, 1.21], paint);
  }
  box(body, 'rear_bumper', [1.83, .16, .12], [0, .49, -2.32], trim);
  box(body, 'rear_bumper_metal', [1.40, .035, .025], [0, .49, -2.39], alloy);
  box(body, 'front_bumper', [1.83, .16, .12], [0, .51, 2.31], trim);
  box(body, 'front_grille', [1.03, .18, .04], [0, .71, 2.385], trim);
  box(body, 'grille_bar', [.83, .027, .05], [0, .71, 2.405], alloy);
  box(body, 'rear_plate', [.40, .12, .025], [0, .81, -2.40], cream);
  box(body, 'high_brake_lens', [.39, .045, .045], [0, 1.78, -2.33], tail);
  if (lod === 'near') {
    for (const side of [-1, 1]) {
      for (const z of [-1.41, -.22, .91]) box(body, `handle_${side}_${z}`,
        [.035, .04, .18], [side * .99, 1.07, z], alloy);
      for (const z of [-1.02, .23]) box(body, `door_seam_${side}_${z}`,
        [.016, .60, .028], [side * .988, .88, z], dark);
      box(body, `window_rail_${side}`, [.05, .038, 3.68], [side * .951, 1.24, -.31], trim);
      box(body, `rear_mudguard_${side}`, [.04, .13, .33], [side * .98, .49, -1.94], dark);
      box(body, `front_mudguard_${side}`, [.04, .13, .33], [side * .98, .49, 1.86], dark);
    }
    box(body, 'rear_wiper', [.49, .025, .03], [0, 1.34, -2.32], trim);
    box(body, 'front_wiper_left', [.50, .025, .03], [-.34, 1.25, 1.54], trim);
    box(body, 'front_wiper_right', [.50, .025, .03], [.34, 1.25, 1.54], trim);
  }
  const used = new THREE.Group(); used.name = 'used_surface'; body.add(used);
  for (const side of [-1, 1]) box(used, `sill_mud_${side}`, [.018, .05, 1.4], [side * .99, .46, -.12], mud);
  used.visible = false;
  const damaged = new THREE.Group(); damaged.name = 'damaged_panels'; body.add(damaged);
  box(damaged, 'rear_hatch_crease', [.74, .10, .04], [.25, 1.10, -2.41], damage).rotation.y = -.08;
  damaged.visible = false;
  const wreck = new THREE.Group(); wreck.name = 'destroyed_panels'; body.add(wreck);
  box(wreck, 'darkened_rear_hatch', [.76, .30, .027], [-.15, 1.28, -2.42], damage);
  box(wreck, 'broken_rear_glass', [.48, .11, .023], [.33, 1.65, -2.35], mud).rotation.z = -.20;
  wreck.visible = false;

  const seats: Record<string, THREE.Object3D> = {};
  for (const [row, z, xs] of [['front', .80, [-.47, .47]], ['middle', -.22, [-.48, .48]],
    ['back', -1.27, [-.48, 0, .48]]] as const) {
    xs.forEach((x, i) => { seats[`${row}_${i}`] = point(root, `seat_${row}_${i}`, [x, .87, z]); });
  }
  const sockets: Record<string, THREE.Object3D> = {};
  for (const side of [-1, 1]) {
    const n = side < 0 ? 'left' : 'right';
    sockets[`headlamp_${n}`] = point(root, `headlamp_${n}`, [side * .65, 1.11, 2.40]);
    sockets[`tail_${n}`] = point(root, `tail_${n}`, [side * .77, 1.17, -2.41]);
    sockets[`indicator_${n}`] = point(root, `indicator_${n}`, [side * .89, 1.0, 2.39]);
    sockets[`wheel_spray_front_${n}`] = point(root, `wheel_spray_front_${n}`, [side * .88, .30, 1.48]);
    sockets[`wheel_spray_rear_${n}`] = point(root, `wheel_spray_rear_${n}`, [side * .88, .30, -1.63]);
  }
  sockets.engine_smoke_fire = point(root, 'engine_smoke_fire', [0, 1.2, 1.68]);
  sockets.exhaust = point(root, 'exhaust', [-.65, .28, -2.37]);
  sockets.exit_left = point(root, 'exit_left', [-1.05, 0, -.46]);
  sockets.exit_right = point(root, 'exit_right', [1.05, 0, -.46]);
  root.userData = { id: 'veh_car7_player_A', lod, axes: '+Y up, +Z forward', widthM: 2.08,
    lengthM: 4.8, logicCollisionRole: 'reference-only', visualPivot: 'front-biased runtime adapter' };
  const setPaint = (color: string) => { paint.color.set(color); light.color.set(color).multiplyScalar(1.16); dark.color.set(color).multiplyScalar(.70); };
  const setCondition = (condition: VehicleCondition) => {
    used.visible = condition !== 'clean';
    damaged.visible = condition === 'damaged' || condition === 'destroyed';
    wreck.visible = condition === 'destroyed';
  };
  setCondition('clean');
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    root.traverse(node => { if (node instanceof THREE.Mesh) {
      geometries.add(node.geometry);
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
    } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  };
  return { root, body, wheels, seats, sockets, setPaint, setCondition, dispose };
}
