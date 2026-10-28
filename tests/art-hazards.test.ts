import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { hazardSizes } from '../src/config';
import { createPropHazardArt, createSurfaceHazardArt, type PropHazardKind } from '../src/art/hazards';
import { createRoadTileArt } from '../src/art/road-kit';

describe('essential hazard art', () => {
  it('reflects the shared sky without owning its lifetime or altering other hazard materials', () => {
    const sky = new THREE.Texture(); let disposed = false;
    sky.addEventListener('dispose', () => { disposed = true; });
    const water = createSurfaceHazardArt('water', 3.2, 7, 'near', sky);
    const floor = water.root.getObjectByName('deep_water') as THREE.Mesh;
    expect((floor.material as THREE.MeshPhysicalMaterial).envMap).toBe(sky);
    const hole = createSurfaceHazardArt('pothole', 3.2, 7, 'near', sky);
    expect(((hole.root.getObjectByName('pothole_depth') as THREE.Mesh).material as THREE.MeshStandardMaterial).envMap).toBeNull();
    water.dispose(); hole.dispose(); expect(disposed).toBe(false); sky.dispose();
  });
  it('matches all live water and pothole footprints without altering simulation dimensions', () => {
    for (const kind of ['water', 'pothole'] as const) for (const [width, length] of hazardSizes[kind]) {
      const asset = createSurfaceHazardArt(kind, width, length);
      const bounds = new THREE.Box3().setFromObject(asset.root);
      const size = bounds.getSize(new THREE.Vector3());
      expect(size.x).toBeLessThanOrEqual(width + .02);
      expect(size.z).toBeLessThanOrEqual(length + .02);
      expect(size.x).toBeGreaterThan(width * .94);
      expect(size.z).toBeGreaterThan(length * .94);
      expect(asset.root.userData.collisionRole).toBe('reference-only');
      const basin = asset.root.getObjectByName('sloped_basin_normals') as THREE.Mesh;
      expect(basin.geometry.getAttribute('normal')).toBeDefined();
      const floor = asset.root.getObjectByName(kind === 'water' ? 'deep_water' : 'pothole_depth') as THREE.Mesh;
      const colors = floor.geometry.getAttribute('color');
      expect(colors).toBeDefined();
      const red = Array.from({ length: colors.count }, (_, i) => colors.getX(i));
      const redRange = Math.max(...red) - Math.min(...red);
      if (kind === 'water') {
        expect(redRange).toBeGreaterThan(.015);
        expect(redRange).toBeLessThan(.08);
      } else expect(redRange).toBeGreaterThan(.05);
      expect(floor.geometry.getAttribute('normal')).toBeDefined();
      asset.dispose();
    }
  });
  it('gives reusable props visible state changes and mount points', () => {
    const kinds: PropHazardKind[] = ['cargo_crate', 'cargo_barrel', 'fuel', 'repair', 'barrier', 'fallen_tree'];
    for (const kind of kinds) {
      const asset = createPropHazardArt(kind);
      expect(asset.sockets.contact.parent).toBe(asset.root);
      expect(asset.root.getObjectByName('used_overlay')?.visible).toBe(false);
      asset.setState('used');
      expect(asset.root.getObjectByName('used_overlay')?.visible).toBe(true);
      asset.setState('broken');
      expect(asset.root.getObjectByName('broken_overlay')?.visible).toBe(true);
      asset.dispose();
    }
  });
  it('marks both faces of the barrier without widening its collision reference', () => {
    const barrier = createPropHazardArt('barrier');
    const front = barrier.root.getObjectByName('stripe_0.43') as THREE.Mesh;
    const back = barrier.root.getObjectByName('stripe_back_0.43') as THREE.Mesh;
    expect(front.position.z).toBeGreaterThan(0);
    expect(back.position.z).toBeLessThan(0);
    expect(new THREE.Box3().setFromObject(barrier.root).getSize(new THREE.Vector3()).x)
      .toBeLessThanOrEqual(6.2);
    barrier.dispose();
  });
  it('animates water normals and highlights deterministically without shifting its footprint', () => {
    const water = createSurfaceHazardArt('water', 3.2, 7);
    const floor = water.root.getObjectByName('deep_water') as THREE.Mesh;
    const material = floor.material as THREE.MeshPhysicalMaterial;
    expect(floor.geometry.getAttribute('uv')?.count).toBe(floor.geometry.getAttribute('position').count);
    expect(material.normalMap).toBeInstanceOf(THREE.DataTexture);
    const position = floor.geometry.getAttribute('position');
    const initial = Array.from(position.array);
    const bounds = new THREE.Box3().setFromObject(water.root);
    water.setVisualTime?.(1.25);
    const frame = Array.from(position.array);
    const uploadedVersion = (position as THREE.BufferAttribute).version;
    water.setVisualTime?.(1.25);
    expect((position as THREE.BufferAttribute).version).toBe(uploadedVersion);
    const normalOffset = material.normalMap!.offset.clone();
    expect(frame).not.toEqual(initial);
    water.setVisualTime?.(3.5);
    water.setVisualTime?.(1.25);
    expect(Array.from(position.array)).toEqual(frame);
    expect(material.normalMap!.offset.toArray()).toEqual(normalOffset.toArray());
    expect(new THREE.Box3().setFromObject(water.root).min.x).toBeCloseTo(bounds.min.x);
    expect(new THREE.Box3().setFromObject(water.root).max.z).toBeCloseTo(bounds.max.z);
    water.dispose();
  });
  it('uses distinct blue facets on near floodwater while keeping the far surface smooth', () => {
    const near = createSurfaceHazardArt('water', 3.2, 7, 'near');
    const far = createSurfaceHazardArt('water', 3.2, 7, 'far');
    const colors = (art: typeof near) => (art.root.getObjectByName('deep_water') as THREE.Mesh)
      .geometry.getAttribute('color');
    const nearColor = colors(near), farColor = colors(far);
    const sample = (attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, i: number) =>
      [attribute.getX(i), attribute.getY(i), attribute.getZ(i)];
    expect(sample(nearColor, 0)).toEqual(sample(nearColor, 1));
    expect(sample(nearColor, 0)).toEqual(sample(nearColor, 2));
    expect(sample(nearColor, 0)).not.toEqual(sample(nearColor, 3));
    expect(sample(farColor, 0)).not.toEqual(sample(farColor, 1));
    near.dispose(); far.dispose();
  });
  it('keeps floodwater broad and almost flat while the pothole stays recessed', () => {
    const water = createSurfaceHazardArt('water', 3.2, 7);
    const hole = createSurfaceHazardArt('pothole', 2.3, 4);
    const waterFloor = water.root.getObjectByName('deep_water')!;
    const waterRim = water.root.getObjectByName('sloped_basin_normals')!;
    const holeRim = hole.root.getObjectByName('sloped_basin_normals')!;
    const floorWidth = new THREE.Box3().setFromObject(waterFloor).getSize(new THREE.Vector3()).x;
    expect(floorWidth).toBeGreaterThan(3.2 * .85);
    const rimHeight = (object: THREE.Object3D) =>
      new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3()).y;
    expect(rimHeight(waterRim)).toBeLessThan(.015);
    expect(rimHeight(holeRim)).toBeGreaterThan(.05);
    const wallColor = (holeRim as THREE.Mesh).geometry.getAttribute('color');
    expect(wallColor).toBeDefined();
    expect(wallColor.getX(0) - wallColor.getX(1)).toBeGreaterThan(.10);
    water.dispose(); hole.dispose();
  });
  it('covers lane dashes beneath a pothole spanning three lanes', () => {
    const road = createRoadTileArt();
    const hole = createSurfaceHazardArt('pothole', 9.6, 6);
    const dash = road.root.getObjectByName('lane_dash_1')!;
    const patch = hole.root.getObjectByName('readable_footprint')!;
    const floor = hole.root.getObjectByName('pothole_depth')!;
    const dashTop = new THREE.Box3().setFromObject(dash).max.y;
    const patchHeight = new THREE.Box3().setFromObject(patch).min.y;
    const floorHeight = new THREE.Box3().setFromObject(floor).min.y;
    expect(patchHeight).toBeGreaterThan(dashTop);
    expect(floorHeight).toBeGreaterThan(patchHeight);
    hole.dispose(); road.dispose();
  });
  it('keeps animated floodwater and its opaque footprint above lane paint at both LODs', () => {
    const road = createRoadTileArt();
    const dashTop = new THREE.Box3().setFromObject(road.root.getObjectByName('lane_dash_1')!).max.y;
    for (const lod of ['near', 'far'] as const) {
      const water = createSurfaceHazardArt('water', 9.6, 25, lod);
      const footprint = water.root.getObjectByName('readable_footprint')!;
      expect(new THREE.Box3().setFromObject(footprint).min.y).toBeGreaterThan(dashTop);
      const floor = water.root.getObjectByName('deep_water') as THREE.Mesh;
      for (const seconds of [0, 1, 7, 19, 120]) {
        water.setVisualTime?.(seconds);
        // Recompute bounds because the animated buffer changes in place.
        floor.geometry.computeBoundingBox();
        expect(floor.geometry.boundingBox!.min.y).toBeGreaterThan(dashTop);
      }
      water.dispose();
    }
    road.dispose();
  });
  it('uses soft square outlines and a subdivided water surface within the collider footprint', () => {
    for (const kind of ['water', 'pothole'] as const) {
      const art = createSurfaceHazardArt(kind, 3.2, 7);
      const patch = art.root.getObjectByName('readable_footprint') as THREE.Mesh;
      const position = patch.geometry.getAttribute('position');
      let diagonalX = 0;
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i), z = position.getZ(i);
        if (x > 0 && z > 0 && Math.abs(x / 1.6 - z / 3.5) < .06)
          diagonalX = Math.max(diagonalX, x / 1.6);
      }
      expect(diagonalX).toBeGreaterThan(.78);
      if (kind === 'water') {
        const floor = art.root.getObjectByName('deep_water') as THREE.Mesh;
        const triangleCount = floor.geometry.getAttribute('position').count / 3;
        expect(triangleCount).toBeGreaterThanOrEqual(100);
        expect(triangleCount).toBeLessThanOrEqual(200);
      }
      art.dispose();
    }
  });
  it('rejects invalid world footprints', () => {
    expect(() => createSurfaceHazardArt('water', 0, 2)).toThrow();
    expect(() => createSurfaceHazardArt('pothole', 2, Number.NaN)).toThrow();
  });
  it('adds short near pothole cracks without expanding its world footprint', () => {
    const near = createSurfaceHazardArt('pothole', 2.3, 4, 'near');
    const far = createSurfaceHazardArt('pothole', 2.3, 4, 'far');
    expect(near.root.getObjectByName('fractured_asphalt_cracks')).toBeInstanceOf(THREE.LineSegments);
    expect(far.root.getObjectByName('fractured_asphalt_cracks')).toBeUndefined();
    const size = new THREE.Box3().setFromObject(near.root).getSize(new THREE.Vector3());
    expect(size.x).toBeLessThanOrEqual(2.32);
    expect(size.z).toBeLessThanOrEqual(4.02);
    near.dispose(); far.dispose();
  });
});
