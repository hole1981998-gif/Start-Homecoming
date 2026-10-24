import * as THREE from 'three';

export type PersonArchetype = 'driver' | 'commuter' | 'student' | 'child' | 'senior' | 'worker' |
  'childRain' | 'teenHood' | 'office' | 'active' | 'parent' | 'caretaker' | 'elderPoncho';
export const passengerArchetypes = ['commuter', 'student', 'child', 'childRain',
  'teenHood', 'office', 'active', 'worker', 'parent', 'caretaker', 'senior',
  'elderPoncho'] as const satisfies readonly PersonArchetype[];
export type EssentialPose = 'stand' | 'walk' | 'seated' | 'riding' | 'hail' | 'ejected' |
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
  commuter: { height: 1.66, shoulder: .40, waist: .34, skin: '#d39d78', coat: '#c75d52', pants: '#48555c', helmet: '#aa7658', accessory: 'none' },
  student: { height: 1.54, shoulder: .38, waist: .29, skin: '#a86e55', coat: '#7b85b3', pants: '#38465d', helmet: '#293e54', accessory: 'backpack' },
  child: { height: 1.24, shoulder: .34, waist: .29, skin: '#c78d6b', coat: '#c9674f', pants: '#816e56', helmet: '#af654b', accessory: 'cap' },
  senior: { height: 1.56, shoulder: .40, waist: .36, skin: '#b98566', coat: '#d2cbb0', pants: '#344657', helmet: '#464844', accessory: 'hat' },
  worker: { height: 1.76, shoulder: .52, waist: .43, skin: '#8f5b48', coat: '#c48c5f', pants: '#3b5553', helmet: '#5b4c3f', accessory: 'satchel' },
  childRain: { height: 1.33, shoulder: .36, waist: .30, skin: '#b77959', coat: '#65a7a0', pants: '#45586c', helmet: '#e4bb65', accessory: 'poncho' },
  teenHood: { height: 1.63, shoulder: .37, waist: .28, skin: '#c48d68', coat: '#b77d96', pants: '#394a55', helmet: '#855c75', accessory: 'bag' },
  office: { height: 1.70, shoulder: .41, waist: .31, skin: '#9c6650', coat: '#d3a56d', pants: '#3f5864', helmet: '#5d8d91', accessory: 'bag' },
  active: { height: 1.75, shoulder: .43, waist: .30, skin: '#b78160', coat: '#81a95e', pants: '#324c51', helmet: '#f0d183', accessory: 'helmet' },
  parent: { height: 1.65, shoulder: .50, waist: .45, skin: '#d39c76', coat: '#ba7966', pants: '#52535f', helmet: '#855c48', accessory: 'satchel' },
  caretaker: { height: 1.82, shoulder: .42, waist: .34, skin: '#a16f54', coat: '#6c91ab', pants: '#3e5460', helmet: '#d4c4a2', accessory: 'bag' },
  elderPoncho: { height: 1.50, shoulder: .43, waist: .39, skin: '#b47e63', coat: '#9a8066', pants: '#424d54', helmet: '#d2bba0', accessory: 'poncho' },
} as const;
function mat(color: string, roughness = .85, smooth = false) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: !smooth, side: THREE.DoubleSide });
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
function capsule(parent: THREE.Object3D, name: string, radius: number, height: number,
  pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius,
    Math.max(.01, height - 2 * radius), 4, 9), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function tailoredLimb(parent: THREE.Object3D, name: string, scale: number,
  profile: ReadonlyArray<readonly [number, number]>, material: THREE.Material,
  lod: 'near' | 'far') {
  const points = profile.map(([radius, y]) => new THREE.Vector2(radius * scale, y * scale));
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, lod === 'near' ? 14 : 8), material);
  mesh.name = name; parent.add(mesh); return mesh;
}
function sweptBackHair(parent: THREE.Object3D, headRadius: number,
  material: THREE.Material, lod: 'near' | 'far') {
  const rings: ReadonlyArray<readonly [number, number, number]> = [
    [.22, .13, .16], [.10, .26, .29], [-.07, .30, .35],
    [-.25, .28, .36], [-.45, .21, .29], [-.51, .12, .18],
  ];
  const sides = lod === 'near' ? 12 : 7;
  const vertices: number[] = [], indices: number[] = [];
  for (const [y, width, depth] of rings) for (let j = 0; j <= sides; j++) {
    const angle = -Math.PI / 2 + j * Math.PI / sides;
    vertices.push(Math.sin(angle) * width * headRadius / .30,
      y * headRadius / .30, -.035 - Math.cos(angle) * depth * headRadius / .30);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) {
    const a = i * (sides + 1) + j, b = a + sides + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const hair = new THREE.Mesh(geometry, material);
  hair.name = 'back_hair'; parent.add(hair); return hair;
}
function node(parent: THREE.Object3D, name: string, pos: [number, number, number]) {
  const group = new THREE.Group(); group.name = name; group.position.set(...pos); parent.add(group); return group;
}

/** Ground-root actor. Mount a seat by aligning seat world position with root + hipHeight. */
export function createPersonArt(archetype: PersonArchetype, lod: 'near' | 'far' = 'near'): PersonArt {
  const spec = cast[archetype], scale = spec.height / 1.72, hipHeight = .85 * scale;
  const root = new THREE.Group(); root.name = `chr_${archetype}_root`;
  const hips = node(root, 'hip_pivot', [0, hipHeight, 0]);
  const coat = mat(spec.coat, .78, true), coatShade = mat(spec.coat, .91, true);
  const pants = mat(spec.pants, .86, true);
  const skinTone = new THREE.Color(spec.skin).lerp(new THREE.Color('#e8bb99'), .18);
  const skin = new THREE.MeshStandardMaterial({ color: skinTone, roughness: .67 });
  const dark = mat('#28373d', .72, true), light = mat('#eadfc7');
  const accessoryMat = mat(spec.helmet, .72, true);
  const torso = node(hips, 'torso_pivot', [0, 0, 0]);
  const shoulderWidth = spec.shoulder * scale, waistWidth = spec.waist * scale;
  tapered(hips, 'pants_pelvis', waistWidth * .52, waistWidth * .46,
    .14 * scale, [0, -.04 * scale, 0], pants, 14);
  const torsoProfile = [
    new THREE.Vector2(0, .015 * scale),
    new THREE.Vector2(waistWidth * .48, .015 * scale),
    new THREE.Vector2(waistWidth * .56, .075 * scale),
    new THREE.Vector2(waistWidth * .53, .22 * scale),
    new THREE.Vector2(shoulderWidth * .52, .43 * scale),
    new THREE.Vector2(shoulderWidth * .57, .51 * scale),
    new THREE.Vector2(shoulderWidth * .43, .59 * scale),
    new THREE.Vector2(.075 * scale, .64 * scale),
    new THREE.Vector2(0, .64 * scale),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, lod === 'near' ? 20 : 10), coat);
  body.name = 'coat_torso';
  body.scale.z = .84; torso.add(body);
  if (archetype === 'office' || archetype === 'worker')
    tapered(torso, 'coat_hem', waistWidth * .55, waistWidth * .58,
      .07 * scale, [0, .075 * scale, 0], coatShade, 16);
  if (lod === 'near' && (archetype === 'office' || archetype === 'worker')) {
    box(torso, 'coat_placket', [.026 * scale, .28 * scale, .012],
      [0, .29 * scale, .204 * scale], light);
  }
  const neck = tapered(torso, 'neck', .075 * scale, .08 * scale, .12 * scale,
    [0, .64 * scale, 0], skin, 6);
  neck.userData.materialRole = 'skin';
  const head = node(torso, 'head_pivot', [0, .63 * scale, 0]);
  const headRadius = (archetype === 'driver' ? .33 : .36) * scale *
    (archetype === 'child' || archetype === 'childRain' ? 1.07 : 1);
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headRadius,
    lod === 'near' ? 16 : 10, lod === 'near' ? 12 : 8), skin);
  headMesh.name = 'head'; headMesh.scale.set(1, 1.02, .95); head.add(headMesh);
  const hairMat = mat(archetype === 'senior' ? '#aeb1a7' : archetype === 'elderPoncho' ? '#8c938e' :
    archetype === 'office' || archetype === 'teenHood' ? '#302d38' : '#3d3231', .67, true);
  if (spec.accessory !== 'helmet' && spec.accessory !== 'poncho' && spec.accessory !== 'cap') {
    if (archetype === 'senior') {
      for (const side of [-1, 1]) {
        const sideHair = new THREE.Mesh(new THREE.SphereGeometry(headRadius * .30, 9, 7), hairMat);
        sideHair.name = `grey_side_hair_${side}`;
        sideHair.scale.set(.65, .90, .58);
        sideHair.position.set(side * headRadius * .82, -.025 * scale, -headRadius * .23);
        head.add(sideHair);
      }
    } else {
      const hair = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.035,
        lod === 'near' ? 16 : 10, 8, 0, Math.PI * 2, 0, Math.PI * .40), hairMat);
      hair.name = 'sculpted_hair'; hair.position.set(0, .025 * scale, -.012 * scale);
      if (archetype === 'commuter' || archetype === 'office' || archetype === 'caretaker')
        hair.rotation.z = -.13;
      head.add(hair);
      if (archetype === 'office' || archetype === 'caretaker' || archetype === 'commuter') {
        sweptBackHair(head, headRadius, hairMat, lod);
      }
    }
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.038 * scale, 8, 6), skin);
  nose.name = 'nose'; nose.scale.set(.90, .72, 1.14);
  nose.position.set(0, -.055 * scale, headRadius * .94); head.add(nose);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.054 * scale, 8, 6), skin);
    ear.name = `ear_${side}`; ear.scale.set(.70, 1, .68);
    ear.position.set(side * headRadius * .95, -.045 * scale, 0); head.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.024 * scale, 8, 6),
      mat('#315986', .42, true));
    eye.name = `eye_${side}`;
    eye.position.set(side * headRadius * .35, .005 * scale, headRadius * .91);
    head.add(eye);
    if (lod === 'near' && archetype !== 'driver') box(head, `eyebrow_${side}`,
      [.064 * scale, .014 * scale, .012],
      [side * headRadius * .35, .075 * scale, headRadius * .91], hairMat);
  }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(.022 * scale, 8, 6),
    mat('#a65e62', .8, true));
  mouth.name = 'mouth'; mouth.scale.set(1.6, .54, .55);
  mouth.position.set(0, -.145 * scale, headRadius * .88); head.add(mouth);
  if (archetype === 'senior' && lod === 'near') {
    const moustache = mat('#8e948b', .80, true);
    for (const side of [-1, 1]) {
      const half = new THREE.Mesh(new THREE.SphereGeometry(.042 * scale, 9, 7), moustache);
      half.name = `silver_moustache_${side}`;
      half.scale.set(1.12, .38, .52);
      half.position.set(side * .034 * scale, -.112 * scale, headRadius * .91);
      half.rotation.z = side * .22;
      head.add(half);
    }
    tapered(torso, 'shirt_hem_belt', waistWidth * .54, waistWidth * .54,
      .035 * scale, [0, .055 * scale, 0], mat('#8a664b'), 16);
  }

  const arms: THREE.Group[] = [], elbows: THREE.Group[] = [], legs: THREE.Group[] = [], knees: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = node(torso, `shoulder_${side}`, [side * shoulderWidth * .54, .53 * scale, 0]);
    tailoredLimb(arm, `upper_arm_${side}`, scale,
      [[0, .035], [.054, .034], [.077, -.018], [.087, -.085],
        [.080, -.23], [.077, -.34], [.063, -.375], [0, -.375]], coat, lod)
      .position.x = side * .02 * scale;
    const elbow = node(arm, `elbow_${side}`, [side * .02 * scale, -.31 * scale, 0]);
    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(.057 * scale, 10, 8), coat);
    elbowJoint.name = `soft_elbow_${side}`; elbow.add(elbowJoint);
    tailoredLimb(elbow, `forearm_${side}`, scale,
      [[0, .04], [.055, .03], [.071, -.055], [.067, -.15],
        [.059, -.24], [.055, -.29], [0, -.29]], coat, lod);
    capsule(elbow, `hand_${side}`, .050 * scale, .12 * scale,
      [0, -.30 * scale, 0], skin);
    arms.push(arm); elbows.push(elbow);

    const leg = node(hips, `hip_leg_${side}`, [side * waistWidth * .34, -.045 * scale, 0]);
    tailoredLimb(leg, `thigh_${side}`, scale,
      [[0, .035], [.084, .03], [.105, -.06], [.102, -.20],
        [.105, -.35], [.098, -.41], [0, -.41]], pants, lod);
    const knee = node(leg, `knee_${side}`, [0, -.37 * scale, 0]);
    const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(.072 * scale, 12, 9), pants);
    kneeJoint.name = `soft_knee_${side}`; knee.add(kneeJoint);
    tailoredLimb(knee, `shin_${side}`, scale,
      [[0, .04], [.078, .035], [.086, -.04], [.078, -.18],
        [.079, -.32], [.085, -.39], [0, -.41]], pants, lod);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), dark);
    shoe.name = `shoe_${side}`; shoe.scale.set(.12 * scale, .065 * scale, .17 * scale);
    shoe.position.set(0, -.39 * scale, .075 * scale); knee.add(shoe);
    legs.push(leg); knees.push(knee);
  }

  if (spec.accessory === 'helmet') {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.09,
      16, 10, 0, Math.PI * 2, 0, Math.PI * .40), accessoryMat);
    helmet.name = 'rain_helmet'; helmet.position.y = .036 * scale; head.add(helmet);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 1.22,
      headRadius * 1.22, .025 * scale, 16), accessoryMat);
    brim.name = 'helmet_brim'; brim.scale.z = 1.15;
    brim.position.y = .095 * scale; head.add(brim);
  } else if (spec.accessory === 'cap') {
    const crown = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.04,
      16, 10, 0, Math.PI * 2, 0, Math.PI * .52), accessoryMat);
    crown.name = 'soft_cap_crown'; crown.position.y = .035 * scale; head.add(crown);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6), accessoryMat);
    visor.name = 'soft_cap_visor'; visor.scale.set(headRadius * .90, .025 * scale, headRadius * .68);
    visor.position.set(0, headRadius * .30, headRadius * .94); head.add(visor);
  } else if (spec.accessory === 'hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 1.31,
      headRadius * 1.31, .035 * scale, 16), accessoryMat);
    brim.name = 'soft_hat_brim'; brim.scale.z = .90;
    brim.position.set(0, headRadius * .75, .025 * scale); head.add(brim);
    tapered(head, 'soft_hat_crown', .18 * scale, .24 * scale, .21 * scale,
      [0, headRadius * .75 + .11 * scale, .015 * scale], accessoryMat, 12);
    const hatBand = tapered(head, 'hat_band', .242 * scale, .243 * scale,
      .045 * scale, [0, headRadius * .75 + .035 * scale, .015 * scale], hairMat, 12);
    hatBand.scale.z = .91;
  } else if (spec.accessory === 'backpack' || spec.accessory === 'bag' || spec.accessory === 'satchel') {
    const pack = spec.accessory === 'backpack'
      ? box(torso, 'carried_bag', [.33 * scale, .39 * scale, .16 * scale],
        [0, .27 * scale, -.24 * scale], accessoryMat)
      : new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), accessoryMat);
    if (spec.accessory !== 'backpack') {
      pack.name = 'carried_bag';
      pack.scale.set(.16 * scale, .18 * scale, .095 * scale);
      pack.position.set(shoulderWidth * .63, -.055 * scale, -.08 * scale);
      torso.add(pack);
    }
    pack.rotation.z = spec.accessory === 'satchel' ? -.09 : 0;
    if (lod === 'near') box(torso, 'bag_strap', [.04 * scale, .52 * scale, .025],
      [-shoulderWidth * .24, .34 * scale, -.23 * scale], dark).rotation.z = -.27;
  } else if (spec.accessory === 'poncho') {
    tapered(torso, 'rain_poncho', shoulderWidth * .50, waistWidth * .87, .57 * scale,
      [0, .28 * scale, -.01], accessoryMat, 10);
    const hood = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.12,
      16, 10, 0, Math.PI * 2, 0, Math.PI * .41), accessoryMat);
    hood.name = 'poncho_hood'; hood.position.set(0, .035 * scale, -.045 * scale);
    head.add(hood);
  }

  // A small number of silhouette-specific garments make the twelve passenger forms
  // readable without changing their shared seat and animation contract.
  if (archetype === 'childRain' || archetype === 'elderPoncho') {
    tapered(torso, 'long_rain_cape', shoulderWidth * .56, waistWidth * 1.08,
      .66 * scale, [0, .12 * scale, -.045 * scale], accessoryMat, 6);
    box(torso, 'cape_hem', [waistWidth * 1.72, .055 * scale, .25 * scale],
      [0, -.17 * scale, -.07 * scale], coatShade);
  } else if (archetype === 'commuter') {
    tapered(torso, 'rounded_dress_skirt', waistWidth * .51, waistWidth * .88,
      .34 * scale, [0, -.08 * scale, 0], coat, 20);
    tapered(torso, 'dress_waist_band', waistWidth * .53, waistWidth * .54,
      .045 * scale, [0, .085 * scale, 0], coatShade, 20);
  } else if (archetype === 'teenHood') {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.11,
      16, 10, 0, Math.PI * 2, 0, Math.PI * .41), coatShade);
    hood.name = 'oversized_hood'; hood.position.set(0, .04 * scale, -.07 * scale);
    head.add(hood);
    box(torso, 'crossbody_sash', [.055 * scale, .61 * scale, .025],
      [.015, .31 * scale, .20 * scale], accessoryMat).rotation.z = -.42;
  } else if (archetype === 'office' || archetype === 'caretaker') {
    for (const side of [-1, 1]) box(torso, `long_coat_tail_${side}`,
      [waistWidth * .56, .39 * scale, .18 * scale],
      [side * waistWidth * .38, -.15 * scale, -.025], coat);
    box(torso, 'rain_collar', [shoulderWidth * 1.08, .10 * scale, .28 * scale],
      [0, .58 * scale, -.015], accessoryMat);
  } else if (archetype === 'active') {
    box(torso, 'short_vest_band', [shoulderWidth * 1.13, .16 * scale, .26 * scale],
      [0, .44 * scale, -.02], accessoryMat);
    box(torso, 'sport_back_panel', [shoulderWidth * .74, .28 * scale, .05],
      [0, .28 * scale, -.19 * scale], accessoryMat);
  } else if (archetype === 'parent') {
    box(torso, 'wide_rain_shawl', [shoulderWidth * 1.20, .22 * scale, .33 * scale],
      [0, .51 * scale, -.04], accessoryMat);
    box(elbows[0], 'carried_parcel', [.22 * scale, .25 * scale, .18 * scale],
      [0, -.35 * scale, .07 * scale], accessoryMat);
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
    torso.rotation.set(archetype === 'senior' || archetype === 'elderPoncho' ? .10 : 0, 0, 0);
    head.rotation.set(0, 0, 0);
    for (const part of [...arms, ...elbows, ...legs, ...knees]) part.rotation.set(0, 0, 0);
    if (pose === 'seated' || pose === 'riding') {
      if (pose === 'seated') torso.position.y = -.19 * scale;
      for (let i = 0; i < 2; i++) { legs[i].rotation.x = pose === 'riding' ? -.77 : -1.25;
        knees[i].rotation.x = pose === 'riding' ? 1.0 : 1.33; }
      if (pose === 'riding') { torso.rotation.x = .22; arms[0].rotation.x = -.92; arms[1].rotation.x = -.92;
        elbows[0].rotation.x = -.35; elbows[1].rotation.x = -.35; }
    } else if (pose === 'stand') {
      const sway = .10 + Math.sin(phase * Math.PI * 2) * .10;
      legs[0].rotation.x = sway; legs[1].rotation.x = -sway;
      arms[0].rotation.x = -sway * .75; arms[1].rotation.x = sway * .75;
      arms[0].rotation.z = -.11; arms[1].rotation.z = .11;
      elbows[0].rotation.z = .12; elbows[1].rotation.z = -.12;
    } else if (pose === 'walk') {
      const stride = Math.sin(t * Math.PI * 2);
      legs[0].rotation.x = stride * .48;
      legs[1].rotation.x = -stride * .48;
      knees[0].rotation.x = Math.max(0, -stride) * .48;
      knees[1].rotation.x = Math.max(0, stride) * .48;
      arms[0].rotation.x = -stride * .34 - .14;
      arms[1].rotation.x = stride * .34 - .14;
      arms[0].rotation.z = -.11; arms[1].rotation.z = .11;
      elbows[0].rotation.x = -.22;
      elbows[1].rotation.x = -.22;
      elbows[0].rotation.z = .12; elbows[1].rotation.z = -.12;
      torso.rotation.z = stride * .035;
      head.rotation.z = -stride * .02;
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
