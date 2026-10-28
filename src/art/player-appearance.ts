import * as THREE from 'three';

export const playerHelmetColor = '#a77736';

/** Player-only shell/brim tint; preserve skin, dark straps and shared NPC materials. */
export function colorPlayerHelmet(root: THREE.Object3D): void {
  if (root.userData.playerHelmetTinted) return;
  const tinted = new Map<THREE.Material, THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !/^(rain_helmet|helmet_brim)/.test(object.name)) return;
    const tint = (source: THREE.Material) => {
      if (!(source instanceof THREE.MeshStandardMaterial || source instanceof THREE.MeshLambertMaterial)) return source;
      let material = tinted.get(source);
      if (!material) {
        const clone = source.clone(); clone.color.set(playerHelmetColor);
        material = clone; tinted.set(source, clone);
      }
      return material;
    };
    object.material = Array.isArray(object.material) ? object.material.map(tint) : tint(object.material);
  });
  root.userData.playerHelmetTinted = true;
}
