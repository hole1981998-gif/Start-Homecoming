import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRainArt, createRainSplashArt } from '../src/art/weather';

describe('decorative rain art', () => {
  it('holds each impact on the road as the player moves and only reanchors on a new lifetime', () => {
    const rain = createRainSplashArt(7, 24);
    const rings = rain.root.children[0] as THREE.InstancedMesh;
    const matrix = new THREE.Matrix4();
    rain.update(2, 0, 0, (x, z) => ({ x: 100 + x, z: -200 + z }));
    rings.getMatrixAt(0, matrix); const first = new THREE.Vector3().setFromMatrixPosition(matrix);
    rain.update(2, 20, -50, (x, z) => ({ x: 300 + x, z: -400 + z }));
    rings.getMatrixAt(0, matrix);
    expect(new THREE.Vector3().setFromMatrixPosition(matrix).toArray()).toEqual(first.toArray());
    rain.update(2.001, 20, -50, (x, z) => ({ x: 300 + x, z: -400 + z }));
    rings.getMatrixAt(0, matrix);
    expect(new THREE.Vector3().setFromMatrixPosition(matrix).toArray()).toEqual(first.toArray());
    rain.update(5, 20, -50, (x, z) => ({ x: 300 + x, z: -400 + z }));
    rings.getMatrixAt(0, matrix); expect(matrix.elements[12]).toBeGreaterThan(295);
    rain.update(0, 2, 3); rings.getMatrixAt(0, matrix);
    expect(matrix.elements[12]).toBeGreaterThan(-2.5); expect(matrix.elements[12]).toBeLessThan(6.5);
    expect(rings.count).toBeLessThanOrEqual(24); rain.dispose();
  });
  it('replays from elapsed time and seed without moving the caller root', () => {
    const rain = createRainArt(42, 60);
    const lines = rain.root.getObjectByName('seeded_rain_streaks') as THREE.LineSegments;
    const positions = lines.geometry.getAttribute('position') as THREE.BufferAttribute;
    rain.update(2.5, 1, 20);
    const first = Array.from(positions.array);
    rain.update(4.25, 1, 20);
    expect(Array.from(positions.array)).not.toEqual(first);
    rain.update(2.5, 1, 20);
    expect(Array.from(positions.array)).toEqual(first);
    expect(rain.root.position.toArray()).toEqual([0, 0, 0]);
    expect(rain.root.userData.collisionRole).toBe('none');
    rain.setIntensity(0);
    expect(lines.visible).toBe(false);
    rain.dispose();
  });
  it('replays road ripples deterministically within the road without adding collisions', () => {
    const splashes = createRainSplashArt(42, 24);
    const rings = splashes.root.getObjectByName('seeded_rain_ripples') as THREE.InstancedMesh;
    const matrix = new THREE.Matrix4(), first: number[][] = [];
    splashes.update(2.5, 1, 20);
    for (let i = 0; i < rings.count; i++) {
      rings.getMatrixAt(i, matrix);
      first.push(matrix.toArray());
      expect(matrix.elements[12]).toBeGreaterThan(-3.5);
      expect(matrix.elements[12]).toBeLessThan(5.5);
    }
    splashes.update(4.25, 1, 20);
    splashes.update(2.5, 1, 20);
    for (let i = 0; i < rings.count; i++) {
      rings.getMatrixAt(i, matrix);
      expect(matrix.toArray()).toEqual(first[i]);
    }
    expect(splashes.root.userData.collisionRole).toBe('none');
    splashes.setIntensity(0);
    expect(rings.visible).toBe(false);
    splashes.dispose();
  });
});
