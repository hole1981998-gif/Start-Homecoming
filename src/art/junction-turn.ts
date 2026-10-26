import * as THREE from 'three';
import { balance } from '../config';
import type { Turn } from '../route';

const arcMetres = 16;
const turnRate = Math.PI / 32;
const roadWidth = balance.laneWidth * balance.laneCount;
const sampleMetres = Array.from({ length: 17 }, (_, index) => -8 + index * 2);

function centerAt(metres: number, turn: Turn | null) {
  if (!turn || metres <= 0) return { x: 0, z: -metres, heading: 0 };
  const sign = turn === 'right' ? 1 : -1;
  const arc = Math.min(arcMetres, metres);
  const rate = sign * turnRate;
  const heading = rate * arc;
  const x = (1 - Math.cos(heading)) / rate;
  const z = -Math.sin(heading) / rate;
  return metres <= arcMetres ? { x, z, heading } :
    { x: x + Math.sin(heading) * (metres - arcMetres),
      z: z - Math.cos(heading) * (metres - arcMetres), heading };
}

function ribbon(turn: Turn | null, offset: number, width: number, y: number): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const [index, metres] of sampleMetres.entries()) {
    const center = centerAt(metres, turn);
    const sideX = Math.cos(center.heading), sideZ = Math.sin(center.heading);
    for (const edge of [-.5, .5]) {
      const lateral = offset + edge * width;
      vertices.push(center.x + sideX * lateral, y, center.z + sideZ * lateral);
    }
    if (index === 0) continue;
    const previous = (index - 1) * 2, current = index * 2;
    indices.push(previous, previous + 1, current,
      previous + 1, current + 1, current);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export interface JunctionTurnArt {
  root: THREE.Group;
  setTurn: (turn: Turn | null) => void;
  dispose: () => void;
}

export function createJunctionAsphaltMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color: '#566056', roughness: .56,
    clearcoat: .39, clearcoatRoughness: .31, flatShading: true, side: THREE.DoubleSide });
}

/** Asphalt and edge lines bridge the hidden road tiles across the 16 m Q/E arc. */
export function createJunctionTurnArt(): JunctionTurnArt {
  const root = new THREE.Group(); root.name = 'junction_turn_road';
  root.userData.collisionRole = 'decorative-only';
  const asphalt = createJunctionAsphaltMaterial();
  const edge = new THREE.MeshStandardMaterial({ color: '#e0d7b3', roughness: 1,
    side: THREE.DoubleSide });
  const crossStreet = new THREE.Mesh(new THREE.BoxGeometry(90, .07, roadWidth), asphalt);
  crossStreet.name = 'junction_cross_street';
  crossStreet.position.set(0, -.055, -10.2);
  crossStreet.receiveShadow = true;
  root.add(crossStreet);
  const variants = new Map<Turn | null, THREE.Group>();
  for (const turn of [null, 'left', 'right'] as const) {
    const group = new THREE.Group(); group.name = `junction_apron_${turn ?? 'straight'}`;
    const surface = new THREE.Mesh(ribbon(turn, 0, roadWidth, .004), asphalt);
    surface.name = `turn_surface_${turn ?? 'straight'}`;
    surface.receiveShadow = true;
    group.add(surface);
    for (const side of [-1, 1]) {
      const line = new THREE.Mesh(ribbon(turn, side * (roadWidth / 2 + .06), .12, .027), edge);
      line.name = `turn_edge_${turn ?? 'straight'}_${side}`;
      group.add(line);
    }
    root.add(group); variants.set(turn, group);
  }
  const setTurn = (turn: Turn | null) => {
    for (const [choice, group] of variants) group.visible = choice === turn;
  };
  setTurn(null);
  return { root, setTurn, dispose: () => {
    root.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    asphalt.dispose(); edge.dispose();
  } };
}
