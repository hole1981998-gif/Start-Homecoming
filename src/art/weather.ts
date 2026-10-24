import * as THREE from 'three';

export interface RainArt {
  root: THREE.Group;
  setIntensity: (amount: number) => void;
  update: (elapsedSeconds: number, anchorX?: number, anchorZ?: number) => void;
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
