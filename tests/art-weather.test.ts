import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRainArt } from '../src/art/weather';

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
});
