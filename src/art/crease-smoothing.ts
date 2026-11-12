import * as THREE from 'three';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { runtimeMode } from '../runtime-mode';

export const modelCreaseDegrees = 35;

/** Blender-style smooth-by-angle for authored models; edges sharper than the crease stay crisp. */
export function smoothModelByAngle(root: THREE.Object3D, degrees = modelCreaseDegrees): number {
  const radians = THREE.MathUtils.degToRad(degrees);
  const converted = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
  let changed = 0;
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const source = object.geometry;
    if (source.getAttribute('position') && source.userData.creaseDegrees !== degrees) {
      let geometry = converted.get(source);
      if (!geometry) {
        geometry = toCreasedNormals(source, radians);
        geometry.userData.creaseDegrees = degrees;
        converted.set(source, geometry);
        changed++;
      }
      object.geometry = geometry;
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if ('flatShading' in material && material.flatShading === true) {
        material.flatShading = false;
        material.needsUpdate = true;
      }
    }
  });
  for (const [source, replacement] of converted) if (source !== replacement) source.dispose();
  return changed;
}

/** Preserve ver.noforce's original flat-shaded appearance. */
export function smoothGameModelByAngle(root: THREE.Object3D,
  pathname = typeof location === 'undefined' ? '/' : location.pathname): number {
  return runtimeMode(pathname) === 'force' ? smoothModelByAngle(root) : 0;
}
