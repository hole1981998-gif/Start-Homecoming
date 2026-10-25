import * as THREE from 'three';

export type OpenWaterKind = 'river' | 'lake';
export interface OpenWaterArt {
  root: THREE.Group;
  setVisualTime: (elapsedSeconds: number) => void;
  dispose: () => void;
}

/** Decorative water source for future river/lake placement; it never changes gameplay collision. */
export function createOpenWaterArt(kind: OpenWaterKind, width: number, length: number,
  lod: 'near' | 'far' = 'near'): OpenWaterArt {
  if (!Number.isFinite(width) || !Number.isFinite(length) || width <= 0 || length <= 0)
    throw new Error('Invalid open-water footprint');
  const root = new THREE.Group();
  root.name = `env_${kind}_${lod}`;
  root.userData = { id: root.name, widthM: width, lengthM: length,
    axes: '+Y up, +Z forward', collisionRole: 'decorative-only',
    placementSource: 'future art placement; no spawn change' };
  const vertices: number[] = [], colors: number[] = [], indices: number[] = [];
  const edge = new THREE.Color('#8bc8b5');
  const middle = new THREE.Color(kind === 'river' ? '#2a778f' : '#4a9fac');
  const color = new THREE.Color();
  if (kind === 'river') {
    const columns = lod === 'near' ? 20 : 10;
    const rows = lod === 'near' ? 52 : 24;
    for (let row = 0; row <= rows; row++) {
      const z = (row / rows - .5) * length;
      const bend = Math.sin(z * .17) * width * .045;
      const bankWidth = .80 + Math.sin(z * .25 + .7) * .06;
      for (let col = 0; col <= columns; col++) {
        const u = col / columns;
        vertices.push((u - .5) * width * bankWidth + bend, 0, z);
        color.copy(middle).lerp(edge, Math.abs(u - .5) * 1.65);
        color.multiplyScalar(.93 + .07 * Math.sin(z * .42 + u * 8.7));
        colors.push(color.r, color.g, color.b);
        if (row < rows && col < columns) {
          const a = row * (columns + 1) + col;
          indices.push(a, a + columns + 1, a + 1,
            a + 1, a + columns + 1, a + columns + 2);
        }
      }
    }
  } else {
    const segments = lod === 'near' ? 48 : 24;
    const rings = lod === 'near' ? 12 : 6;
    vertices.push(0, 0, 0);
    colors.push(middle.r, middle.g, middle.b);
    for (let ring = 1; ring <= rings; ring++) {
      const r = ring / rings;
      for (let segment = 0; segment < segments; segment++) {
        const angle = segment * Math.PI * 2 / segments;
        const uneven = 1 + Math.sin(angle * 3 + .8) * .035 +
          Math.sin(angle * 7 - .3) * .025;
        vertices.push(Math.cos(angle) * width * .43 * r * uneven, 0,
          Math.sin(angle) * length * .43 * r * uneven);
        color.copy(middle).lerp(edge, Math.max(0, r - .42) * 1.35);
        color.multiplyScalar(.97 + .03 * Math.sin(
          Math.cos(angle) * width * r * .38 + Math.sin(angle) * length * r * .16));
        colors.push(color.r, color.g, color.b);
        const next = (segment + 1) % segments;
        if (ring === 1) indices.push(0, 1 + next, 1 + segment);
        else {
          const inner = 1 + (ring - 2) * segments + segment;
          const outer = 1 + (ring - 1) * segments + segment;
          const innerNext = 1 + (ring - 2) * segments + next;
          const outerNext = 1 + (ring - 1) * segments + next;
          indices.push(inner, innerNext, outer, outer, innerNext, outerNext);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshPhysicalMaterial({ color: '#ffffff', vertexColors: true,
    roughness: .32, metalness: .04, clearcoat: .66, clearcoatRoughness: .18,
    side: THREE.DoubleSide, flatShading: true });
  const surface = new THREE.Mesh(geometry, material);
  surface.name = `${kind}_water_surface`;
  root.add(surface);
  let shoreGeometry: THREE.BufferGeometry | undefined;
  let shoreMaterial: THREE.MeshStandardMaterial | undefined;
  if (kind === 'river') {
    const columns = lod === 'near' ? 20 : 10;
    const rows = lod === 'near' ? 52 : 24;
    const shorePositions: number[] = [];
    for (const edgeColumn of [0, columns]) for (let row = 0; row < rows; row++) {
      const point = (r: number, outward: number) => {
        const vertex = (r * (columns + 1) + edgeColumn) * 3;
        return [vertices[vertex] + (edgeColumn === 0 ? -1 : 1) * outward * width,
          outward === 0 ? -.035 : .16, vertices[vertex + 2]];
      };
      const a = point(row, 0), b = point(row + 1, 0);
      const c = point(row, .035), d = point(row + 1, .035);
      shorePositions.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
    shoreGeometry = new THREE.BufferGeometry();
    shoreGeometry.setAttribute('position', new THREE.Float32BufferAttribute(shorePositions, 3));
    shoreGeometry.computeVertexNormals();
    shoreMaterial = new THREE.MeshStandardMaterial({ color: '#7a977a', roughness: .94,
      side: THREE.DoubleSide, flatShading: true });
    const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
    shore.name = 'river_grassy_banks';
    root.add(shore);
  } else {
    const segments = lod === 'near' ? 48 : 24;
    const shorePositions: number[] = [];
    for (let i = 0; i < segments; i++) {
      const point = (segment: number, radius: number) => {
        const angle = segment * Math.PI * 2 / segments;
        const uneven = 1 + Math.sin(angle * 3 + .8) * .035 +
          Math.sin(angle * 7 - .3) * .025;
        return [Math.cos(angle) * width * radius * uneven,
          radius < .43 ? -.035 : .16,
          Math.sin(angle) * length * radius * uneven];
      };
      const a = point(i, .425), b = point(i + 1, .425);
      const c = point(i, .47), d = point(i + 1, .47);
      shorePositions.push(...a, ...c, ...b, ...b, ...c, ...d);
    }
    shoreGeometry = new THREE.BufferGeometry();
    shoreGeometry.setAttribute('position', new THREE.Float32BufferAttribute(shorePositions, 3));
    shoreGeometry.computeVertexNormals();
    shoreMaterial = new THREE.MeshStandardMaterial({ color: '#77947a', roughness: .94,
      side: THREE.DoubleSide, flatShading: true });
    const shore = new THREE.Mesh(shoreGeometry, shoreMaterial);
    shore.name = 'lake_vegetated_bank';
    root.add(shore);
  }
  const base = Float32Array.from(geometry.getAttribute('position').array as Float32Array);
  const setVisualTime = (elapsedSeconds: number) => {
    const t = Math.max(0, elapsedSeconds);
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = position.array as Float32Array;
    for (let i = 0; i < array.length; i += 3) {
      const x = base[i], z = base[i + 2];
      const edgeDistance = kind === 'lake'
        ? Math.hypot(x / (width * .43), z / (length * .43))
        : Math.abs(x / (width * .5));
      const fade = Math.max(.16, 1 - edgeDistance * .74);
      const amplitude = (lod === 'near' ? 1 : .28) * (kind === 'lake' ? .75 : 1);
      array[i + 1] = base[i + 1] +
        fade * amplitude * (Math.sin(x * .68 + z * .84 + t * 1.3) * .11 +
          Math.sin(x * 1.45 - z * .46 - t * 1.1) * .055 +
          Math.sin(z * .19 + x * .26 + t * .65) * .07);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  };
  return { root, setVisualTime, dispose: () => {
    geometry.dispose(); material.dispose();
    shoreGeometry?.dispose(); shoreMaterial?.dispose();
  } };
}
