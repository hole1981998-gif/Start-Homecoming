import * as THREE from 'three';
import type { VehicleCondition } from './condition';

export type TwoWheelerKind = 'motorcycle' | 'motorbike';
export interface TwoWheelerArt {
  root: THREE.Group;
  body: THREE.Group;
  frontSteer: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  sockets: Record<string, THREE.Object3D>;
  seats: Record<'driver' | 'passenger', THREE.Object3D>;
  setPaint: (color: string) => void;
  setCondition: (condition: VehicleCondition) => void;
  dispose: () => void;
}

function mat(color: string, roughness = .6, metalness = .08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true, side: THREE.DoubleSide });
}
function box(parent: THREE.Object3D, name: string, size: [number, number, number],
  at: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...at); parent.add(mesh); return mesh;
}
function tube(parent: THREE.Object3D, name: string, path: [number, number, number][], radius: number,
  material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(path.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(2, path.length * 3), radius, 5), material);
  mesh.name = name; parent.add(mesh); return mesh;
}
function polygon(parent: THREE.Object3D, name: string, points: [number, number, number][], material: THREE.Material) {
  const values: number[] = [];
  for (let i = 1; i < points.length - 1; i++) values.push(...points[0], ...points[i], ...points[i + 1]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(values, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material); mesh.name = name; parent.add(mesh); return mesh;
}
function point(parent: THREE.Object3D, name: string, at: [number, number, number]) {
  const node = new THREE.Object3D(); node.name = name; node.position.set(...at); parent.add(node); return node;
}

/** Shared wheel mechanics, distinct commuter and sport silhouettes. +Z is travel direction. */
export function createTwoWheelerArt(kind: TwoWheelerKind, lod: 'near' | 'far' = 'near'): TwoWheelerArt {
  const sport = kind === 'motorbike';
  const half = sport ? 1.10 : 1.0;
  const axle = sport ? .78 : .72;
  const tyreRadius = sport ? .32 : .29;
  const root = new THREE.Group(); root.name = `veh_${kind}_root`;
  const body = new THREE.Group(); body.name = 'suspensionVisual'; root.add(body);
  const paint = mat(sport ? '#b6554e' : '#4e9b91', .38, .18);
  const paintLight = mat(sport ? '#e07d65' : '#86c5af', .43, .12);
  const paintDark = mat(sport ? '#7d3939' : '#356f6c', .52, .1);
  const steel = mat('#bbc7c3', .38, .62), darkSteel = mat('#59656a', .62, .36);
  const rubber = mat('#202b31', .94), seatMat = mat('#26383f', .83);
  const lensRed = mat('#bc474b', .3), lensWarm = mat('#eadab0', .3);
  const engineMat = mat('#707e7e', .5, .38), muddy = mat('#655d53', 1);

  function wheel(parent: THREE.Object3D, name: string, z: number) {
    const axlePivot = new THREE.Group(); axlePivot.name = `${name}_spin`; axlePivot.position.set(0, tyreRadius, z); parent.add(axlePivot);
    const segments = lod === 'near' ? 12 : 8;
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(tyreRadius - .055, .055, 6, segments), rubber);
    tyre.name = `${name}_tyre`; tyre.rotation.y = Math.PI / 2; axlePivot.add(tyre);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(tyreRadius - .105, .019, 5, segments), steel);
    rim.rotation.y = Math.PI / 2; axlePivot.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.073, .073, .21, 8), darkSteel);
    hub.rotation.z = Math.PI / 2; axlePivot.add(hub);
    if (lod === 'near') for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const spoke = box(axlePivot, `${name}_spoke_${i}`, [.025, .018, tyreRadius * 1.1],
        [0, Math.cos(a) * .08, Math.sin(a) * .08], steel);
      spoke.rotation.x = a;
    }
    return axlePivot;
  }
  const rearWheel = wheel(root, 'rear', -axle);
  const frontSteer = new THREE.Group(); frontSteer.name = 'front_steer'; root.add(frontSteer);
  const frontWheel = wheel(frontSteer, 'front', axle);

  // A frame triangle remains visible under the step-through fairing or sport tank.
  for (const side of [-1, 1]) {
    const x = side * .115;
    tube(body, `frame_down_${side}`, [[x, .91, .30], [x, .53, -.09], [x, .38, -.60]], .032, darkSteel);
    tube(body, `swingarm_${side}`, [[x, .46, -.17], [x, .37, -.50], [x, .30, -axle]], .035, steel);
    tube(frontSteer, `fork_${side}`, [[side * .115, 1.20, axle - .09], [side * .115, .65, axle],
      [side * .115, tyreRadius, axle]], .028, steel);
  }
  box(body, 'engine_crankcase', sport ? [.31, .31, .37] : [.27, .26, .30], [0, .56, -.12], engineMat);
  box(body, 'engine_cover', [.30, .12, .14], [0, .55, -.12], steel);
  if (lod === 'near') for (let i = 0; i < 4; i++)
    box(body, `cooling_fin_${i}`, [.33, .023, .24], [0, .67 + i * .044, -.12], darkSteel);

  if (sport) {
    // Broad tank, visible engine and crouched seat are genuinely different from commuter shell.
    polygon(body, 'tank_upper', [[-.30, 1.16, .15], [.30, 1.16, .15],
      [.37, .98, .48], [.22, .92, .59], [-.22, .92, .59], [-.37, .98, .48]], paintLight);
    for (const side of [-1, 1]) {
      polygon(body, `tank_cheek_${side}`, [[side * .31, 1.12, .10], [side * .37, .98, .48],
        [side * .31, .80, .23], [side * .24, .86, -.12]], paint);
      polygon(body, `radiator_fin_${side}`, [[side * .30, .77, .23], [side * .29, .65, .32],
        [side * .27, .56, .15], [side * .29, .68, -.07]], darkSteel);
      tube(body, `exhaust_${side}`, [[side * .18, .50, -.06], [side * .28, .48, -.43],
        [side * .29, .57, -.81]], .045, steel);
    }
    const saddle = box(body, 'sport_saddle', [.42, .095, .63], [0, 1.02, -.43], seatMat);
    saddle.rotation.x = -.06;
    box(body, 'tail_cowl', [.42, .16, .49], [0, 1.00, -.78], paintDark);
    box(body, 'head_cowl', [.50, .28, .27], [0, 1.06, .82], paint);
    box(body, 'short_windscreen', [.38, .26, .038], [0, 1.30, .77], darkSteel).rotation.x = -.23;
    box(body, 'underbelly', [.42, .12, .51], [0, .43, .25], paintDark);
  } else {
    // Step-through silhouette: leg shield, footwell and raised rear seat/rack.
    box(body, 'footboard', [.50, .09, .69], [0, .42, -.04], paintDark);
    for (const side of [-1, 1]) {
      polygon(body, `leg_shield_${side}`, [[side * .29, .40, .18], [side * .36, .94, .47],
        [side * .25, 1.18, .57], [side * .12, 1.17, .60], [side * .12, .45, .29]], paint);
      polygon(body, `rear_body_${side}`, [[side * .26, 1.02, -.38], [side * .33, .80, -.64],
        [side * .25, .58, -.81], [side * .15, .57, -.33]], paintLight);
      box(body, `side_step_${side}`, [.13, .035, .24], [side * .34, .45, -.19], darkSteel);
    }
    box(body, 'commuter_saddle', [.45, .10, .65], [0, 1.08, -.37], seatMat);
    box(body, 'rear_saddle', [.42, .095, .36], [0, 1.04, -.73], seatMat);
    box(body, 'handlebar_front_cover', [.40, .16, .17], [0, 1.23, .69], paintLight);
    box(body, 'front_mudguard', [.34, .07, .44], [0, .57, .74], paint);
    tube(body, 'rear_grab_rail', [[-.25, 1.07, -.73], [-.22, 1.13, -.93],
      [.22, 1.13, -.93], [.25, 1.07, -.73]], .025, steel);
    box(body, 'tiny_rear_rack', [.35, .032, .14], [0, 1.04, -.91], darkSteel);
    box(body, 'exhaust_heat_shield', [.09, .13, .45], [.24, .48, -.55], steel);
  }

  tube(frontSteer, 'handlebar', [[-.36, 1.25, axle - .08], [-.19, 1.28, axle - .04],
    [.19, 1.28, axle - .04], [.36, 1.25, axle - .08]], .03, steel);
  for (const side of [-1, 1]) {
    box(frontSteer, `grip_${side}`, [.13, .055, .055], [side * .36, 1.25, axle - .08], rubber);
    tube(frontSteer, `mirror_arm_${side}`, [[side * .31, 1.29, axle - .04],
      [side * .39, 1.45, axle + .05]], .018, darkSteel);
    box(frontSteer, `mirror_${side}`, [.10, .10, .17], [side * .40, 1.46, axle + .06], darkSteel);
  }
  box(frontSteer, 'headlamp_shell', sport ? [.29, .19, .12] : [.31, .22, .12],
    [0, sport ? 1.08 : 1.15, half - .03], paintDark);
  box(frontSteer, 'headlamp_lens', [.24, .13, .035], [0, sport ? 1.08 : 1.15, half + .035], lensWarm);
  box(body, 'tail_lamp', [.25, .12, .06], [0, 1.00, -half + .045], lensRed);
  box(body, 'license', [.22, .14, .025], [0, .78, -half + .01], steel).rotation.x = -.12;
  if (lod === 'near') {
    for (const side of [-1, 1]) {
      box(frontSteer, `front_indicator_${side}`, [.08, .055, .07], [side * .27, 1.12, half - .02], lensWarm);
      box(body, `rear_indicator_${side}`, [.08, .055, .06], [side * .26, 1.01, -half + .10], lensWarm);
      box(body, `footpeg_${side}`, [.14, .027, .04], [side * .25, .54, -.26], rubber);
    }
  }
  const mud = new THREE.Group(); mud.name = 'used_surface'; body.add(mud);
  box(mud, 'rear_mud', [.30, .04, .25], [0, .49, -.71], muddy);
  mud.visible = false;
  const damaged = new THREE.Group(); damaged.name = 'damaged_panels'; body.add(damaged);
  box(damaged, 'scraped_side', [.035, .19, .43], [sport ? .36 : .32, .88, -.28], darkSteel);
  damaged.visible = false;
  const wreck = new THREE.Group(); wreck.name = 'destroyed_panels'; body.add(wreck);
  box(wreck, 'bent_rear_guard', [.40, .055, .07], [0, .76, -half + .05], darkSteel).rotation.z = .18;
  wreck.visible = false;

  const sockets: Record<string, THREE.Object3D> = {
    headlamp: point(frontSteer, 'headlamp_socket', [0, sport ? 1.08 : 1.15, half + .06]),
    tail: point(body, 'tail_socket', [0, 1.0, -half]),
    brake: point(body, 'brake_socket', [0, 1.0, -half]),
    exhaust: point(body, 'exhaust_socket', [sport ? .29 : .24, .48, -.78]),
    engine_smoke_fire: point(body, 'engine_smoke_fire', [0, .73, -.12]),
    wheel_spray_front: point(frontSteer, 'wheel_spray_front', [0, .24, axle]),
    wheel_spray_rear: point(root, 'wheel_spray_rear', [0, .24, -axle]),
    contact_spark: point(root, 'contact_spark', [0, .25, 0]),
  };
  const seats = {
    driver: point(body, 'seat_driver', [0, sport ? 1.07 : 1.13, sport ? -.38 : -.34]),
    passenger: point(body, 'seat_passenger', [0, 1.10, sport ? -.71 : -.69]),
  };
  root.userData = { id: `veh_${kind}_player_A`, kind, lod, axes: '+Y up, +Z forward',
    widthM: sport ? .96 : .896, lengthM: sport ? 2.2 : 2.0,
    logicCollisionRole: 'reference-only' };
  const setPaint = (color: string) => { paint.color.set(color); paintLight.color.set(color).multiplyScalar(1.16); paintDark.color.set(color).multiplyScalar(.72); };
  const setCondition = (condition: VehicleCondition) => {
    mud.visible = condition !== 'clean';
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
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
  };
  return { root, body, frontSteer, frontWheel, rearWheel, sockets, seats, setPaint, setCondition, dispose };
}
