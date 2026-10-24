import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

async function boundsOf(file: string) {
  const bytes = readFileSync(new URL(`../assets/art/${file}`, import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  return new THREE.Box3().setFromObject(gltf.scene);
}

describe('editable Blender roadside exports', () => {
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
    const bytes = readFileSync(new URL('../assets/art/people-edit-source.glb', import.meta.url));
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
  });
});
