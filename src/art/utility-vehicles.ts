import * as THREE from 'three';
import type { VehicleCondition } from './condition';

export type UtilityVehicleKind = 'tricycle' | 'bus' | 'truck' | 'container';
export type VehicleRole = 'player' | 'traffic';
export interface UtilityVehicleArt {
  root: THREE.Group;
  body: THREE.Group;
  tractor?: THREE.Group;
  trailer?: THREE.Group;
  wheels: THREE.Group[];
  seats: THREE.Object3D[];
  sockets: Record<string, THREE.Object3D>;
  setPaint: (color: string) => void;
  setCondition: (condition: VehicleCondition) => void;
  dispose: () => void;
}
const specs = {
  tricycle: { width: 1.76, length: 3.2, color: '#c99455' },
  bus: { width: 2.72, length: 10, color: '#67a5a8' },
  truck: { width: 2.72, length: 7, color: '#af8c70' },
  container: { width: 2.88, length: 15, color: '#b67a5c' },
} as const;
function material(color: string, roughness = .62, metalness = .08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true, side: THREE.DoubleSide });
}
function block(parent: THREE.Object3D, name: string, size: [number, number, number],
  pos: [number, number, number], mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function face(parent: THREE.Object3D, name: string, pts: [number, number, number][], mat: THREE.Material) {
  const values: number[] = [];
  for (let i = 1; i < pts.length - 1; i++) values.push(...pts[0], ...pts[i], ...pts[i + 1]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(values, 3)); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, mat); mesh.name = name; parent.add(mesh); return mesh;
}
function socket(parent: THREE.Object3D, name: string, pos: [number, number, number]) {
  const p = new THREE.Object3D(); p.name = name; p.position.set(...pos); parent.add(p); return p;
}

