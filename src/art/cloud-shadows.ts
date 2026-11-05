import * as THREE from 'three';
import { pathPose, type RouteState } from '../route';
import { roadShadowColor, roadShadowOpacity } from './road-shadows';

const cellMetres = 39;
const visiblePatches = 8;

function hash(value: number): number {
  let result = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  result = Math.imul(result ^ (result >>> 15), 0x846ca68b);
  return (result ^ (result >>> 16)) >>> 0;
}

/** Visual placement uses its own hash and never advances the gameplay RNG. */
export function cloudShadowPlacement(seed: number, cell: number) {
  const value = hash(seed ^ Math.imul(cell, 0x9e3779b1) ^ 0x4ba0735d);
  const sizeClass = (value >>> 20) & 3;
  return {
    distance: cell * cellMetres + 12 + (value & 11),
    lateral: ((value >>> 8) % 2001) / 100 - 10,
    width: [19, 28, 40, 53][sizeClass] + ((value >>> 16) & 3),
    length: [18, 26, 35, 44][sizeClass] + ((value >>> 24) & 3),
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
  applyTo: (root: THREE.Object3D) => void;
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
    color: roadShadowColor, alphaMap: texture, opacity: roadShadowOpacity,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const bounds = { value: Array.from({length:visiblePatches},()=>new THREE.Vector4(0,0,1,1)) };
  const rotations = { value: Array.from({length:visiblePatches},()=>new THREE.Vector2(1,0)) };
  const applied = new WeakSet<THREE.Material>();
  const applyTo = (target: THREE.Object3D) => target.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.receiveShadow = true;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial) || applied.has(material)) continue;
      applied.add(material);
      const previous = material.onBeforeCompile.bind(material);
      const previousKey = material.customProgramCacheKey.bind(material);
      const cacheKey = previousKey();
      material.onBeforeCompile = (shader, renderer) => {
        previous(shader, renderer);
        shader.uniforms.cloudBounds = bounds; shader.uniforms.cloudRotations = rotations;
        shader.uniforms.cloudMask = { value: texture };
        shader.vertexShader = 'varying vec3 vCloudWorld;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>',
          `#include <worldpos_vertex>
          vec4 cloudPosition = vec4(transformed, 1.0);
          #ifdef USE_BATCHING
            cloudPosition = batchingMatrix * cloudPosition;
          #endif
          #ifdef USE_INSTANCING
            cloudPosition = instanceMatrix * cloudPosition;
          #endif
          vCloudWorld = (modelMatrix * cloudPosition).xyz;`);
        shader.fragmentShader = 'varying vec3 vCloudWorld; uniform vec4 cloudBounds[8]; uniform vec2 cloudRotations[8]; uniform sampler2D cloudMask;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
          float cloudTransmission = 1.0;
          for (int i = 0; i < 8; i++) {
            vec2 delta = vCloudWorld.xz - cloudBounds[i].xy;
            vec2 r = cloudRotations[i];
            vec2 uv = vec2(r.x*delta.x-r.y*delta.y, r.y*delta.x+r.x*delta.y) / cloudBounds[i].zw + 0.5;
            uv.y = 1.0 - uv.y;
            if (vCloudWorld.y > 0.08 && uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0)
              cloudTransmission *= 1.0 - texture2D(cloudMask, uv).g * 0.72;
          }
          // Shade reflected light only. Lamps keep their emitted radiance in every cloud.
          vec3 cloudTint = mix(vec3(0.30,0.42,0.47), vec3(1.0), cloudTransmission);
          outgoingLight = (outgoingLight - totalEmissiveRadiance) * cloudTint + totalEmissiveRadiance;
          #include <opaque_fragment>`);
      };
      material.customProgramCacheKey = () => cacheKey + '|cloud-receiver-v2';
      material.needsUpdate = true;
    }
  });
  const patches = Array.from({ length: visiblePatches }, (_, index) => {
    const patch = new THREE.Mesh(geometry, material);
    patch.name = `cloud_shadow_${index}`;
    patch.position.y = .04;
    patch.renderOrder = 1;
    root.add(patch);
    return patch;
  });
  return {
    root, applyTo,
    update(seed, distance, route) {
      const firstCell = Math.floor((distance - 24) / cellMetres);
      patches.forEach((patch, index) => {
        const placement = cloudShadowPlacement(seed, firstCell + index);
        const pose = pathPose(placement.distance, route, seed);
        patch.position.set(
          pose.x + Math.cos(pose.heading) * placement.lateral,
          .04,
          pose.z + Math.sin(pose.heading) * placement.lateral,
        );
        patch.rotation.y = -pose.heading + placement.yaw;
        patch.scale.set(placement.width, 1, placement.length);
        bounds.value[index].set(patch.position.x,patch.position.z,placement.width,placement.length);
        rotations.value[index].set(Math.cos(patch.rotation.y),Math.sin(patch.rotation.y));
      });
    },
    dispose() { geometry.dispose(); material.dispose(); texture.dispose(); },
  };
}
