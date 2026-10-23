import * as THREE from 'three';
import type { VehicleCondition } from './condition';

/** VEH-03 art sample. Metres, +Y up, +Z forward; no gameplay transforms live here. */
export type Car4Finish = 'coral' | 'jade' | 'cream';
export type Car4Condition = VehicleCondition;
export interface Car4Art {
  root: THREE.Group;
  body: THREE.Group;
  wheels: { frontLeft: THREE.Group; frontRight: THREE.Group; rearLeft: THREE.Group; rearRight: THREE.Group };
  sockets: Record<string, THREE.Object3D>;
  seats: Record<'driver' | 'frontPassenger' | 'rearLeft' | 'rearRight', THREE.Object3D>;
  setFinish: (finish: Car4Finish) => void;
  setPaint: (color: string) => void;
  setCondition: (condition: Car4Condition) => void;
  dispose: () => void;
}

const finishes: Record<Car4Finish, { paint: string; light: string; dark: string }> = {
  coral: { paint: '#d96a4a', light: '#ed9270', dark: '#a6473b' },
  jade: { paint: '#438c83', light: '#70ada2', dark: '#2e655f' },
  cream: { paint: '#d7c59c', light: '#eee0bb', dark: '#a99977' },
};

function polygon(points: [number, number, number][], material: THREE.Material): THREE.Mesh {
  const vertices: number[] = [];
  for (let i = 1; i < points.length - 1; i++) vertices.push(...points[0], ...points[i], ...points[i + 1]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function box(parent: THREE.Object3D, name: string, size: [number, number, number],
  pos: [number, number, number], material: THREE.Material, bevel = 0): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(...size);
  if (bevel > 0) {
    // The low-poly silhouette gets explicit corner facets from neighbouring shaped panels.
    // This parameter is reserved for authoring notes, not a runtime modifier.
  }
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...pos);
  parent.add(mesh);
  return mesh;
}

function point(parent: THREE.Object3D, name: string, x: number, y: number, z: number): THREE.Object3D {
  const socket = new THREE.Object3D();
  socket.name = name;
  socket.position.set(x, y, z);
  parent.add(socket);
  return socket;
}