export function createUtilityVehicleArt(kind: UtilityVehicleKind, role: VehicleRole = 'player',
  lod: 'near' | 'far' = 'near'): UtilityVehicleArt {
  const spec = specs[kind];
  const root = new THREE.Group(); root.name = `veh_${kind}_${role}_root`;
  const body = new THREE.Group(); body.name = 'suspensionVisual'; root.add(body);
  const paint = material(spec.color, .46, .16), roofPaint = material(spec.color, .5, .12);
  const light = material('#ddd2af', .55, .08);
  const dark = material('#4e5a5b', .69, .08), rubber = material('#202b30', .9);
  const glass = material('#4b6d74', .24, .08), steel = material('#b8c4c1', .43, .4);
  const red = material('#b74548', .37), amber = material('#e9b96f', .41);
  const wood = material('#876f54', .83), mud = material('#625c54', 1);
  const wheels: THREE.Group[] = [], seats: THREE.Object3D[] = [], sockets: Record<string, THREE.Object3D> = {};
  const radius = kind === 'tricycle' ? .30 : kind === 'bus' ? .49 : kind === 'truck' ? .52 : .52;
  function wheel(parent: THREE.Object3D, name: string, x: number, z: number, r = radius) {
    const pivot = new THREE.Group(); pivot.name = `${name}_spin`; pivot.position.set(x, r, z); parent.add(pivot);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, kind === 'tricycle' ? .18 : .28, lod === 'near' ? 12 : 8), rubber);
    tyre.rotation.z = Math.PI / 2; tyre.name = `${name}_tyre`; pivot.add(tyre);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * .48, r * .48, .015, lod === 'near' ? 10 : 6), steel);
    hub.rotation.z = Math.PI / 2; hub.position.x = x > 0 ? .15 : -.15; pivot.add(hub);
    wheels.push(pivot); return pivot;
  }
  function lampPair(parent: THREE.Object3D, frontZ: number, rearZ: number, x: number, y: number) {
    for (const side of [-1, 1]) {
      block(parent, `headlamp_${side}`, [.27, .15, .04], [side * x, y, frontZ], light);
      block(parent, `tail_${side}`, [.22, .17, .04], [side * x, y, rearZ], red);
      block(parent, `front_indicator_${side}`, [.08, .09, .045], [side * (x + .19), y, frontZ], amber);
      block(parent, `rear_indicator_${side}`, [.08, .08, .045], [side * (x + .16), y, rearZ], amber);
      sockets[`headlamp_${side}`] = socket(root, `headlamp_socket_${side}`, [side * x, y, frontZ + .03]);
      sockets[`tail_${side}`] = socket(root, `tail_socket_${side}`, [side * x, y, rearZ - .03]);
    }
  }

  let tractor: THREE.Group | undefined, trailer: THREE.Group | undefined;
  if (kind === 'tricycle') {
    const trayShade = material('#72573f', .83), trim = material('#e2c18b', .68);
    const plank = material('#a1845e', .86);
    const front = new THREE.Group(); front.name = 'front_steer'; body.add(front);
    wheel(front, 'front', 0, 1.18, .29);
    const frontFender = new THREE.Mesh(new THREE.TorusGeometry(.315, .048, 5, 16, Math.PI), paint);
    frontFender.name = 'front_wheel_fender'; frontFender.rotation.y = Math.PI / 2;
    frontFender.position.set(0, .30, 1.18); front.add(frontFender);
    for (const side of [-1, 1]) {
      block(front, `fork_${side}`, [.055, .62, .055], [side * .11, .72, 1.17], steel);
      block(body, `step_${side}`, [.14, .05, .47], [side * .35, .48, .43], dark);
    }
    block(body, 'front_bike_nose', [.52, .48, .73], [0, .80, .93], paint);
    const noseCap = new THREE.Mesh(new THREE.CylinderGeometry(.20, .26, .36, 9), paint);
    noseCap.name = 'rounded_front_cowl'; noseCap.position.set(0, 1.09, 1.07); body.add(noseCap);
    block(body, 'front_cowl_inset', [.31, .07, .32], [0, 1.27, 1.07], trim);
    block(front, 'handlebar', [.83, .055, .065], [0, 1.34, .91], steel);
    block(front, 'front_lamp', [.29, .20, .08], [0, 1.08, 1.53], light);
    block(body, 'engine', [.46, .30, .37], [0, .52, .51], dark);
    block(body, 'driver_saddle', [.43, .11, .49], [0, 1.06, .28], dark);
    block(body, 'rear_axle_beam', [1.41, .09, .10], [0, .34, -1.08], steel);
    for (const side of [-1, 1]) {
      block(body, `longitudinal_frame_${side}`, [.075, .10, 2.35],
        [side * .50, .55, -.35], dark);
      const brace = block(body, `tray_support_${side}`, [.06, .08, .83],
        [side * .50, .57, -1.06], steel);
      brace.rotation.x = -.25;
    }
    // Open tray and thick end boards keep rear cargo/person space legible.
    block(body, 'cargo_floor', [1.52, .14, 1.81], [0, .74, -.63], wood);
    for (const side of [-1, 1]) {
      block(body, `tray_side_${side}`, [.11, .44, 1.80], [side * .70, 1.02, -.63], paint);
      block(body, `tray_upper_rail_${side}`, [.07, .05, 1.79], [side * .70, 1.25, -.63], steel);
      block(body, `tray_outer_plank_${side}`, [.027, .25, 1.52],
        [side * .765, 1.03, -.62], wood);
      block(body, `tray_outer_livery_${side}`, [.032, .047, 1.56],
        [side * .783, .92, -.62], trim);
      for (const z of [-1.23, -.64, -.05]) block(body, `tray_stanchion_${side}_${z}`,
        [.035, .38, .055], [side * .787, 1.05, z], trayShade);
      wheel(root, `rear_${side}`, side * .65, -1.08, .31);
      const rearFender = new THREE.Mesh(new THREE.TorusGeometry(.33, .044, 5, 16, Math.PI), paint);
      rearFender.name = `rear_wheel_fender_${side}`; rearFender.rotation.y = Math.PI / 2;
      rearFender.position.set(side * .65, .32, -1.08); body.add(rearFender);
    }
    block(body, 'tail_board', [1.50, .44, .10], [0, 1.02, -1.51], paint);
    block(body, 'rear_wood_inset', [1.24, .25, .025], [0, 1.02, -1.57], wood);
    block(body, 'rear_tail_rail', [1.50, .045, .07], [0, 1.25, -1.56], steel);
    for (const side of [-1, 1]) {
      block(body, `rear_corner_plate_${side}`, [.09, .41, .035],
        [side * .68, 1.03, -1.575], trayShade);
      block(body, `rear_lamp_${side}`, [.18, .11, .055],
        [side * .55, .82, -1.575], red);
    }
    if (lod === 'near') {
      for (const x of [-.46, 0, .46]) block(body, `tray_floor_plank_${x}`,
        [.41, .018, 1.66], [x, .82, -.63], plank);
      for (const z of [-1.28, -.52, .21]) block(body, `tray_slat_${z}`, [1.37, .03, .06], [0, .83, z], light);
      for (const y of [.91, 1.13]) block(body, `tailgate_plank_seam_${y}`,
        [1.20, .018, .024], [0, y, -1.586], trayShade);
      block(body, 'tailgate_center_latch', [.15, .13, .052], [0, 1.16, -1.595], steel);
      for (const side of [-1, 1]) {
        block(body, `tailgate_lower_hinge_${side}`, [.11, .11, .052],
          [side * .57, .86, -1.595], steel);
        block(body, `side_tray_rear_reflector_${side}`, [.024, .08, .17],
          [side * .80, 1.09, -1.39], red);
      }
      block(body, 'number_plate', [.27, .13, .03], [0, .65, -1.59], light);
    }
    seats.push(socket(root, 'seat_driver', [0, 1.09, .25]));
    for (const x of [-.44, .44]) for (const z of [-.98, -.32]) seats.push(socket(root, `tray_seat_${x}_${z}`, [x, .82, z]));
    sockets.cargo_drop = socket(root, 'cargo_drop', [0, .77, -1.59]);
    sockets.engine_smoke_fire = socket(root, 'engine_smoke_fire', [0, .68, .57]);
    sockets.wheel_spray_front = socket(root, 'wheel_spray_front', [0, .25, 1.18]);
    sockets.wheel_spray_rear = socket(root, 'wheel_spray_rear', [0, .25, -1.08]);
  } else if (kind === 'bus') {
    const stripe = material('#d9825e', .61), sign = material('#e7c57e', .55);
    block(body, 'chassis', [2.46, .48, 9.45], [0, .75, 0], dark);
    block(body, 'passenger_body', [2.52, 1.75, 9.44], [0, 1.77, 0], paint);
    block(body, 'roof_crown', [2.37, .16, 9.25], [0, 2.75, 0], roofPaint);
    for (const side of [-1, 1]) for (const z of [-4.53, 4.53]) {
      const corner = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.58, 8), paint);
      corner.name = `rounded_corner_${side}_${z}`;
      corner.position.set(side * 1.10, 1.78, z); body.add(corner);
    }
    // Front and rear are inset; the bus reads as a cabin, not a stretched rectangle.
    face(body, 'sloped_windscreen', [[-1.12, 2.62, 4.76], [1.12, 2.62, 4.76],
      [1.16, 1.81, 4.85], [-1.16, 1.81, 4.85]], glass);
    face(body, 'sloped_rear_window', [[1.12, 2.62, -4.76], [-1.12, 2.62, -4.76],
      [-1.15, 2.02, -4.84], [1.15, 2.02, -4.84]], glass);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const z = -3.79 + i * 1.05;
        block(body, `window_${side}_${i}`, [.027, .67, .86], [side * 1.274, 2.22, z], glass);
        block(body, `pillar_${side}_${i}`, [.06, .74, .07], [side * 1.29, 2.23, z + .48], dark);
      }
      block(body, `belt_${side}`, [.06, .09, 9.18], [side * 1.29, 1.77, 0], light);
      block(body, `livery_ribbon_${side}`, [.055, .14, 8.92],
        [side * 1.296, 1.29, 0], stripe);
      block(body, `window_crown_${side}`, [.055, .055, 8.91],
        [side * 1.298, 2.61, 0], dark);
      block(body, `side_skirt_${side}`, [.08, .20, 8.72], [side * 1.25, .79, 0], dark);
      wheel(root, `front_${side}`, side * 1.18, 3.51);
      wheel(root, `rear_${side}`, side * 1.18, -3.49);
    }
    block(body, 'service_door', [.06, 1.81, 1.20], [1.30, 1.45, 2.80], glass);
    block(body, 'door_split', [.07, 1.83, .05], [1.34, 1.45, 2.80], steel);
    block(body, 'door_header', [.072, .10, 1.23], [1.34, 2.40, 2.80], sign);
    block(body, 'front_destination_frame', [1.42, .21, .065], [0, 2.73, 4.83], dark);
    block(body, 'front_destination_face', [1.17, .14, .025], [0, 2.73, 4.87], sign);
    for (const x of [-.36, -.10, .17, .41]) block(body, `front_route_glyph_${x}`,
      [.10, .07, .027], [x, 2.73, 4.89], dark);
    block(body, 'rear_route_panel', [1.05, .19, .055], [0, 2.47, -4.84], sign);
    block(body, 'rear_grille', [1.33, .27, .05], [0, 1.31, -4.88], dark);
    for (const y of [1.23, 1.31, 1.39]) block(body, `rear_grille_slit_${y}`,
      [1.12, .025, .057], [0, y, -4.92], steel);
    lampPair(body, 4.86, -4.86, .97, 1.21);
    block(body, 'front_lower_valance', [1.48, .19, .065], [0, 1.01, 4.88], stripe);
    block(body, 'front_bumper', [2.43, .17, .14], [0, .77, 4.89], dark);
    block(body, 'rear_bumper', [2.43, .17, .14], [0, .77, -4.89], dark);
    if (lod === 'near') {
      const roofRib = material('#c9c8ae', .72);
      for (const z of [-3.75, -2.67, -1.58, .93, 2.12, 3.35])
        block(body, `roof_cross_rib_${z}`, [2.16, .024, .055], [0, 2.85, z], roofRib);
      block(body, 'roof_escape_hatch_frame', [1.01, .055, .91], [0, 2.87, 2.69], steel);
      block(body, 'roof_escape_hatch', [.85, .022, .74], [0, 2.91, 2.69], light);
      for (const side of [-1, 1])
        block(body, `roof_rain_gutter_${side}`, [.045, .035, 8.84],
          [side * 1.20, 2.83, 0], roofRib);
      block(body, 'roof_aircon_base', [1.06, .14, 1.86], [0, 2.88, -.40], steel);
      block(body, 'roof_aircon_top', [.89, .08, 1.63], [0, 2.99, -.40], light);
      for (const z of [-.94, -.40, .14]) block(body, `roof_aircon_grille_${z}`,
        [.70, .02, .10], [0, 3.04, z], dark);
      for (const z of [-3.10, 3.10]) block(body, `roof_vent_${z}`,
        [.73, .08, .43], [0, 2.87, z], dark);
      block(body, 'rear_plate', [.45, .13, .025], [0, 1.0, -4.95], light);
    }
    // 25 seats including driver; visible roster stays under runtime control.
    seats.push(socket(root, 'seat_driver', [-.68, 1.15, 4.12]));
    for (let row = 0; row < 12; row++) for (const side of [-1, 1])
      seats.push(socket(root, `seat_${row}_${side}`, [side * .73, 1.15, 3.25 - row * .62]));
    sockets.engine_smoke_fire = socket(root, 'engine_smoke_fire', [0, 1.05, -4.15]);
    sockets.cargo_drop = socket(root, 'cargo_drop', [0, 1.05, -4.94]);
  } else if (kind === 'truck') {
    const canvas = material('#ddd1aa', .87), accent = material('#c27c5a', .58);
    block(body, 'ladder_chassis', [2.28, .38, 6.55], [0, .83, 0], dark);
    block(body, 'cab_lower', [2.35, 1.30, 2.42], [0, 1.36, 2.12], paint);
    block(body, 'cab_roof', [2.17, .15, 2.15], [0, 2.47, 2.09], roofPaint);
    block(body, 'cab_sun_visor', [2.11, .08, .27], [0, 2.48, 3.15], dark);
    face(body, 'angled_truck_windscreen', [[-1.02, 2.39, 3.06], [1.02, 2.39, 3.06],
      [1.08, 1.63, 3.36], [-1.08, 1.63, 3.36]], glass);
    for (const side of [-1, 1]) {
      block(body, `cab_side_window_${side}`, [.035, .52, .78], [side * 1.19, 2.12, 2.10], glass);
      block(body, `mirror_${side}`, [.16, .27, .22], [side * 1.27, 2.02, 3.00], dark);
      block(body, `cargo_side_${side}`, [.10, 1.40, 4.24], [side * 1.23, 1.57, -1.17], wood);
      block(body, `cargo_livery_${side}`, [.045, .14, 4.12], [side * 1.294, 1.21, -1.17], accent);
      block(body, `upper_cargo_rail_${side}`, [.055, .085, 4.22], [side * 1.298, 2.31, -1.17], steel);
      block(body, `lower_cargo_rail_${side}`, [.055, .095, 4.23], [side * 1.298, .91, -1.17], dark);
      for (const z of [-2.85, -1.70, -.55, .60]) block(body, `cargo_rib_${side}_${z}`,
        [.035, 1.43, .08], [side * 1.29, 1.57, z], steel);
      block(body, `front_cab_corner_${side}`, [.19, 1.17, .19],
        [side * 1.08, 1.53, 3.25], paint);
      block(body, `cab_step_${side}`, [.20, .10, .67],
        [side * 1.16, .69, 2.17], steel);
      wheel(root, `front_${side}`, side * 1.15, 2.48);
      wheel(root, `rear_${side}`, side * 1.15, -2.47);
    }
    block(body, 'cargo_floor', [2.36, .16, 4.34], [0, .94, -1.17], wood);
    block(body, 'cargo_roof_underlay', [2.38, .10, 4.27], [0, 2.30, -1.17], canvas);
    face(body, 'tarp_slope_left', [[-1.18, 2.39, -3.33], [0, 2.53, -3.33],
      [0, 2.53, .99], [-1.18, 2.39, .99]], canvas);
    face(body, 'tarp_slope_right', [[0, 2.53, -3.33], [1.18, 2.39, -3.33],
      [1.18, 2.39, .99], [0, 2.53, .99]], canvas);
    block(body, 'tarp_ridge', [.10, .055, 4.28], [0, 2.54, -1.17], light);
    block(body, 'rear_gate', [2.30, 1.40, .10], [0, 1.59, -3.37], wood);
    for (const y of [1.12, 1.59, 2.06]) block(body, `rear_gate_slip_${y}`,
      [2.19, .055, .055], [0, y, -3.44], dark);
    for (const side of [-1, 1]) block(body, `rear_latch_${side}`, [.07, .87, .04], [side * .65, 1.59, -3.44], steel);
    block(body, 'rear_fleet_badge', [.61, .17, .035], [0, 1.72, -3.46], accent);
    block(body, 'rear_reflector', [1.60, .07, .035], [0, .94, -3.46], amber);
    block(body, 'front_grille', [.90, .28, .04], [0, 1.12, 3.37], dark);
    for (const y of [1.03, 1.11, 1.19]) block(body, `grille_slit_${y}`,
      [.80, .024, .047], [0, y, 3.40], steel);
    block(body, 'front_fleet_badge', [.43, .10, .045], [0, 1.51, 3.39], accent);
    lampPair(body, 3.40, -3.44, 1.0, 1.15);
    block(body, 'front_bumper', [2.38, .18, .14], [0, .69, 3.40], dark);
    block(body, 'rear_bumper', [2.40, .15, .13], [0, .71, -3.45], dark);
    if (lod === 'near') for (const z of [-2.76, -1.08, .61]) {
      face(body, `tarp_bow_left_${z}`, [[-1.17, 2.41, z - .025], [0, 2.55, z - .025],
        [0, 2.55, z + .025], [-1.17, 2.41, z + .025]], dark);
      face(body, `tarp_bow_right_${z}`, [[0, 2.55, z - .025], [1.17, 2.41, z - .025],
        [1.17, 2.41, z + .025], [0, 2.55, z + .025]], dark);
      for (const side of [-1, 1]) block(body, `tarp_tie_${side}_${z}`,
        [.055, .17, .05], [side * 1.22, 2.30, z], steel);
    }
    seats.push(socket(root, 'seat_driver', [-.57, 1.40, 2.16]));
    seats.push(socket(root, 'seat_passenger_left', [.32, 1.40, 2.16]));
    seats.push(socket(root, 'seat_passenger_right', [.70, 1.40, 2.16]));
    sockets.cargo_drop = socket(root, 'cargo_drop', [0, 1.04, -3.50]);
    sockets.engine_smoke_fire = socket(root, 'engine_smoke_fire', [0, 1.92, 2.91]);
  } else {
    const roofRib = material('#c3b293', .72), fleet = material('#e6b466', .53);
    tractor = new THREE.Group(); tractor.name = 'tractor'; body.add(tractor);
    trailer = new THREE.Group(); trailer.name = 'trailer'; root.add(trailer);
    block(tractor, 'tractor_chassis', [2.38, .42, 4.38], [0, .88, 5.17], dark);
    block(tractor, 'tractor_cab', [2.38, 1.72, 2.50], [0, 1.73, 5.98], paint);
    block(tractor, 'cab_roof', [2.20, .15, 2.28], [0, 2.66, 5.93], roofPaint);
    block(tractor, 'cab_sun_visor', [2.18, .09, .25], [0, 2.69, 7.07], dark);
    face(tractor, 'windscreen', [[-1.06, 2.58, 7.04], [1.06, 2.58, 7.04],
      [1.14, 1.82, 7.30], [-1.14, 1.82, 7.30]], glass);
    for (const side of [-1, 1]) {
      block(tractor, `side_window_${side}`, [.035, .56, .78], [side * 1.21, 2.19, 5.96], glass);
      block(tractor, `mirror_${side}`, [.14, .27, .20], [side * 1.31, 2.07, 6.83], dark);
      block(tractor, `fuel_tank_${side}`, [.18, .35, 1.03], [side * 1.20, .83, 4.73], steel);
      block(tractor, `side_step_${side}`, [.23, .09, .68], [side * 1.22, .62, 6.10], dark);
      wheel(tractor, `tractor_front_${side}`, side * 1.18, 6.50);
      wheel(tractor, `tractor_rear_${side}`, side * 1.18, 3.65);
    }
    block(tractor, 'front_grille', [1.11, .37, .04], [0, 1.13, 7.34], dark);
    for (const y of [1.01, 1.10, 1.19, 1.28]) block(tractor, `front_grille_slit_${y}`,
      [.96, .026, .047], [0, y, 7.37], steel);
    block(tractor, 'front_fleet_badge', [.48, .12, .045], [0, 1.67, 7.34], fleet);
    block(tractor, 'front_bumper', [2.51, .18, .12], [0, .67, 7.35], steel);
    for (const side of [-1, 1]) {
      block(tractor, `headlamp_${side}`, [.31, .16, .04], [side * 1.00, 1.26, 7.36], light);
      sockets[`headlamp_${side}`] = socket(root, `headlamp_socket_${side}`, [side * 1.00, 1.26, 7.39]);
    }
    const hitch = socket(root, 'hitch', [0, 1.10, 3.13]); sockets.hitch = hitch;
    block(tractor, 'fifth_wheel', [1.15, .09, .91], [0, 1.14, 3.23], dark);
    block(trailer, 'trailer_floor', [2.61, .30, 10.29], [0, 1.31, -2.10], dark);
    block(trailer, 'container_shell', [2.61, 2.42, 10.19], [0, 2.61, -2.15], wood);
    block(trailer, 'container_roof', [2.55, .09, 10.17], [0, 3.85, -2.15], roofPaint);
    block(trailer, 'roof_center_channel', [.37, .025, 10.02], [0, 3.91, -2.15], roofRib);
    for (const z of [-6.65, -5.55, -4.45, -3.35, -2.25, -1.15, -.05, 1.05, 2.15])
      block(trailer, `roof_cross_rib_${z}`, [2.51, .035, .055], [0, 3.92, z], roofRib);
    for (const side of [-1, 1]) {
      for (let i = 0; i < (lod === 'near' ? 12 : 7); i++) {
        const z = -6.91 + i * (lod === 'near' ? .86 : 1.43);
        block(trailer, `cargo_rib_${side}_${i}`, [.04, 2.29, .055], [side * 1.328, 2.63, z], dark);
      }
      block(trailer, `top_cargo_rail_${side}`, [.055, .12, 10.12],
        [side * 1.33, 3.76, -2.15], steel);
      block(trailer, `bottom_cargo_rail_${side}`, [.055, .13, 10.12],
        [side * 1.33, 1.43, -2.15], dark);
      block(trailer, `fleet_side_stripe_${side}`, [.052, .13, 9.99],
        [side * 1.338, 2.03, -2.15], fleet);
      for (const z of [-7.08, 2.77]) block(trailer, `corner_casting_${side}_${z}`,
        [.16, 2.42, .16], [side * 1.27, 2.60, z], steel);
      wheel(trailer, `trailer_rear_${side}_a`, side * 1.18, -5.85);
      wheel(trailer, `trailer_rear_${side}_b`, side * 1.18, -6.67);
      block(trailer, `rear_latch_${side}`, [.08, 1.45, .04], [side * .69, 2.54, -7.30], steel);
      for (const y of [1.71, 3.39]) block(trailer, `rear_hinge_${side}_${y}`,
        [.17, .18, .055], [side * 1.02, y, -7.34], dark);
      block(trailer, `tail_${side}`, [.22, .14, .04], [side * 1.04, 1.31, -7.32], red);
      sockets[`tail_${side}`] = socket(root, `tail_socket_${side}`, [side * 1.04, 1.31, -7.35]);
    }
    block(trailer, 'rear_doors', [2.51, 2.33, .075], [0, 2.58, -7.28], wood);
    block(trailer, 'rear_center_seam', [.05, 2.30, .04], [0, 2.58, -7.34], dark);
    block(trailer, 'rear_upper_fascia', [2.47, .11, .045], [0, 3.70, -7.35], roofRib);
    block(trailer, 'rear_fleet_panel', [.78, .21, .046], [0, 2.84, -7.36], fleet);
    block(trailer, 'rear_reflector_bar', [1.88, .10, .046], [0, 1.47, -7.36], amber);
    seats.push(socket(root, 'seat_driver', [-.58, 1.55, 5.98]));
    seats.push(socket(root, 'seat_passenger', [.58, 1.55, 5.98]));
    sockets.cargo_drop = socket(root, 'cargo_drop', [0, 1.65, -7.38]);
    sockets.engine_smoke_fire = socket(root, 'engine_smoke_fire', [0, 1.80, 6.88]);
    root.userData.articulated = role === 'player';
  }
  if (kind !== 'tricycle') {
    sockets.exhaust = socket(root, 'exhaust', [-.80, .64, kind === 'bus' ? -4.77 : kind === 'truck' ? 2.45 : 4.37]);
    sockets.contact_spark_front = socket(root, 'contact_spark_front', [0, .43, spec.length / 2]);
    sockets.contact_spark_rear = socket(root, 'contact_spark_rear', [0, .43, -spec.length / 2]);
  }
  const used = new THREE.Group(); used.name = 'used_surface'; body.add(used);
  block(used, 'road_mud_band', [Math.min(spec.width - .20, 2.5), .065, Math.min(spec.length * .48, 3)],
    [0, .56, -spec.length * .19], mud);
  used.visible = false;
  const damaged = new THREE.Group(); damaged.name = 'damaged_panels'; root.add(damaged);
  block(damaged, 'side_crease', [.04, .23, Math.min(1.1, spec.length * .27)],
    [spec.width * .44, kind === 'tricycle' ? .91 : 1.22, -spec.length * .25], dark);
  damaged.visible = false;
  const wreck = new THREE.Group(); wreck.name = 'destroyed_panels'; root.add(wreck);
  block(wreck, 'rear_damage', [Math.min(spec.width * .54, 1.8), .27, .045],
    [0, kind === 'tricycle' ? .98 : 1.27, -spec.length * .48], mud).rotation.z = -.07;
  wreck.visible = false;
  root.userData = { ...root.userData, id: `veh_${kind}_${role}_A`, axes: '+Y up, +Z forward',
    widthM: spec.width, lengthM: spec.length, lod, role, logicCollisionRole: 'reference-only' };
  const setPaint = (color: string) => {
    paint.color.set(color);
    roofPaint.color.set(color).offsetHSL(0, .04, .10);
    roofPaint.emissive.set(color);
    roofPaint.emissiveIntensity = .10;
  };
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
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => materials.add(m));
    } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  };
  return { root, body, tractor, trailer, wheels, seats, sockets, setPaint, setCondition, dispose };
}
