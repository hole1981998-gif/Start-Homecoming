import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createWindStreakArt } from '../src/art/wind-streaks';

describe('wind gust visual', () => {
  it('retains directional motion at reduced density and freezes only at equal active time', () => {
    const art = createWindStreakArt(9.6, 65);
    const mesh = art.root.children[0] as THREE.InstancedMesh;
    art.setVisualTime(1, 1, true);
    const first = Array.from(mesh.instanceMatrix.array);
    art.setVisualTime(1, 1, true); expect(Array.from(mesh.instanceMatrix.array)).toEqual(first);
    art.setVisualTime(1.2, 1, true); expect(Array.from(mesh.instanceMatrix.array)).not.toEqual(first);
    expect(mesh.count).toBeLessThan(30); art.dispose();
  });
  it('uses sparse translucent streaks instead of a road-sized color plane', () => {
    const art = createWindStreakArt(9.6, 65);
    const streaks = art.root.getObjectByName('wind_gust_ribbons') as THREE.InstancedMesh;
    expect(art.root.children).toHaveLength(1);
    expect(streaks.count).toBeGreaterThanOrEqual(24);
    expect(streaks.count).toBeLessThanOrEqual(32);
    expect((streaks.material as THREE.MeshBasicMaterial).transparent).toBe(true);
    expect((streaks.material as THREE.MeshBasicMaterial).opacity).toBeLessThan(.5);
    const size = new THREE.Box3().setFromBufferAttribute(
      streaks.geometry.getAttribute('position') as THREE.BufferAttribute).getSize(new THREE.Vector3());
    expect(size.x).toBeLessThan(.35);
    expect(size.z).toBeLessThan(4);
    art.dispose();
  });

  it('follows simulation time and reverses flow with lateral force', () => {
    const art = createWindStreakArt(9.6, 65);
    const streaks = art.root.getObjectByName('wind_gust_ribbons') as THREE.InstancedMesh;
    const sample = () => {
      const matrix = new THREE.Matrix4();
      streaks.getMatrixAt(0, matrix);
      return matrix.clone();
    };
    art.setVisualTime(1.2, 1);
    const right = sample();
    art.setVisualTime(1.2, 1);
    expect(sample().equals(right)).toBe(true);
    art.setVisualTime(1.3, 1);
    expect(sample().equals(right)).toBe(false);
    art.setVisualTime(1.2, -1);
    const left = sample();
    expect(new THREE.Vector3().setFromMatrixPosition(left).x)
      .toBeCloseTo(-new THREE.Vector3().setFromMatrixPosition(right).x);
    expect(left.equals(right)).toBe(false);
    art.dispose();
  });
});