/** A family master for player and traffic. Detailed LOD is intended for the player camera. */
export function createCar4Art(lod: 'near' | 'far' = 'near'): Car4Art {
  const root = new THREE.Group(); root.name = 'veh_car4_root';
  const body = new THREE.Group(); body.name = 'suspensionVisual'; root.add(body);
  const paint = new THREE.MeshStandardMaterial({ color: finishes.coral.paint, roughness: .42, metalness: .18, flatShading: true });
  const lightPaint = new THREE.MeshStandardMaterial({ color: finishes.coral.light, roughness: .4, metalness: .16, flatShading: true });
  const darkPaint = new THREE.MeshStandardMaterial({ color: finishes.coral.dark, roughness: .56, metalness: .12, flatShading: true });
  const glass = new THREE.MeshStandardMaterial({ color: '#456a72', roughness: .19, metalness: .12, side: THREE.DoubleSide, flatShading: true });
  const glassShade = new THREE.MeshStandardMaterial({ color: '#294952', roughness: .26, metalness: .08, side: THREE.DoubleSide, flatShading: true });
  const rubber = new THREE.MeshStandardMaterial({ color: '#243137', roughness: .87, flatShading: true });
  const tyreSide = new THREE.MeshStandardMaterial({ color: '#17242a', roughness: .94, flatShading: true });
  const alloy = new THREE.MeshStandardMaterial({ color: '#c9d2ce', roughness: .38, metalness: .45, flatShading: true });
  const trim = new THREE.MeshStandardMaterial({ color: '#34424a', roughness: .6, metalness: .12, flatShading: true });
  const lens = new THREE.MeshStandardMaterial({ color: '#f8bd86', roughness: .35, flatShading: true });
  const redLens = new THREE.MeshStandardMaterial({ color: '#b83d42', roughness: .32, flatShading: true });
  const cream = new THREE.MeshStandardMaterial({ color: '#e8dfc8', roughness: .8, flatShading: true });
  const mud = new THREE.MeshStandardMaterial({ color: '#695f56', roughness: 1, flatShading: true });
  const damage = new THREE.MeshStandardMaterial({ color: '#8c4440', roughness: .88, flatShading: true });
  const char = new THREE.MeshStandardMaterial({ color: '#302f32', roughness: 1, flatShading: true });

  // A shallow waist and tapered nose give the car a proper profile at 9:16 game scale.
  box(body, 'central_floor', [1.38, .27, 3.76], [0, .48, 0], darkPaint);
  // The cut arches are real openings: the wheels stay legible from side and rear.
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(-2.02, .39);
    for (const center of [-1.30, 1.32]) {
      shape.lineTo(center - .42, .39);
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        shape.lineTo(center - .42 + .84 * t, .36 + .43 * Math.sin(Math.PI * t));
      }
    }
    shape.lineTo(2.02, .39);
    shape.lineTo(2.04, .91);
    shape.lineTo(1.84, 1.01);
    shape.lineTo(1.18, 1.12);
    shape.lineTo(-1.20, 1.13);
    shape.lineTo(-1.87, 1.02);
    shape.lineTo(-2.04, .82);
    shape.closePath();
    const panel = new THREE.Mesh(new THREE.ShapeGeometry(shape), paint);
    panel.name = `sculpted_side_${side}`;
    panel.rotation.y = -Math.PI / 2;
    panel.position.x = side * .885;
    panel.material.side = THREE.DoubleSide;
    body.add(panel);
    for (const center of [-1.30, 1.32]) {
      const arc = new THREE.EllipseCurve(0, 0, .43, .43, 0, Math.PI, false, 0);
      const points = arc.getPoints(10).map(p => new THREE.Vector3(side * .899, .36 + p.y, center + p.x));
      const lip = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 10, .027, 4, false), darkPaint);
      lip.name = `arch_lip_${side}_${center}`; body.add(lip);
    }
  }
  // Vary the crown height and width through the hood and trunk, without a rectangular shell.
  const hood = polygon([[-.76, 1.11, 1.22], [.76, 1.11, 1.22],
    [.69, 1.01, 1.94], [-.69, 1.01, 1.94]], lightPaint);
  hood.name = 'sloped_hood'; body.add(hood);
  const trunk = polygon([[.75, 1.10, -1.36], [-.75, 1.10, -1.36],
    [-.70, 1.02, -1.94], [.70, 1.02, -1.94]], lightPaint);
  trunk.name = 'sloped_trunk'; body.add(trunk);
  box(body, 'front_nose', [1.46, .29, .14], [0, .77, 2.00], paint);
  box(body, 'rear_tail', [1.52, .27, .14], [0, .82, -1.99], darkPaint);
  for (const side of [-1, 1]) {
    // Door shoulder and skirt have different value, keeping the broad painted areas calm.
    box(body, `shoulder_${side}`, [.075, .11, 2.32], [side * .865, 1.065, -.04], lightPaint);
    box(body, `sill_${side}`, [.07, .09, 2.48], [side * .87, .39, -.02], trim);
  }
  box(body, 'hood_center_crease', [.035, .012, .52], [0, 1.115, 1.42], cream);
  box(body, 'trunk_lid_crease', [.45, .018, .022], [0, 1.075, -1.86], darkPaint);

  // Greenhouse uses sloped panes and separate pillars, rather than a tinted box.
  const roofRear = -1.08, roofFront = .94, roofY = 1.63, shoulderY = 1.12;
  const roof = box(body, 'floating_roof', [1.36, .10, roofFront - roofRear], [0, roofY, (roofFront + roofRear) / 2], lightPaint);
  roof.userData.materialRole = 'paint';
  const windscreen = polygon([[-.67, roofY, roofFront], [.67, roofY, roofFront],
    [.79, shoulderY, 1.29], [-.79, shoulderY, 1.29]], glass);
  windscreen.name = 'windscreen'; body.add(windscreen);
  const rearGlass = polygon([[.67, roofY, roofRear], [-.67, roofY, roofRear],
    [-.79, shoulderY, -1.40], [.79, shoulderY, -1.40]], glassShade);
  rearGlass.name = 'rear_window'; body.add(rearGlass);
  for (const side of [-1, 1]) {
    const x = side;
    const window = polygon([[x * .675, 1.59, -.97], [x * .675, 1.59, .86],
      [x * .79, 1.15, 1.20], [x * .79, 1.15, -1.34]], glass);
    window.name = `side_glass_${side}`; body.add(window);
    box(body, `b_pillar_${side}`, [.065, .46, .085], [side * .735, 1.37, -.14], trim);
    box(body, `window_rail_${side}`, [.065, .045, 2.55], [side * .79, 1.13, -.07], trim);
    box(body, `rain_gutter_${side}`, [.055, .035, 2.04], [side * .695, 1.63, -.06], cream);
  }
  box(body, 'rear_window_lower_seal', [1.52, .05, .06], [0, 1.115, -1.40], trim);
  box(body, 'front_window_lower_seal', [1.52, .05, .06], [0, 1.115, 1.29], trim);
  for (const side of [-1, 1]) {
    // Wide C-pillars and narrow A-pillars make the rear three-quarter silhouette deliberate.
    const cPillar = polygon([[side * .675, 1.62, -1.08], [side * .675, 1.62, -.79],
      [side * .79, 1.13, -1.28], [side * .79, 1.13, -1.42]], darkPaint);
    cPillar.name = `c_pillar_${side}`; body.add(cPillar);
    const aPillar = polygon([[side * .675, 1.62, .85], [side * .675, 1.62, .96],
      [side * .79, 1.13, 1.32], [side * .79, 1.13, 1.20]], paint);
    aPillar.name = `a_pillar_${side}`; body.add(aPillar);
  }

  const wheels = {} as Car4Art['wheels'];
  for (const [key, x, z, steerable] of [
    ['frontLeft', -.79, 1.32, true], ['frontRight', .79, 1.32, true],
    ['rearLeft', -.79, -1.30, false], ['rearRight', .79, -1.30, false],
  ] as const) {
    const pivot = new THREE.Group(); pivot.name = `${key}_steer`; pivot.position.set(x, .35, z); root.add(pivot);
    const spin = new THREE.Group(); spin.name = `${key}_spin`; pivot.add(spin);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .22, lod === 'near' ? 12 : 8), rubber);
    tire.name = `${key}_tire`; tire.rotation.z = Math.PI / 2; spin.add(tire);
    for (const facing of [-1, 1]) {
      const sidewall = new THREE.Mesh(new THREE.CylinderGeometry(.258, .258, .008, lod === 'near' ? 12 : 8), tyreSide);
      sidewall.rotation.z = Math.PI / 2; sidewall.position.x = facing * .116; spin.add(sidewall);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .012, lod === 'near' ? 10 : 6), alloy);
      hub.rotation.z = Math.PI / 2; hub.position.x = facing * .122; spin.add(hub);
      if (lod === 'near') for (let spoke = 0; spoke < 5; spoke++) {
        const a = spoke * Math.PI * 2 / 5;
        const bar = box(spin, `${key}_spoke_${spoke}_${facing}`, [.015, .038, .12],
          [facing * .135, Math.cos(a) * .087, Math.sin(a) * .087], cream);
        bar.rotation.x = a;
      }
    }
    wheels[key] = pivot;
    pivot.userData.steerable = steerable;
    pivot.userData.spin = spin;
  }

  // The lamp and bumper rhythm is deliberately strongest at the rear camera angle.
  box(body, 'rear_bumper', [1.69, .16, .15], [0, .46, -2.03], trim);
  box(body, 'rear_bumper_insert', [1.41, .055, .025], [0, .48, -2.118], alloy);
  box(body, 'front_bumper', [1.67, .15, .13], [0, .47, 2.03], trim);
  for (const side of [-1, 1]) {
    box(body, `tail_outer_${side}`, [.34, .21, .045], [side * .64, .92, -2.035], redLens);
    box(body, `tail_upper_${side}`, [.25, .065, .052], [side * .64, 1.035, -2.06], lens);
    box(body, `headlamp_${side}`, [.41, .16, .05], [side * .60, .94, 2.07], cream);
    box(body, `turn_front_${side}`, [.11, .12, .055], [side * .84, .82, 2.065], lens);
    box(body, `rear_reflector_${side}`, [.12, .045, .052], [side * .72, .52, -2.11], redLens);
    box(body, `mirror_stalk_${side}`, [.05, .11, .09], [side * .88, 1.23, .83], trim);
    box(body, `mirror_${side}`, [.10, .12, .21], [side * .90, 1.29, .85], paint);
  }
  box(body, 'rear_light_bridge', [.58, .045, .04], [0, .98, -2.045], darkPaint);
  box(body, 'license_recess', [.43, .15, .024], [0, .69, -2.046], trim);
  box(body, 'license_plate', [.36, .11, .028], [0, .69, -2.067], cream);
  box(body, 'front_grille', [.84, .17, .035], [0, .64, 2.079], trim);
  box(body, 'front_grille_bar', [.70, .035, .043], [0, .64, 2.102], alloy);

  if (lod === 'near') {
    for (const side of [-1, 1]) {
      for (const z of [-.55, .66]) box(body, `handle_${side}_${z}`, [.035, .035, .16], [side * .916, .99, z], alloy);
      box(body, `door_cut_${side}`, [.018, .53, .024], [side * .913, .72, -.17], darkPaint);
      box(body, `door_rear_edge_${side}`, [.018, .38, .024], [side * .911, .71, -1.13], darkPaint);
      box(body, `rocker_chrome_${side}`, [.025, .028, 1.37], [side * .908, .45, -.06], alloy);
      box(body, `wiper_${side}`, [.36, .018, .025], [side * .31, 1.135, 1.29], trim);
    }
    box(body, 'rear_spoiler_lip', [1.53, .055, .12], [0, 1.095, -1.93], darkPaint);
    box(body, 'exhaust_tip', [.13, .08, .10], [-.54, .29, -2.07], alloy);
    // Small tied rain kit: a single lived-in accent, clear of the windows and collision width.
    for (const z of [-.63, .51]) {
      box(body, `rack_foot_L_${z}`, [.06, .08, .10], [-.56, 1.72, z], trim);
      box(body, `rack_foot_R_${z}`, [.06, .08, .10], [.56, 1.72, z], trim);
      box(body, `rack_crossbar_${z}`, [1.18, .045, .065], [0, 1.75, z], alloy);
    }
    const rainKit = box(body, 'folded_rain_kit', [.64, .12, .67], [0, 1.79, -.05], glassShade);
    rainKit.rotation.y = .03;
    for (const z of [-.27, .18]) box(body, `rain_kit_strap_${z}`, [.68, .025, .045], [0, 1.86, z], cream);
  }

  // Cosmetic state meshes are explicit and never mutate damage or collision logic.
  const usedGroup = new THREE.Group(); usedGroup.name = 'used_surface'; body.add(usedGroup);
  for (const side of [-1, 1]) {
    box(usedGroup, `mud_sill_${side}`, [.012, .065, .92], [side * .914, .425, -.76], mud);
    box(usedGroup, `mud_arch_${side}`, [.015, .065, .35], [side * .915, .56, 1.46], mud);
  }
  const damagedGroup = new THREE.Group(); damagedGroup.name = 'damaged_panels'; body.add(damagedGroup);
  const bentBumper = box(damagedGroup, 'bent_rear_bumper', [1.05, .12, .09], [.20, .51, -2.04], damage);
  bentBumper.rotation.y = -.10;
  const crease = polygon([[.12, .90, -2.075], [.52, .90, -2.075], [.36, .72, -2.11]], damage);
  crease.name = 'rear_impact_crease'; damagedGroup.add(crease);
  const wreckGroup = new THREE.Group(); wreckGroup.name = 'destroyed_overlay'; body.add(wreckGroup);
  box(wreckGroup, 'charred_hood_edge', [1.10, .045, .18], [.10, 1.135, 1.91], char);
  box(wreckGroup, 'folded_trunk', [1.21, .10, .22], [.16, 1.09, -1.87], darkPaint).rotation.y = -.07;

  const sockets: Record<string, THREE.Object3D> = {};
  const addSocket = (name: string, x: number, y: number, z: number) => { sockets[name] = point(root, name, x, y, z); };
  for (const side of [-1, 1]) {
    const name = side < 0 ? 'left' : 'right';
    addSocket(`headlamp_${name}`, side * .60, .94, 2.08);
    addSocket(`tail_${name}`, side * .64, .92, -2.07);
    addSocket(`brake_${name}`, side * .64, .92, -2.07);
    addSocket(`indicator_front_${name}`, side * .84, .82, 2.09);
    addSocket(`indicator_rear_${name}`, side * .64, 1.035, -2.07);
    addSocket(`wheel_spray_${name}_front`, side * .79, .31, 1.32);
    addSocket(`wheel_spray_${name}_rear`, side * .79, .31, -1.30);
  }
  addSocket('exhaust', -.54, .29, -2.09);
  addSocket('engine_smoke_fire', 0, 1.16, 1.56);
  addSocket('contact_spark_front', 0, .35, 2.06);
  addSocket('contact_spark_rear', 0, .35, -2.06);
  addSocket('exit_left', -1.03, 0, -.30);
  addSocket('exit_right', 1.03, 0, -.30);
  const seats = {
    driver: point(root, 'seat_driver', -.37, .81, .53),
    frontPassenger: point(root, 'seat_front_passenger', .37, .81, .53),
    rearLeft: point(root, 'seat_rear_left', -.37, .81, -.70),
    rearRight: point(root, 'seat_rear_right', .37, .81, -.70),
  };
  // Overload is resolved by the existing roster renderer; no extra capacity is invented here.
  root.userData = { id: 'veh_car4_player_A', axes: '+Y up, +Z forward', widthM: 1.86, lengthM: 4.2,
    logicCollisionRole: 'reference-only', lod, softMirrorOverhangM: .05 };

  const setFinish = (finish: Car4Finish) => {
    paint.color.set(finishes[finish].paint);
    lightPaint.color.set(finishes[finish].light);
    darkPaint.color.set(finishes[finish].dark);
  };
  const setPaint = (color: string) => {
    paint.color.set(color);
    lightPaint.color.set(color).multiplyScalar(1.16);
    darkPaint.color.set(color).multiplyScalar(.72);
  };
  const setCondition = (condition: Car4Condition) => {
    usedGroup.visible = condition !== 'clean';
    damagedGroup.visible = condition === 'damaged' || condition === 'destroyed';
    wreckGroup.visible = condition === 'destroyed';
  };
  setCondition('clean');
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    root.traverse(node => { if (node instanceof THREE.Mesh) {
      geometries.add(node.geometry);
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
    } });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
  };
  return { root, body, wheels, sockets, seats, setFinish, setPaint, setCondition, dispose };
}
