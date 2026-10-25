import * as THREE from 'three';

export interface RoadShadowArt {
  root: THREE.Group;
  dispose: () => void;
}

/** A visual band for wet-road chiaroscuro. Place the root at a route pose; it has no collider. */
export function createRoadShadowArt(width: number, skew: number, bandWidth: number): RoadShadowArt {
  if (![width, skew, bandWidth].every(Number.isFinite) || width <= 0 || bandWidth <= 0)
    throw new Error('Invalid road-shadow dimensions');
  const root = new THREE.Group();
  root.name = 'env_long_road_shadow';
  root.userData = { collisionRole: 'decorative-only', widthM: width,
    skewM: skew, bandWidthM: bandWidth, axes: '+Y up, +Z forward' };

  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const columns = 10;
  for (let i = 0; i <= columns; i++) {
    const u = i / columns;
    const x = (u - .5) * width;
    const drift = Math.sin(u * 15.7 + .7) * .19 + Math.sin(u * 27.2) * .08;
    const z = (u - .5) * skew + drift;
    for (const v of [0, 1]) {
      positions.push(x, .029, z + (v - .5) * bandWidth);
      uvs.push(u, v);
    }
    if (i < columns) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  const smooth = (x: number) => x * x * (3 - 2 * x);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / (size - 1), v = y / (size - 1);
    const edge = Math.min(v, 1 - v) / .10;
    const end = Math.min(u, 1 - u) / .10;
    const density = smooth(Math.min(1, Math.max(0, edge))) *
      smooth(Math.min(1, Math.max(0, end)));
    const index = (y * size + x) * 4;
    pixels[index] = pixels[index + 1] = pixels[index + 2] =
      Math.round(density * 255);
    pixels[index + 3] = 255;
  }
  const alphaMap = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  alphaMap.magFilter = alphaMap.minFilter = THREE.LinearFilter;
  alphaMap.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({ color: '#0c4657', alphaMap,
    transparent: true, opacity: .82, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'feathered_long_shadow';
  root.add(mesh);
  return { root, dispose: () => { geometry.dispose(); material.dispose(); alphaMap.dispose(); } };
}
