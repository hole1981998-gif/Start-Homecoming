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
});
