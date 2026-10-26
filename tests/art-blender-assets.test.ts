import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { balance } from '../src/config';
import { createSceneryCluster, mountBlenderCityMarket, mountBlenderCityMidrise, mountBlenderCityShop, mountBlenderCitySkyline, mountBlenderCoastalBoat, optimizeNearScenery } from '../src/art/scenery';
import { gradeStormCityBuilding, shadePlacedStormCityFacades } from '../src/art/storm-lighting';

async function boundsOf(file: string) {
  const bytes = readFileSync(new URL(`../assets/art/${file}`, import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  return new THREE.Box3().setFromObject(gltf.scene);
}

function exportCounts(file: string) {
  const bytes = readFileSync(new URL(`../assets/art/${file}`, import.meta.url));
  const jsonLength = bytes.readUInt32LE(12);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString()) as {
    scenes?: unknown[]; meshes?: unknown[]; materials?: unknown[];
  };
  return { scenes: gltf.scenes?.length, meshes: gltf.meshes?.length, materials: gltf.materials?.length };
}

describe('editable Blender roadside exports', () => {
  it('keeps placed GLB facade shading through near-scene batching without tinting shop accents', async () => {
    const bytes = readFileSync(new URL('../assets/art/roadside-midrise.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    gradeStormCityBuilding(template);
    const art = createSceneryCluster('city', 1, 'near', 17);
    expect(mountBlenderCityMidrise(art, template, 1)).toBe(true);
    art.root.rotation.y = Math.PI;
    expect(shadePlacedStormCityFacades(art.root)).toBeGreaterThan(0);
    optimizeNearScenery(art.root);
    let shaded = 0;
    let shopAccent = 0;
    art.root.traverse(object => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
      if (object.material.vertexColors) {
        expect(object.geometry.getAttribute('color')).toBeDefined();
        shaded++;
      }
      if (/shop amber/i.test(object.material.name)) {
        expect(object.material.vertexColors).toBe(false);
        expect(object.geometry.getAttribute('color')).toBeUndefined();
        shopAccent++;
      }
    });
    expect(shaded).toBeGreaterThan(0);
    expect(shopAccent).toBeGreaterThan(0);
    art.dispose();
    template.traverse(object => {
      if (object instanceof THREE.Mesh) {
        expect(object.geometry.getAttribute('color')).toBeUndefined();
        expect((object.material as THREE.MeshStandardMaterial).vertexColors).toBe(false);
      }
    });
  });
  it('places the cached midrise on seeded city lots without crossing the road', async () => {
    const bytes = readFileSync(new URL('../assets/art/roadside-midrise.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    const sourceMesh = template.getObjectByProperty('type', 'Mesh') as THREE.Mesh;
    for (const seed of [0, 1, 2, 17]) for (const side of [-1, 1] as const) {
      const art = createSceneryCluster('city', side, 'near', seed);
      expect(mountBlenderCityMidrise(art, template, side)).toBe(true);
      const imported = art.root.getObjectByName('blender_midrise')!;
      expect(art.root.getObjectByName('midrise_apartments')).toBeUndefined();
      const bounds = new THREE.Box3().setFromObject(imported);
      const edge = balance.laneWidth * balance.laneCount / 2;
      if (side > 0) expect(bounds.min.x).toBeGreaterThan(edge);
      else expect(bounds.max.x).toBeLessThan(-edge);
      const copyMesh = imported.getObjectByProperty('type', 'Mesh') as THREE.Mesh;
      expect(copyMesh.geometry).not.toBe(sourceMesh.geometry);
      optimizeNearScenery(art.root);
      expect(new THREE.Box3().setFromObject(art.root).isEmpty()).toBe(false);
      art.dispose();
    }
  });
  it('keeps the tall Blender skyline behind both sides of the road', async () => {
    const bytes = readFileSync(new URL('../assets/art/skyline-shophouse.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    for (const seed of [0, 2, 17]) for (const side of [-1, 1] as const) {
      const art = createSceneryCluster('city', side, 'near', seed);
      expect(mountBlenderCitySkyline(art, template, side)).toBe(true);
      const skyline = art.root.getObjectByName('blender_skyline')!;
      const bounds = new THREE.Box3().setFromObject(skyline);
      expect(bounds.max.y).toBeGreaterThan(19);
      const edge = balance.laneWidth * balance.laneCount / 2;
      if (side > 0) expect(bounds.min.x).toBeGreaterThan(edge);
      else expect(bounds.max.x).toBeLessThan(-edge);
      art.dispose();
    }
  });
  it('places the Blender roadside shop outside the lane edge in seeded districts', async () => {
    const bytes = readFileSync(new URL('../assets/art/roadside-shop.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    for (const seed of [0, 3, 17]) for (const side of [-1, 1] as const) {
      const art = createSceneryCluster('city', side, 'near', seed);
      expect(mountBlenderCityShop(art, template, side)).toBe(true);
      const shop = art.root.getObjectByName('blender_shop')!;
      const bounds = new THREE.Box3().setFromObject(shop);
      const edge = balance.laneWidth * balance.laneCount / 2;
      if (side > 0) expect(bounds.min.x).toBeGreaterThan(edge);
      else expect(bounds.max.x).toBeLessThan(-edge);
      expect(art.root.getObjectByName('corner_shop')).toBeUndefined();
      art.dispose();
    }
  });
  it('replaces the wide storefront with the market outside both road edges', async () => {
    const bytes = readFileSync(new URL('../assets/art/corner-market.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    for (const seed of [0, 1, 2, 17]) for (const side of [-1, 1] as const) {
      const art = createSceneryCluster('city', side, 'near', seed);
      expect(mountBlenderCityMarket(art, template, side)).toBe(true);
      expect(art.root.getObjectByName('wide_storefront')).toBeUndefined();
      const market = art.root.getObjectByName('blender_market')!;
      const bounds = new THREE.Box3().setFromObject(market);
      const edge = balance.laneWidth * balance.laneCount / 2;
      if (side > 0) expect(bounds.min.x).toBeGreaterThan(edge);
      else expect(bounds.max.x).toBeLessThan(-edge);
      expect(bounds.getSize(new THREE.Vector3()).z).toBeGreaterThan(9.4);
      for (const name of ['narrow_two_storey', 'midrise_apartments', 'porch_house',
        'corner_shop']) {
        const neighbour = art.root.getObjectByName(name);
        if (neighbour) expect(bounds.intersectsBox(new THREE.Box3().setFromObject(neighbour))).toBe(false);
      }
      optimizeNearScenery(art.root);
      art.dispose();
    }
  });
  it('keeps the three GLBs upright at their intended roadside scale', async () => {
    const shop = (await boundsOf('roadside-shop.glb')).getSize(new THREE.Vector3());
    const midrise = (await boundsOf('roadside-midrise.glb')).getSize(new THREE.Vector3());
    const market = (await boundsOf('corner-market.glb')).getSize(new THREE.Vector3());
    expect(shop.y).toBeGreaterThan(shop.x);
    expect(shop.y).toBeGreaterThan(shop.z);
    expect(shop.x).toBeLessThan(5.5);
    expect(midrise.y).toBeGreaterThan(12);
    expect(midrise.y).toBeLessThan(13.5);
    expect(midrise.x).toBeLessThan(7);
    expect(midrise.z).toBeLessThan(7);
    expect(market.x).toBeGreaterThan(9.4);
    expect(market.x).toBeLessThan(9.6);
    expect(market.y).toBeGreaterThan(7.9);
    expect(market.y).toBeLessThan(8.2);
    expect(market.z).toBeLessThan(8);
  });
  it('keeps the coastal skiff at roadside scale after batching its materials', async () => {
    const bounds = await boundsOf('coastal-fishing-boat.glb');
    const size = bounds.getSize(new THREE.Vector3());
    expect(size.x).toBeGreaterThan(1.8);
    expect(size.x).toBeLessThan(2.1);
    expect(size.y).toBeGreaterThan(1.4);
    expect(size.y).toBeLessThan(1.6);
    expect(size.z).toBeGreaterThan(3.7);
    expect(size.z).toBeLessThan(3.9);
    expect(bounds.min.y).toBeGreaterThanOrEqual(0);
  });
  it('mounts the cached skiff in the sea outside road and pier, only at near LOD', async () => {
    const bytes = readFileSync(new URL('../assets/art/coastal-fishing-boat.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    for (const side of [-1, 1] as const) for (const seed of [0, 17]) {
      const art = createSceneryCluster('sea', side, 'near', seed);
      expect(mountBlenderCoastalBoat(art, template, side)).toBe(true);
      const boat = art.root.getObjectByName('blender_coastal_boat')!;
      const pier = art.root.getObjectByName('harbor_jetty')!;
      const boatBounds = new THREE.Box3().setFromObject(boat);
      const roadEdge = balance.laneWidth * balance.laneCount / 2;
      if (side > 0) expect(boatBounds.min.x).toBeGreaterThan(roadEdge);
      else expect(boatBounds.max.x).toBeLessThan(-roadEdge);
      expect(boatBounds.intersectsBox(new THREE.Box3().setFromObject(pier))).toBe(false);
      for (const name of ['seawall', 'seawall_cap'])
        expect(boatBounds.intersectsBox(new THREE.Box3().setFromObject(
          art.root.getObjectByName(name)!))).toBe(false);
      optimizeNearScenery(art.root);
      art.dispose();
    }
    const far = createSceneryCluster('sea', 1, 'far', 0);
    expect(mountBlenderCoastalBoat(far, template, 1)).toBe(false);
    far.dispose();
    const city = createSceneryCluster('city', 1, 'near', 0);
    expect(mountBlenderCoastalBoat(city, template, 1)).toBe(false);
    city.dispose();
  });
  it('exports only each building scene after batching material groups', async () => {
    for (const file of ['corner-market.glb', 'roadside-midrise.glb', 'skyline-shophouse.glb']) {
      const counts = exportCounts(file);
      expect(counts.scenes).toBe(1);
      expect(counts.meshes).toBeGreaterThan(0);
      expect(counts.meshes).toBeLessThanOrEqual(12);
      expect(counts.materials).toBeLessThanOrEqual(12);
    }
  });
  it('keeps the new five-level shophouse upright at city scale', async () => {
    const bounds = await boundsOf('skyline-shophouse.glb');
    const size = bounds.getSize(new THREE.Vector3());
    expect(size.x).toBeGreaterThan(6.4);
    expect(size.x).toBeLessThan(6.7);
    expect(size.y).toBeGreaterThan(19);
    expect(size.y).toBeLessThan(20);
    expect(size.z).toBeGreaterThan(7.7);
    expect(size.z).toBeLessThan(8);
    expect(bounds.min.y).toBeGreaterThanOrEqual(0);
  });
  it('exports every editable person with distinct named parts', async () => {
    for (const filename of ['people-edit-source.glb', 'people-proportions-pass.glb']) {
      const bytes = readFileSync(new URL(`../assets/art/${filename}`, import.meta.url));
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const gltf = await new GLTFLoader().parseAsync(buffer, '');
      const roots = gltf.scene.getObjectByName('homecoming_people_edit_source')!.children;
      expect(roots).toHaveLength(13);
      for (const root of roots) {
        expect(root.name).toMatch(/^chr_.+_root$/);
        const partNames: string[] = [];
        root.traverse(object => partNames.push(object.name));
        for (const part of ['head', 'coat_torso', 'hip_pivot'])
          expect(partNames.some(name => name === part || name.startsWith(`${part}_`))).toBe(true);
      }
    }
  });
});
