import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { balance } from '../src/config';
import { landscapeColors, type LandscapeKind } from '../src/landscape';
import { createSceneryCluster, optimizeNearScenery } from '../src/art/scenery';

describe('essential roadside scenery', () => {
  it('covers every existing 96 m landscape family and stays out of the driving corridor', () => {
    for (const kind of Object.keys(landscapeColors) as LandscapeKind[]) {
      for (const side of [-1, 1] as const) for (const lod of ['near', 'far'] as const) {
        const art = createSceneryCluster(kind, side, lod);
        const bounds = new THREE.Box3().setFromObject(art.root);
        const roadHalfWidth = balance.laneWidth * balance.laneCount / 2;
        if (side < 0) expect(bounds.max.x).toBeLessThan(-roadHalfWidth);
        else expect(bounds.min.x).toBeGreaterThan(roadHalfWidth);
        expect(art.root.userData.collisionRole).toBe('decorative-only');
        expect(art.root.userData.regionLengthM).toBe(96);
        art.dispose();
      }
    }
  });
  it('gives the city roof, awning and balcony shapes beyond ordinary box facades', () => {
    const art = createSceneryCluster('city', 1);
    expect(art.root.getObjectByName('pitched_sheet_roof')).toBeDefined();
    expect(art.root.getObjectByName('corner_shop')?.getObjectByName('shop_roof_terrace')).toBeDefined();
    expect(art.root.getObjectByName('front_awning')).toBeDefined();
    expect(art.root.getObjectByName('balcony_rail')).toBeDefined();
    expect(art.root.getObjectByName('courtyard_shed_pitched_roof')).toBeDefined();
    art.dispose();
  });
  it('keeps seeded city variations deterministic and safely roadside', () => {
    const roadHalfWidth = balance.laneWidth * balance.laneCount / 2;
    const positions: number[] = [];
    for (const seed of [0, 0, 1, 2]) {
      const art = createSceneryCluster('city', -1, 'near', seed);
      const bounds = new THREE.Box3().setFromObject(art.root);
      expect(bounds.max.x).toBeLessThan(-roadHalfWidth);
      for (const name of ['midrise_apartments', 'wide_storefront', 'pocket_park'])
        expect(art.root.getObjectByName(name)).toBeDefined();
      positions.push(art.root.getObjectByName('midrise_apartments')!.position.z);
      art.dispose();
    }
    expect(positions[0]).toBe(positions[1]);
    expect(Math.abs(positions[0] - positions[2])).toBeGreaterThan(5);
  });
  it('keeps distant city detail while reducing individual drawables', () => {
    const near = createSceneryCluster('city', 1, 'near', 0);
    const far = createSceneryCluster('city', 1, 'far', 0);
    let nearMeshes = 0, farMeshes = 0;
    near.root.traverse(object => { if (object instanceof THREE.Mesh) nearMeshes++; });
    far.root.traverse(object => { if (object instanceof THREE.Mesh) farMeshes++; });
    expect(farMeshes).toBeLessThan(nearMeshes / 3);
    expect(new THREE.Box3().setFromObject(far.root).min.x)
      .toBeGreaterThan(balance.laneWidth * balance.laneCount / 2);
    near.dispose(); far.dispose();
  });
  it('batches near static detail while preserving building placement and bounds', () => {
    const art = createSceneryCluster('city', 1, 'near', 2);
    const before = new THREE.Box3().setFromObject(art.root, true);
    const countMeshes = () => {
      let count = 0;
      art.root.traverse(object => { if (object instanceof THREE.Mesh) count++; });
      return count;
    };
    const countBefore = countMeshes();
    const shop = art.root.getObjectByName('corner_shop')!;
    const shopPosition = shop.position.clone();
    optimizeNearScenery(art.root);
    const countAfter = countMeshes();
    expect(countAfter).toBeLessThan(countBefore * .7);
    expect(art.root.getObjectByName('corner_shop')).toBe(shop);
    expect(shop.position).toEqual(shopPosition);
    const after = new THREE.Box3().setFromObject(art.root, true);
    expect(after.min.distanceTo(before.min)).toBeLessThan(.001);
    expect(after.max.distanceTo(before.max)).toBeLessThan(.001);
    optimizeNearScenery(art.root);
    expect(countMeshes()).toBe(countAfter);
    art.dispose();
  });
  it('varies city frontage depth by seed without crossing the road', () => {
    const names = ['narrow_two_storey', 'midrise_apartments', 'porch_house',
      'wide_storefront', 'corner_shop'];
    for (const seed of [0, 1, 2]) {
      const art = createSceneryCluster('city', 1, 'near', seed);
      const frontages = names.map(name => art.root.getObjectByName(name)!.position.x);
      expect(Math.max(...frontages) - Math.min(...frontages)).toBeGreaterThan(.55);
      expect(new THREE.Box3().setFromObject(art.root).min.x)
        .toBeGreaterThan(balance.laneWidth * balance.laneCount / 2);
      art.dispose();
    }
  });
  it('keeps backlot facades detailed from the rear at both LODs', () => {
    for (const lod of ['near', 'far'] as const) {
      const art = createSceneryCluster('city', -1, lod, 2);
      const rear = art.root.getObjectByName('backlot_rear_windows') as THREE.InstancedMesh;
      expect(rear).toBeInstanceOf(THREE.InstancedMesh);
      expect(rear.count).toBeGreaterThanOrEqual(4);
      if (lod === 'near')
        expect(art.root.getObjectByName('backlot_rear_service_door')).toBeDefined();
      art.dispose();
    }
  });
  it('keeps seeded vegetation stable and reduces distant rice and verge detail', () => {
    const treeA = createSceneryCluster('trees', 1, 'near', 4);
    const treeB = createSceneryCluster('trees', 1, 'near', 4);
    const treeC = createSceneryCluster('trees', 1, 'near', 5);
    const instance = (art: ReturnType<typeof createSceneryCluster>, name: string) =>
      art.root.getObjectByName(name) as THREE.InstancedMesh;
    const matrix = new THREE.Matrix4();
    const first = (art: ReturnType<typeof createSceneryCluster>) => {
      instance(art, 'seeded_verge_grass').getMatrixAt(0, matrix);
      return matrix.toArray();
    };
    expect(first(treeA)).toEqual(first(treeB));
    expect(first(treeA)).not.toEqual(first(treeC));
    const treeFar = createSceneryCluster('trees', 1, 'far', 4);
    expect(instance(treeFar, 'seeded_verge_grass').count)
      .toBeLessThan(instance(treeA, 'seeded_verge_grass').count);
    const riceNear = createSceneryCluster('rice', 1, 'near');
    const riceFar = createSceneryCluster('rice', 1, 'far');
    expect(instance(riceFar, 'rice_tufts').count).toBeLessThan(instance(riceNear, 'rice_tufts').count);
    for (const art of [treeA, treeB, treeC, treeFar, riceNear, riceFar]) art.dispose();
  });
  it('keeps the near harbor jetty on the water side of the road', () => {
    const roadHalfWidth = balance.laneWidth * balance.laneCount / 2;
    for (const side of [-1, 1] as const) {
      const art = createSceneryCluster('sea', side, 'near');
      const jetty = art.root.getObjectByName('harbor_jetty')!;
      expect(jetty).toBeDefined();
      const bounds = new THREE.Box3().setFromObject(jetty);
      if (side < 0) expect(bounds.max.x).toBeLessThan(-roadHalfWidth);
      else expect(bounds.min.x).toBeGreaterThan(roadHalfWidth);
      art.dispose();
    }
  });
  it('animates sea and rice surfaces without shifting the roadside bounds', () => {
    for (const kind of ['sea', 'rice'] as const) {
      const art = createSceneryCluster(kind, 1, 'near', 2);
      const surface = art.root.getObjectByName(kind === 'sea' ? 'water_plane' : 'paddy_water_0') as THREE.Mesh;
      const position = surface.geometry.getAttribute('position');
      expect(position.count).toBeGreaterThan(200);
      const before = Array.from(position.array);
      const bounds = new THREE.Box3().setFromObject(art.root);
      art.setVisualTime?.(2.5);
      const animated = Array.from(position.array);
      expect(animated).not.toEqual(before);
      art.setVisualTime?.(5);
      art.setVisualTime?.(2.5);
      expect(Array.from(position.array)).toEqual(animated);
      const afterBounds = new THREE.Box3().setFromObject(art.root);
      expect(afterBounds.min.x).toBeCloseTo(bounds.min.x);
      expect(afterBounds.max.x).toBeCloseTo(bounds.max.x);
      art.dispose();
    }
  });
});
