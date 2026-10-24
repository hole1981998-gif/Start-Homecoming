import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRainArt, createRainSplashArt } from '../src/art/weather';

describe('decorative rain art', () => {
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
