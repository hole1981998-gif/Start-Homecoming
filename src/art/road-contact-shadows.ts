import * as THREE from 'three';

const groundY = .034;

/** One shared soft mask keeps moving road-object shadows cheap to render. */
export function createRoadContactShadows() {
  const size = 48;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = (x + .5 - size / 2) / (size / 2);
    const ny = (y + .5 - size / 2) / (size / 2);
    const radius = Math.hypot(nx, ny);
    const density = Math.max(0, 1 - radius ** 2);
    const at = (y * size + x) * 4;
    pixels[at] = pixels[at + 1] = pixels[at + 2] = Math.round(density * density * 255);
    pixels[at + 3] = 255;
  }
  const mask = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  mask.magFilter = mask.minFilter = THREE.LinearFilter;
  mask.needsUpdate = true;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({ color: '#102a30', alphaMap: mask,
    transparent: true, opacity: .55, depthWrite: false, side: THREE.DoubleSide });
  const meshes = new Set<THREE.Mesh>();
  return {
    create: () => {
      const shadow = new THREE.Mesh(geometry, material);
      shadow.name = 'road_contact_shadow';
      shadow.userData.collisionRole = 'decorative-only';
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = groundY;
      meshes.add(shadow);
      return shadow;
    },
    place: (shadow: THREE.Mesh, x: number, z: number, yaw: number,
      width: number, length: number) => {
      shadow.position.set(x, groundY, z);
      shadow.rotation.set(-Math.PI / 2, yaw, 0, 'YXZ');
      shadow.scale.set(Math.max(.55, width), Math.max(.65, length), 1);
      shadow.visible = true;
    },
    dispose: () => {
      for (const shadow of meshes) shadow.removeFromParent();
      meshes.clear(); geometry.dispose(); material.dispose(); mask.dispose();
    },
  };
}
