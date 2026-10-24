import * as THREE from 'three';
import { balance } from '../config';

export interface RoadArt {
  root: THREE.Group;
  setJunctionClearance: (clear: boolean) => void;
  setWetness: (amount: number) => void;
  dispose: () => void;
}
const mat = (color: string) => new THREE.MeshStandardMaterial({
  color, roughness: 1, flatShading: true, side: THREE.DoubleSide,
});
function asphaltMaterial(dryColor: string, wetColor: string) {
  const dry = new THREE.Color(dryColor), wet = new THREE.Color(wetColor);
  const material = new THREE.MeshPhysicalMaterial({
    color: dry, roughness: .94, clearcoat: 0, clearcoatRoughness: .31,
    flatShading: true, side: THREE.DoubleSide,
  });
  const setWetness = (amount: number) => {
    const wetness = THREE.MathUtils.clamp(amount, 0, 1);
    material.color.copy(dry).lerp(wet, wetness);
    material.roughness = .94 - wetness * .39;
    material.clearcoat = wetness * .42;
  };
  return { material, setWetness };
}
function box(parent: THREE.Object3D, name: string, size: [number, number, number],
  pos: [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name; mesh.position.set(...pos); parent.add(mesh); return mesh;
}
function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(obj => { if (obj instanceof THREE.Mesh) {
    geometries.add(obj.geometry);
    (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m));
  } });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}

/** Four-metre visual tile following pathPose at runtime; lane width stays 3.2 m × 3. */
export function createRoadTileArt(lod: 'near' | 'far' = 'near'): RoadArt {
  const width = balance.laneWidth * balance.laneCount;
  const root = new THREE.Group(); root.name = `road_tile_4m_${lod}`;
  const asphalt = asphaltMaterial('#43565a', '#33494e');
  const edge = mat('#e0d7b3'), lane = mat('#c5d3c4');
  const dirt = mat('#92765d'), grass = mat('#67915e'), postMat = mat('#d6c7a4');
  box(root, 'asphalt_4m', [width, .07, 4], [0, -.035, 0], asphalt.material);
  const marks = new THREE.Group(); marks.name = 'markings'; root.add(marks);
  for (const side of [-1, 1]) {
    const x = side * width / 2;
    box(marks, `edge_${side}`, [.12, .018, 4], [x + side * .06, .016, 0], edge);
    box(marks, `lane_dash_${side}`, [.09, .018, 1.8],
      [side * balance.laneWidth / 2, .016, 0], lane);
    box(root, `shoulder_${side}`, [.68, .06, 4], [side * (width / 2 + .39), -.045, 0], dirt);
    if (lod === 'near') {
      box(root, `shoulder_grass_${side}`, [.29, .045, 4],
        [side * (width / 2 + .78), -.046, 0], grass);
      box(marks, `road_post_${side}`, [.18, .68, .18],
        [side * (width / 2 + .50), .34, 0], postMat);
    }
  }
  root.userData = { id: 'road_tile_4m_A', axes: '+Y up, +Z forward', widthM: width,
    lengthM: 4, segmentPlacement: 'pathPose every 4 m', collisionRole: 'none' };
  return { root, setJunctionClearance: (clear: boolean) => { marks.visible = !clear; },
    setWetness: asphalt.setWetness,
    dispose: () => disposeTree(root) };
}

/** The existing junction spans 90 m across the road and 190 m down the old straight. */
export function createJunctionArt(blockedStraight: boolean,
  lod: 'near' | 'far' = 'near'): RoadArt {
  const root = new THREE.Group(); root.name = `road_junction_${lod}`;
  const asphalt = asphaltMaterial('#3d4849', '#303e43');
  const edge = mat('#cbcbb9'), dark = mat('#3b4140');
  const amber = mat('#c99168'), white = mat('#d9d7bd');
  box(root, 'cross_street', [90, .07, 9.6], [0, -.055, -10.2], asphalt.material);
  box(root, 'old_straight', [9.6, .04, 190], [0, -.08, -95], asphalt.material);
  const markings = new THREE.Group(); markings.name = 'junction_markings'; root.add(markings);
  for (const side of [-1, 1]) {
    box(markings, `old_edge_${side}`, [.12, .025, 150],
      [side * 4.9, -.035, -95], edge);
    box(markings, `old_lane_${side}`, [.09, .025, 150],
      [side * balance.laneWidth / 2, -.035, -95], white);
    box(markings, `cross_edge_${side}`, [90, .02, .12],
      [0, -.018, -10.2 + side * 4.84], edge);
  }
  const barrier = new THREE.Group(); barrier.name = 'blocked_straight_barrier'; root.add(barrier);
  box(barrier, 'rail', [9.2, .38, .28], [0, .45, -12], amber);
  for (const x of [-4.25, 0, 4.25]) {
    box(barrier, `post_${x}`, [.17, .66, .26], [x, .35, -12], dark);
    box(barrier, `post_reflector_${x}`, [.19, .15, .04], [x, .61, -11.84], white);
  }
  barrier.visible = blockedStraight;
  root.userData = { id: 'road_junction_A', axes: '+Y up, +Z forward',
    crossStreetWidthM: 90, crossStreetDepthM: 9.6, oldRoadLengthM: 190,
    collisionRole: 'none', placementSource: 'junction/pathPose' };
  return { root, setJunctionClearance: (clear: boolean) => { markings.visible = !clear; },
    setWetness: asphalt.setWetness,
    dispose: () => disposeTree(root) };
}
