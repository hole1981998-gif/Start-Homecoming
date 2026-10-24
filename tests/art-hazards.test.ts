import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { hazardSizes } from '../src/config';
import { createPropHazardArt, createSurfaceHazardArt, type PropHazardKind } from '../src/art/hazards';

describe('essential hazard art', () => {
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
      expect(Math.max(...red) - Math.min(...red)).toBeGreaterThan(.05);
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
  it('rejects invalid world footprints', () => {
    expect(() => createSurfaceHazardArt('water', 0, 2)).toThrow();
    expect(() => createSurfaceHazardArt('pothole', 2, Number.NaN)).toThrow();
  });
});
