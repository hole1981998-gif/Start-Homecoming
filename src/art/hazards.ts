import * as THREE from 'three';

export type SurfaceHazardKind = 'water' | 'pothole';
export type PropHazardKind = 'cargo_crate' | 'cargo_barrel' | 'fuel' | 'repair' |
  'barrier' | 'fallen_tree';
export interface HazardArt {
  root: THREE.Group;
  sockets: Record<string, THREE.Object3D>;
  setState: (state: 'normal' | 'used' | 'broken') => void;
  setVisualTime?: (elapsedSeconds: number) => void;
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
function waterNormalMap() {
  const size = 64, data = new Uint8Array(size * size * 4);
  const wave = (u: number, v: number) =>
    Math.sin((u * 3 + v * .7) * Math.PI * 2) * .58 +
    Math.sin((v * 5 - u * .9) * Math.PI * 2) * .27 +
    Math.sin((u * 8 + v * 7) * Math.PI * 2) * .15;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size, step = 1 / size;
    const dx = wave(u + step, v) - wave(u - step, v);
    const dy = wave(u, v + step) - wave(u, v - step);
    const normal = new THREE.Vector3(-dx * 1.7, -dy * 1.7, 1).normalize();
    const index = (y * size + x) * 4;
    data[index] = Math.round((normal.x * .5 + .5) * 255);
    data[index + 1] = Math.round((normal.y * .5 + .5) * 255);
    data[index + 2] = Math.round((normal.z * .5 + .5) * 255);
    data[index + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.repeat.set(2, 3);
  texture.needsUpdate = true;
  return texture;
}
function outlineRadius(kind: SurfaceHazardKind, angle: number) {
  const exponent = kind === 'water' ? 4.7 : 4.1;
  const square = (Math.abs(Math.cos(angle)) ** exponent +
    Math.abs(Math.sin(angle)) ** exponent) ** (-1 / exponent);
  const uneven = kind === 'water'
    ? 1 + Math.sin(angle * 3 + .4) * .018 + Math.sin(angle * 7 - .6) * .012
    : 1 + Math.sin(angle * 5 + .8) * .022;
  return square * uneven;
}
function patch(parent: THREE.Object3D, name: string, width: number, length: number,
  y: number, material: THREE.Material, kind: SurfaceHazardKind) {
  const outline: [number, number][] = Array.from({ length: 32 }, (_, i) => {
    const angle = i * Math.PI * 2 / 32;
    const radius = .49 * outlineRadius(kind, angle);
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
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
function bevelBasin(parent: THREE.Object3D, kind: SurfaceHazardKind, width: number, length: number,
  lod: 'near' | 'far', material: THREE.Material) {
  const positions: number[] = [];
  const segments = lod === 'near' ? 32 : 20;
  for (let i = 0; i < segments; i++) {
    const p = (index: number, radius: number, y: number): [number, number, number] => {
      const angle = index * Math.PI * 2 / segments;
      const wobble = outlineRadius(kind, angle);
      return [Math.cos(angle) * width * radius * wobble, y,
        Math.sin(angle) * length * radius * wobble];
    };
    const outerY = kind === 'water' ? .027 : .055;
    const innerY = kind === 'water' ? .035 : .022;
    const a = p(i, kind === 'water' ? .47 : .46, outerY);
    const b = p(i + 1, kind === 'water' ? .47 : .46, outerY);
    const innerRadius = kind === 'water' ? .445 : .345;
    const c = p(i, innerRadius, innerY), d = p(i + 1, innerRadius, innerY);
    positions.push(...a, ...c, ...b, ...b, ...c, ...d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'sloped_basin_normals'; parent.add(mesh);
}
function basinFloor(parent: THREE.Object3D, kind: SurfaceHazardKind,
  width: number, length: number, lod: 'near' | 'far', material: THREE.Material) {
  const segments = lod === 'near' ? 40 : 24;
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [];
  const gradient = kind === 'water'
    ? ['#276b7c', '#59a7ae', '#8ac8bc']
    : ['#202725', '#33342f', '#64584b'];
  const rings = kind === 'water' ? [0, .09, .18, .27, .36, .445] : [0, .18, .335];
  const vertex = (ring: number, index: number) => {
    const angle = index * Math.PI * 2 / segments;
    const wobble = ring === 0 ? 1 : outlineRadius(kind, angle);
    const height = kind === 'water'
      ? .047 - rings[ring] * .027 + (ring === 0 ? 0 : Math.sin(angle * 3) * .003)
      : [.022, .023, .025][ring] + (ring === 0 ? 0 : Math.sin(angle * 4) * .001);
    return [Math.cos(angle) * width * rings[ring] * wobble, height,
      Math.sin(angle) * length * rings[ring] * wobble] as const;
  };
  const push = (a: readonly number[], b: readonly number[], c: readonly number[],
    ca: THREE.Color, cb: THREE.Color, cc: THREE.Color) => {
    positions.push(...a, ...b, ...c);
    colors.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
    for (const p of [a, b, c]) uvs.push(p[0] / width + .5, p[2] / length + .5);
  };
  const shades = gradient.map(value => new THREE.Color(value));
  const shade = (ring: number) => {
    const fraction = ring / (rings.length - 1);
    return fraction < .5 ? shades[0].clone().lerp(shades[1], fraction * 2) :
      shades[1].clone().lerp(shades[2], (fraction - .5) * 2);
  };
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    push(vertex(0, 0), vertex(1, next), vertex(1, i), shade(0), shade(1), shade(1));
    for (let ring = 1; ring < rings.length - 1; ring++) {
      push(vertex(ring, i), vertex(ring, next), vertex(ring + 1, i),
        shade(ring), shade(ring), shade(ring + 1));
      push(vertex(ring + 1, i), vertex(ring, next), vertex(ring + 1, next),
        shade(ring + 1), shade(ring), shade(ring + 1));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  const floor = new THREE.Mesh(geometry, material);
  floor.name = kind === 'water' ? 'deep_water' : 'pothole_depth';
  parent.add(floor);
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
    root.traverse(obj => { if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
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
  const edge = material(kind === 'water' ? '#3c585b' : '#504b43');
  const center = kind === 'water'
    ? new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true,
      roughness: .28, metalness: .04, clearcoat: .72,
      clearcoatRoughness: .14, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true,
      roughness: 1, side: THREE.DoubleSide });
  const normalMap = kind === 'water' ? waterNormalMap() : undefined;
  if (center instanceof THREE.MeshPhysicalMaterial && normalMap) {
    center.normalMap = normalMap;
    center.normalScale.set(.12, .12);
  }
  const glint = new THREE.MeshStandardMaterial({ color: '#a7c9bb', roughness: .32,
    transparent: true, opacity: .48, depthWrite: false, side: THREE.DoubleSide });
  const debris = material('#665f54');
  patch(root, 'readable_footprint', width, length, .015, edge, kind);
  bevelBasin(root, kind, width, length, lod,
    material(kind === 'water' ? '#5a8a89' : '#48453e'));
  basinFloor(root, kind, width, length, lod, center);
  const ripples: THREE.Mesh[] = [];
  if (kind === 'water') {
    for (let i = 0; i < (lod === 'near' ? 5 : 2); i++) {
      const z = (i / (lod === 'near' ? 5 : 2) - .42) * length * .72;
      ripples.push(box(root, `water_ripple_${i}`, [width * (.20 + (i % 3) * .10), .004, .022],
        [((i * 7) % 5 - 2) * width * .07, .043, z * .77], glint));
    }
    for (const side of [-1, 1]) for (const z of [-.20, .20])
      box(root, `wet_bank_${side}_${z}`,
        [Math.min(.035, width * .018), .004, length * .085],
        [side * width * .28, .045, z * length * .8], glint);
  } else {
    for (const side of [-1, 1]) {
      const chips = side < 0 ? [-.29, .04, .27] : [-.17, .23];
      for (const [index, z] of chips.entries()) {
        if (lod === 'far' && index === 1) continue;
        const chip = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0),
          index === 1 ? edge : debris);
        chip.name = `broken_rim_chip_${side}_${index}`;
        chip.scale.set(width * (index === 1 ? .039 : .052), .018,
          length * (index === 2 ? .048 : .055));
        chip.position.set(side * width * (.37 + index * .012), .054, z * length);
        root.add(chip);
      }
    }
    if (lod === 'near') {
      const cracks = [
        [[-.34, -.25], [-.39, -.31], [-.43, -.34]],
        [[.32, -.27], [.39, -.32], [.43, -.30]],
        [[-.35, .13], [-.40, .18], [-.43, .23]],
        [[.33, .19], [.39, .24], [.42, .29]],
        [[-.05, .36], [-.03, .40], [-.08, .43]],
      ];
      const positions: number[] = [];
      for (const crack of cracks) for (let i = 0; i < crack.length - 1; i++) {
        for (const p of [crack[i], crack[i + 1]])
          positions.push(p[0] * width, .071, p[1] * length);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(geometry,
        new THREE.LineBasicMaterial({ color: '#242c2b' }));
      lines.name = 'fractured_asphalt_cracks'; root.add(lines);
    }
  }
  const art = finish(root, { contact: point(root, 'contact', [0, .03, 0]) });
  if (kind === 'water') {
    const floor = root.getObjectByName('deep_water') as THREE.Mesh<THREE.BufferGeometry>;
    const attribute = floor.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = attribute.array as Float32Array;
    const base = Float32Array.from(positions);
    const rippleZ = ripples.map(mesh => mesh.position.z);
    art.setVisualTime = (elapsedSeconds: number) => {
      const t = Math.max(0, elapsedSeconds);
      if (normalMap) normalMap.offset.set(t * .009 % 1, t * .016 % 1);
      for (let i = 0; i < attribute.count; i++) {
        const offset = i * 3;
        positions[offset + 1] = base[offset + 1] +
          (Math.sin(base[offset] * 5.7 + base[offset + 2] * 1.8 + t * 2.2) +
            Math.sin(base[offset] * 2.1 - base[offset + 2] * 4.6 - t * 1.5) * .55) * .008;
      }
      attribute.needsUpdate = true;
      floor.geometry.computeVertexNormals();
      ripples.forEach((mesh, i) => {
        mesh.position.z = rippleZ[i] + Math.sin(t * 1.7 + i * 1.9) * length * .012;
        mesh.scale.x = 1 + Math.sin(t * 2.1 + i * 1.3) * .09;
      });
    };
  }
  const baseDispose = art.dispose;
  art.dispose = () => { baseDispose(); normalMap?.dispose(); };
  return art;
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
