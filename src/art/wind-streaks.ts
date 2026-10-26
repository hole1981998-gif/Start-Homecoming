import * as THREE from 'three';

export interface WindStreakArt {
  root: THREE.Group;
  setVisualTime: (seconds: number, lateralPush: number) => void;
  dispose: () => void;
}

const count = 30;
const fraction = (value: number) => value - Math.floor(value);

/** Sparse, directional gusts above the road; the simulation remains the wind source. */
export function createWindStreakArt(width: number, length: number): WindStreakArt {
  const root = new THREE.Group(); root.name = 'wind_streaks';
  const geometry = new THREE.BufferGeometry();
  const spine = [[-.03, -1.5, .004], [-.10, -.5, .045],
    [.08, .45, .055], [.02, 1.5, .002]] as const;
  const points: number[] = [];
  for (let i = 0; i < spine.length - 1; i++) {
    const [x0, z0, w0] = spine[i], [x1, z1, w1] = spine[i + 1];
    points.push(x0 - w0, 0, z0, x0 + w0, 0, z0, x1 - w1, 0, z1,
      x0 + w0, 0, z0, x1 + w1, 0, z1, x1 - w1, 0, z1);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshBasicMaterial({
    color: '#afd0ce', transparent: true, opacity: .31,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const streaks = new THREE.InstancedMesh(geometry, material, count);
  streaks.name = 'wind_gust_ribbons';
  streaks.frustumCulled = false;
  root.add(streaks);
  const dummy = new THREE.Object3D();
  const setVisualTime = (seconds: number, lateralPush: number) => {
    const direction = lateralPush < 0 ? -1 : 1;
    for (let i = 0; i < count; i++) {
      const lane = i % 4;
      const time = fraction(seconds * (.72 + lane * .08) + i * .61803398875);
      const x = direction * ((time - .5) * (width - .9));
      const z = (fraction(i * .38196601125) - .5) * (length - 3) +
        Math.sin(seconds * 1.1 + i * 2.2) * .28;
      dummy.position.set(x, .11 + lane * .075, z);
      dummy.rotation.set(0, direction * (Math.PI / 2 - .34) +
        (fraction(i * .754877666) - .5) * .5, 0);
      dummy.scale.set(.75 + (i % 3) * .18, 1, .42 + (i % 7) * .11);
      dummy.updateMatrix();
      streaks.setMatrixAt(i, dummy.matrix);
    }
    streaks.instanceMatrix.needsUpdate = true;
  };
  setVisualTime(0, 1);
  root.userData = { widthM: width, lengthM: length, collisionRole: 'visual-only' };
  return { root, setVisualTime, dispose: () => { geometry.dispose(); material.dispose(); } };
}
