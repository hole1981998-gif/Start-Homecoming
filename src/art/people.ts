import * as THREE from 'three';

export type PersonArchetype = 'driver' | 'commuter' | 'student' | 'child' | 'senior' | 'worker';
export type EssentialPose = 'stand' | 'seated' | 'riding' | 'hail' | 'ejected' |
  'grounded' | 'recover' | 'refuse';
export interface PersonArt {
  root: THREE.Group;
  hipHeight: number;
  sockets: Record<string, THREE.Object3D>;
  setPose: (pose: EssentialPose, phase?: number) => void;
  dispose: () => void;
}
const cast = {
  driver: { height: 1.72, shoulder: .46, waist: .33, skin: '#b67f62', coat: '#4c98a4', pants: '#314750', helmet: '#e5d9ba', accessory: 'helmet' },
  commuter: { height: 1.66, shoulder: .40, waist: .34, skin: '#d39d78', coat: '#d58d67', pants: '#48555c', helmet: '#433c40', accessory: 'bag' },
  student: { height: 1.54, shoulder: .38, waist: .29, skin: '#a86e55', coat: '#7b85b3', pants: '#38465d', helmet: '#293e54', accessory: 'backpack' },
  child: { height: 1.24, shoulder: .34, waist: .29, skin: '#c78d6b', coat: '#d5aa62', pants: '#5b626e', helmet: '#f1cc71', accessory: 'poncho' },
  senior: { height: 1.56, shoulder: .40, waist: .36, skin: '#a97256', coat: '#739274', pants: '#4b4d53', helmet: '#d9c5a8', accessory: 'hat' },
  worker: { height: 1.76, shoulder: .52, waist: .43, skin: '#8f5b48', coat: '#c48c5f', pants: '#3b5553', helmet: '#5b4c3f', accessory: 'satchel' },
} as const;
function mat(color: string, roughness = .85) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true, side: THREE.DoubleSide });
}
function box(parent: THREE.Object3D, name: string, dims: [number, number, number],
  pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dims), material); mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function tapered(parent: THREE.Object3D, name: string, top: number, bottom: number, height: number,
  pos: [number, number, number], material: THREE.Material, segments = 6) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function node(parent: THREE.Object3D, name: string, pos: [number, number, number]) {
  const group = new THREE.Group(); group.name = name; group.position.set(...pos); parent.add(group); return group;
}

