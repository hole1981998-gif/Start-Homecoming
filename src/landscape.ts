/** Prototype-only world-space color regions; metres, independent of route and gameplay RNG. */
export const LANDSCAPE_REGION_METRES = 96;

export const landscapeColors = {
  city: '#6a767d',
  sea: '#477184',
  trees: '#446b55',
  cliffs: '#856d5d',
  rice: '#92945f',
} as const;

export type LandscapeKind = keyof typeof landscapeColors;
const kinds = Object.keys(landscapeColors) as LandscapeKind[];

function mix(value: number): number {
  let hash = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** The road hides the seam: adjacent roadside regions may match or differ. */
export function roadsideRegions(seed: number, distance: number): { left: LandscapeKind; right: LandscapeKind } {
  const section = Math.floor(distance / LANDSCAPE_REGION_METRES);
  const hash = mix(seed ^ Math.imul(section, 0x9e3779b1) ^ 0x6d2b79f5);
  const leftIndex = hash % kinds.length;
  const different = (hash >>> 8) % 3 !== 0;
  const rightIndex = different ? (leftIndex + 1 + ((hash >>> 16) % (kinds.length - 1))) % kinds.length : leftIndex;
  return { left: kinds[leftIndex], right: kinds[rightIndex] };
}

export function roadsidePoint(pose: { x: number; z: number; heading: number }, side: -1 | 1, offset: number): readonly [number, number] {
  return [pose.x + Math.cos(pose.heading) * side * offset,
    pose.z + Math.sin(pose.heading) * side * offset];
}

export function landscapeAt(seed: number, worldX: number, worldZ: number): LandscapeKind {
  const cellX = Math.floor(worldX / LANDSCAPE_REGION_METRES);
  const cellZ = Math.floor(worldZ / LANDSCAPE_REGION_METRES);
  return kinds[mix(seed ^ Math.imul(cellX, 0x9e3779b1) ^ Math.imul(cellZ, 0x85ebca6b)) % kinds.length];
}

export interface LandscapeTile { cellX: number; cellZ: number; x: number; z: number; kind: LandscapeKind }

export function landscapeWindow(seed: number, worldX: number, worldZ: number): LandscapeTile[] {
  const centerX = Math.floor(worldX / LANDSCAPE_REGION_METRES);
  const centerZ = Math.floor(worldZ / LANDSCAPE_REGION_METRES);
  return Array.from({ length: 25 }, (_, index) => {
    const cellX = centerX + index % 5 - 2;
    const cellZ = centerZ + Math.floor(index / 5) - 2;
    const x = (cellX + .5) * LANDSCAPE_REGION_METRES;
    const z = (cellZ + .5) * LANDSCAPE_REGION_METRES;
    return { cellX, cellZ, x, z, kind: landscapeAt(seed, x, z) };
  });
}
