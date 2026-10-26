import * as THREE from 'three';
import { pathPose, type RouteState } from '../route';

const cellMetres = 58;
const visiblePatches = 5;

function hash(value: number): number {
  let result = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  result = Math.imul(result ^ (result >>> 15), 0x846ca68b);
  return (result ^ (result >>> 16)) >>> 0;
}

/** Visual placement uses its own hash and never advances the gameplay RNG. */
export function cloudShadowPlacement(seed: number, cell: number) {
  const value = hash(seed ^ Math.imul(cell, 0x9e3779b1) ^ 0x4ba0735d);
  return {
    distance: cell * cellMetres + 18 + (value & 15),
    lateral: ((value >>> 8) % 2001) / 100 - 10,
    width: 27 + ((value >>> 20) & 15),
    length: 25 + ((value >>> 16) & 15),
    yaw: (((value >>> 24) & 31) - 15) * .018,
  };
}

function featherTexture(): THREE.DataTexture {
  const size = 96;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size * 2 - 1;
    const v = (y + .5) / size * 2 - 1;
    // Broad, overlapping lobes avoid a perfectly circular stamp.
    const lobeA = Math.hypot((u + .22) / .74, (v - .08) / .77);
    const lobeB = Math.hypot((u - .28) / .77, (v + .12) / .70);
    const lobeC = Math.hypot((u + .01) / .85, (v + .28) / .69);
    const envelope = Math.max(0, Math.min(1, (1 - Math.min(lobeA, lobeB, lobeC)) / .34));
    const alpha = envelope * envelope * (3 - 2 * envelope);
    const offset = (y * size + x) * 4;
    pixels[offset] = 255;
    pixels[offset + 1] = Math.round(alpha * 255);
    pixels[offset + 2] = 255;
    pixels[offset + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.needsUpdate = true;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export interface CloudShadowArt {
  root: THREE.Group;
  update: (seed: number, distance: number, route: RouteState) => void;
  dispose: () => void;
}

/** Large soft cloud shade crossing asphalt and the surrounding ground. */
export function createCloudShadowArt(): CloudShadowArt {
  const root = new THREE.Group();
  root.name = 'cloud_shadows';
  const texture = featherTexture();
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: '#203c4c', alphaMap: texture, opacity: .46,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const patches = Array.from({ length: visiblePatches }, (_, index) => {
    const patch = new THREE.Mesh(geometry, material);
    patch.name = `cloud_shadow_${index}`;
    patch.position.y = .022;
    patch.renderOrder = 1;
    root.add(patch);
    return patch;
  });
  return {
    root,
    update(seed, distance, route) {
      const firstCell = Math.floor((distance - 24) / cellMetres);
      patches.forEach((patch, index) => {
        const placement = cloudShadowPlacement(seed, firstCell + index);
        const pose = pathPose(placement.distance, route, seed);
        patch.position.set(
          pose.x + Math.cos(pose.heading) * placement.lateral,
          .022,
          pose.z + Math.sin(pose.heading) * placement.lateral,
        );
        patch.rotation.y = -pose.heading + placement.yaw;
        patch.scale.set(placement.width, 1, placement.length);
      });
    },
    dispose() { geometry.dispose(); material.dispose(); texture.dispose(); },
  };
}