/** Ground-root actor. Mount a seat by aligning seat world position with root + hipHeight. */
export function createPersonArt(archetype: PersonArchetype, lod: 'near' | 'far' = 'near'): PersonArt {
  const spec = cast[archetype], scale = spec.height / 1.72, hipHeight = .85 * scale;
  const root = new THREE.Group(); root.name = `chr_${archetype}_root`;
  const hips = node(root, 'hip_pivot', [0, hipHeight, 0]);
  const coat = mat(spec.coat), coatShade = mat(spec.coat, .98), pants = mat(spec.pants), skin = mat(spec.skin);
  const dark = mat('#35454a'), light = mat('#eadfc7'), accessoryMat = mat(spec.helmet);
  const torso = node(hips, 'torso_pivot', [0, 0, 0]);
  const shoulderWidth = spec.shoulder * scale, waistWidth = spec.waist * scale;
  tapered(torso, 'coat_torso', shoulderWidth * .69, waistWidth * .67, .55 * scale,
    [0, .30 * scale, 0], coat, 5);
  tapered(torso, 'coat_hem', waistWidth * .62, waistWidth * .82, .19 * scale,
    [0, .03 * scale, .01], coatShade, 5);
  // Large folded flaps give the coat shape in rain without texture noise.
  if (lod === 'near') {
    box(torso, 'coat_placket', [.045 * scale, .38 * scale, .018], [0, .28 * scale, .19 * scale], light);
    for (const side of [-1, 1]) box(torso, `rain_fold_${side}`, [.035, .24 * scale, .025],
      [side * waistWidth * .43, .16 * scale, .14 * scale], coatShade).rotation.z = side * .13;
  }
  const neck = tapered(torso, 'neck', .075 * scale, .08 * scale, .12 * scale,
    [0, .64 * scale, 0], skin, 6);
  neck.userData.materialRole = 'skin';
  const head = node(torso, 'head_pivot', [0, .72 * scale, 0]);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(.18 * scale, lod === 'near' ? 10 : 7, 6), skin);
  headMesh.name = 'head'; headMesh.scale.set(1, 1.08, .90); head.add(headMesh);
  box(head, 'nose', [.07 * scale, .065 * scale, .07 * scale], [0, -.025 * scale, .17 * scale], skin);
  const hair = tapered(head, 'hair_cap', .16 * scale, .20 * scale, .09 * scale,
    [0, .15 * scale, -.015 * scale], dark, 8);
  hair.rotation.z = archetype === 'senior' ? -.08 : .05;
  if (lod === 'near' && archetype !== 'driver') {
    for (const side of [-1, 1]) box(head, `eyebrow_${side}`, [.055 * scale, .018 * scale, .018],
      [side * .074 * scale, .02 * scale, .166 * scale], dark);
  }

  const arms: THREE.Group[] = [], elbows: THREE.Group[] = [], legs: THREE.Group[] = [], knees: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = node(torso, `shoulder_${side}`, [side * shoulderWidth * .55, .54 * scale, 0]);
    tapered(arm, `upper_arm_${side}`, .09 * scale, .07 * scale, .32 * scale,
      [side * .02 * scale, -.16 * scale, 0], coat, 5);
    const elbow = node(arm, `elbow_${side}`, [side * .02 * scale, -.31 * scale, 0]);
    tapered(elbow, `forearm_${side}`, .074 * scale, .057 * scale, .28 * scale,
      [0, -.14 * scale, 0], coatShade, 5);
    box(elbow, `hand_${side}`, [.11 * scale, .11 * scale, .085 * scale],
      [0, -.31 * scale, 0], skin);
    arms.push(arm); elbows.push(elbow);

    const leg = node(hips, `hip_leg_${side}`, [side * waistWidth * .34, -.045 * scale, 0]);
    tapered(leg, `thigh_${side}`, .12 * scale, .095 * scale, .41 * scale,
      [0, -.21 * scale, 0], pants, 5);
    const knee = node(leg, `knee_${side}`, [0, -.37 * scale, 0]);
    tapered(knee, `shin_${side}`, .092 * scale, .071 * scale, .39 * scale,
      [0, -.19 * scale, 0], pants, 5);
    box(knee, `shoe_${side}`, [.16 * scale, .10 * scale, .23 * scale],
      [0, -.39 * scale, .065 * scale], dark);
    legs.push(leg); knees.push(knee);
  }

  if (spec.accessory === 'helmet') {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(.205 * scale, 10, 6, 0, Math.PI * 2, 0, Math.PI * .55), accessoryMat);
    helmet.name = 'rain_helmet'; helmet.position.y = .02 * scale; head.add(helmet);
    box(head, 'helmet_brim', [.39 * scale, .045 * scale, .21 * scale], [0, .06 * scale, .10 * scale], accessoryMat);
  } else if (spec.accessory === 'hat') {
    tapered(head, 'soft_hat_crown', .14 * scale, .18 * scale, .18 * scale,
      [0, .23 * scale, 0], accessoryMat, 7);
    box(head, 'soft_hat_brim', [.43 * scale, .035 * scale, .35 * scale],
      [0, .14 * scale, .035 * scale], accessoryMat);
  } else if (spec.accessory === 'backpack' || spec.accessory === 'bag' || spec.accessory === 'satchel') {
    const pack = box(torso, 'carried_bag', spec.accessory === 'backpack' ?
      [.38 * scale, .46 * scale, .18 * scale] : [.28 * scale, .32 * scale, .15 * scale],
    spec.accessory === 'backpack' ? [0, .26 * scale, -.24 * scale] :
      [shoulderWidth * .43, .03 * scale, -.13 * scale], accessoryMat);
    pack.rotation.z = spec.accessory === 'satchel' ? -.09 : 0;
    if (lod === 'near') box(torso, 'bag_strap', [.04 * scale, .52 * scale, .025],
      [-shoulderWidth * .24, .34 * scale, -.23 * scale], dark).rotation.z = -.27;
  } else if (spec.accessory === 'poncho') {
    tapered(torso, 'rain_poncho', shoulderWidth * .50, waistWidth * .87, .57 * scale,
      [0, .28 * scale, -.01], accessoryMat, 5);
    tapered(head, 'poncho_hood', .17 * scale, .21 * scale, .18 * scale,
      [0, .10 * scale, -.045 * scale], accessoryMat, 7);
  }

  const sockets: Record<string, THREE.Object3D> = {
    head: node(head, 'head_socket', [0, .18 * scale, 0]),
    hand_left: node(elbows[0], 'hand_left_socket', [0, -.32 * scale, 0]),
    hand_right: node(elbows[1], 'hand_right_socket', [0, -.32 * scale, 0]),
    hip: node(hips, 'hip_socket', [0, 0, 0]),
    ground_contact: node(root, 'ground_contact', [0, 0, 0]),
  };
  function setPose(pose: EssentialPose, phase = 0) {
    const t = Math.max(0, Math.min(1, phase));
    hips.position.y = hipHeight;
    hips.rotation.set(0, 0, 0);
    torso.position.y = 0;
    torso.rotation.set(archetype === 'senior' ? .10 : 0, 0, 0);
    head.rotation.set(0, 0, 0);
    for (const part of [...arms, ...elbows, ...legs, ...knees]) part.rotation.set(0, 0, 0);
    if (pose === 'seated' || pose === 'riding') {
      if (pose === 'seated') torso.position.y = -.19 * scale;
      for (let i = 0; i < 2; i++) { legs[i].rotation.x = pose === 'riding' ? -.77 : -1.25;
        knees[i].rotation.x = pose === 'riding' ? 1.0 : 1.33; }
      if (pose === 'riding') { torso.rotation.x = .22; arms[0].rotation.x = -.92; arms[1].rotation.x = -.92;
        elbows[0].rotation.x = -.35; elbows[1].rotation.x = -.35; }
    } else if (pose === 'hail') {
      arms[1].rotation.z = 2.35 + Math.sin(phase * Math.PI * 2) * .15;
      elbows[1].rotation.z = -.33;
      head.rotation.y = -.15;
    } else if (pose === 'refuse') {
      arms[1].rotation.z = 1.18;
      elbows[1].rotation.x = -1.0;
      head.rotation.y = -.42;
      torso.rotation.y = -.24;
    } else if (pose === 'ejected') {
      torso.rotation.x = -.25 - .36 * t; torso.rotation.z = .10 + .20 * t;
      arms[0].rotation.z = -.5 - .6 * t; arms[1].rotation.z = .5 + .5 * t;
      legs[0].rotation.x = -.16 - .19 * t; legs[1].rotation.x = .19 + .23 * t;
    } else if (pose === 'grounded') {
      hips.position.y = .33 * scale;
      torso.rotation.x = -1.25;
      arms[0].rotation.x = -1.12; arms[1].rotation.x = -1.12;
      legs[0].rotation.z = -.32; legs[1].rotation.z = .30;
    } else if (pose === 'recover') {
      hips.position.y = .33 * scale + (hipHeight - .33 * scale) * t;
      torso.rotation.x = -1.25 * (1 - t);
      arms[0].rotation.x = -1.12 * (1 - t); arms[1].rotation.x = -1.12 * (1 - t);
      knees[0].rotation.x = .52 * (1 - t); knees[1].rotation.x = .52 * (1 - t);
    }
  }
  setPose('stand');
  root.userData = { id: `chr_${archetype}_A`, heightM: spec.height, hipHeightM: hipHeight,
    lod, axes: '+Y up, +Z forward', collisionRole: 'reference-only', visualRootMotion: false };
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    root.traverse(obj => { if (obj instanceof THREE.Mesh) {
      geometries.add(obj.geometry);
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
    } });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
  };
  return { root, hipHeight, sockets, setPose, dispose };
}

/** Seat transforms are authored at the sitter's hip, facing vehicle +Z. */
export function mountPersonOnSeat(person: PersonArt, seat: THREE.Object3D,
  pose: 'seated' | 'riding' = 'seated'): void {
  seat.add(person.root);
  person.root.position.set(0, -person.hipHeight, 0);
  person.root.rotation.set(0, 0, 0);
  person.setPose(pose);
}
