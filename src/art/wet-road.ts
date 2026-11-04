import * as THREE from 'three';

/** Broad damp patches rather than a uniform polished road; no collision role. */
export function createWetRoadRoughness(): THREE.DataTexture {
  const size = 32, bytes = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const wave = Math.sin(x * Math.PI / 8 + Math.sin(y * Math.PI / 16)) *
      Math.cos(y * Math.PI / 16);
    const value = Math.round(195 + wave * 45);
    const i = (y * size + x) * 4;
    bytes[i] = bytes[i + 1] = bytes[i + 2] = value; bytes[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(bytes, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
