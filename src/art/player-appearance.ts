import * as THREE from 'three';

export const playerHelmetColor = '#a77736';
export const playerJacketColor = '#1b2023';
export const playerPantsColor = '#171b1e';

type SuitPoint = readonly [number, number, number];

function suitPanel(parent: THREE.Object3D, name: string, points: readonly SuitPoint[], color: string): void {
  const positions: number[] = [];
  for (let i = 1; i < points.length - 1; i++)
    for (const point of [points[0], points[i], points[i + 1]]) positions.push(...point);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color, roughness: .86,
    side: THREE.DoubleSide, flatShading: true });
  const panel = new THREE.Mesh(geometry, material);
  panel.name = name;
  parent.add(panel);
}

function addSuitFront(root: THREE.Object3D): void {
  let torso: THREE.Object3D | undefined;
  root.traverse(node => { if (node.name.startsWith('torso_pivot')) torso = node; });
  if (!torso || torso.getObjectByName('suit_shirt_front')) return;
  // Flat garment panels follow the existing torso. No seat, pose or collider changes.
  suitPanel(torso, 'suit_shirt_front', [
    [-.105, .555, .158], [.105, .555, .158], [.082, .405, .205],
    [0, .215, .218], [-.082, .405, .205],
  ], '#e9e7df');
  for (const side of [-1, 1]) {
    suitPanel(torso, `suit_lapel_${side}`, [
      [side * .105, .555, .162], [side * .165, .525, .166],
      [side * .110, .365, .212], [side * .018, .235, .225],
      [side * .080, .405, .212],
    ], '#30383a');
  }
  suitPanel(torso, 'suit_tie', [
    [-.028, .520, .175], [.028, .520, .175], [.035, .480, .187],
    [.017, .445, .200], [.023, .315, .224], [0, .265, .228],
    [-.023, .315, .224], [-.017, .445, .200], [-.035, .480, .187],
  ], '#8f3035');
}

/** Give only the player driver a dark suit, leaving shared NPC materials untouched. */
export function colorPlayerJacket(root: THREE.Object3D): void {
  if (root.userData.playerJacketTinted) return;
  const tinted = new Map<string, THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) ||
      !/^(coat_torso|coat_hem|soft_shoulder_|upper_arm_|soft_elbow_|forearm_|pants_pelvis|thigh_|soft_knee_|shin_)/.test(object.name)) return;
    const color = /^(pants_pelvis|thigh_|soft_knee_|shin_)/.test(object.name)
      ? playerPantsColor : playerJacketColor;
    const tint = (source: THREE.Material) => {
      if (!(source instanceof THREE.MeshStandardMaterial || source instanceof THREE.MeshLambertMaterial)) return source;
      const key = `${source.uuid}:${color}`;
      let material = tinted.get(key);
      if (!material) {
        const clone = source.clone(); clone.color.set(color);
        material = clone; tinted.set(key, clone);
      }
      return material;
    };
    object.material = Array.isArray(object.material) ? object.material.map(tint) : tint(object.material);
  });
  addSuitFront(root);
  root.userData.playerJacketTinted = true;
}

/** Player-only helmet tint and slight rear clearance for the hair underneath. */
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
    if (object.name.startsWith('rain_helmet')) {
      object.scale.x *= 1.16;
      object.scale.y *= 1.08;
      object.scale.z *= 1.40;
    } else {
      object.scale.x *= 1.05;
    }
  });
  root.userData.playerHelmetTinted = true;
}
