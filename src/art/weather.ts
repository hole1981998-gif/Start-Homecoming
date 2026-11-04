import * as THREE from 'three';

export interface RainArt {
  root: THREE.Group;
  setIntensity: (amount: number) => void;
  update: (elapsedSeconds: number, anchorX?: number, anchorZ?: number,
    groundPoint?: (lateralMetres: number, longitudinalMetres: number) => { x: number; z: number }) => void;
  dispose: () => void;
}

function hash(index: number, salt: number, seed: number) {
  let n = Math.imul(index + 1 + seed * 131, 1664525) + salt * 1013904223;
  n ^= n >>> 16;
  n = Math.imul(n, 2246822519);
  n ^= n >>> 13;
  return (n >>> 0) / 4294967296;
}

/** Decorative storm rain. The caller owns elapsed time, pause and camera anchoring. */
export function createRainArt(seed = 17, drops = 420): RainArt {
  const root = new THREE.Group(); root.name = 'storm_rain_visual';
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(drops * 2 * 3);
  const attribute = new THREE.BufferAttribute(positions, 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', attribute);
  const material = new THREE.LineBasicMaterial({ color: '#c5dce0', transparent: true,
    opacity: .31, depthWrite: false, toneMapped: false });
  const lines = new THREE.LineSegments(geometry, material);
  lines.name = 'seeded_rain_streaks';
  lines.frustumCulled = false;
  root.add(lines);
  const setIntensity = (amount: number) => {
    const visibleDrops = Math.round(drops * THREE.MathUtils.clamp(amount, 0, 1));
    geometry.setDrawRange(0, visibleDrops * 2);
    lines.visible = visibleDrops > 0;
  };
  const update = (elapsedSeconds: number, anchorX = 0, anchorZ = 25) => {
    const t = Math.max(0, elapsedSeconds);
    for (let i = 0; i < drops; i++) {
      const speed = 9 + hash(i, 1, seed) * 5;
      const phase = (hash(i, 2, seed) * 14 - t * speed) % 14;
      const y = .1 + (phase + 14) % 14;
      const x = anchorX + (hash(i, 3, seed) - .5) * 35 + y * .07;
      const z = anchorZ + (hash(i, 4, seed) - .5) * 105;
      const length = .30 + hash(i, 5, seed) * .46;
      const offset = i * 6;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
      positions[offset + 3] = x - length * .18;
      positions[offset + 4] = Math.max(.08, y - length);
      positions[offset + 5] = z - length * .10;
    }
    attribute.needsUpdate = true;
  };
  setIntensity(.66);
  update(0);
  root.userData = { id: 'storm_rain_A', collisionRole: 'none', visualOnly: true,
    axes: '+Y up, +Z forward', seeded: true };
  return { root, setIntensity, update, dispose: () => { geometry.dispose(); material.dispose(); } };
}

/** Faint ground ripples for the same seeded rain clock; one instanced draw call. */
export function createRainSplashArt(seed = 17, splashes = 150): RainArt {
  const root = new THREE.Group(); root.name = 'storm_ground_splashes';
  const geometry = new THREE.RingGeometry(.72, 1, 8);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({ color: '#a9c8c9', transparent: true,
    opacity: .30, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const rings = new THREE.InstancedMesh(geometry, material, splashes);
  rings.name = 'seeded_rain_ripples'; rings.frustumCulled = false;
  root.add(rings);
  const dummy = new THREE.Object3D();
  const cycles = new Float64Array(splashes).fill(NaN);
  const centers = new Float64Array(splashes * 2);
  let lastTime = -1;
  const setIntensity = (amount: number) => {
    rings.count = Math.round(splashes * THREE.MathUtils.clamp(amount, 0, 1));
    rings.visible = rings.count > 0;
  };
  const update: RainArt['update'] = (elapsedSeconds, anchorX = 0, anchorZ = 25, groundPoint) => {
    const t = Math.max(0, elapsedSeconds);
    if (t < lastTime) cycles.fill(NaN);
    lastTime = t;
    for (let i = 0; i < splashes; i++) {
      const rate = .56 + hash(i, 1, seed) * .7;
      const phase = hash(i, 2, seed) + t * rate;
      const cycle = Math.floor(phase), age = phase - cycle;
      if (cycle !== cycles[i]) {
        const lateral = (hash(i + cycle * splashes, 3, seed) - .5) * 8.8;
        const longitudinal = (hash(i + cycle * splashes, 4, seed) - .5) * 62;
        const point = groundPoint?.(lateral, longitudinal) ??
          { x: anchorX + lateral, z: anchorZ + longitudinal };
        centers[i * 2] = point.x; centers[i * 2 + 1] = point.z;
        cycles[i] = cycle;
      }
      const size = (.055 + age * .19) * (1 - age * .55);
      dummy.position.set(centers[i * 2], .086, centers[i * 2 + 1]);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      rings.setMatrixAt(i, dummy.matrix);
    }
    rings.instanceMatrix.needsUpdate = true;
  };
  setIntensity(.42);
  root.userData = { id: 'storm_splashes_A', collisionRole: 'none', visualOnly: true,
    axes: '+Y up, +Z forward', seeded: true };
  return { root, setIntensity, update, dispose: () => { geometry.dispose(); material.dispose(); } };
}
