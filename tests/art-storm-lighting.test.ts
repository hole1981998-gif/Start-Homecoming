import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { gameplayAccentLayer, gradeStormCityBuilding, markGameplayAccentTarget } from '../src/art/storm-lighting';

describe('storm city material handoff', () => {
  it('grades shared GLB materials once without changing the source material', () => {
    const original = new THREE.MeshStandardMaterial({ color: '#d7ad91', roughness: .4 });
    const before = original.color.clone();
    const root = new THREE.Group();
    const a = new THREE.Mesh(new THREE.BoxGeometry(), original);
    const b = new THREE.Mesh(new THREE.BoxGeometry(), original);
    root.add(a, b);

    gradeStormCityBuilding(root);
    const graded = a.material as THREE.MeshStandardMaterial;
    expect(graded).not.toBe(original);
    expect(b.material).toBe(graded);
    expect(graded.color.getHSL({ h: 0, s: 0, l: 0 }).l)
      .toBeLessThan(before.getHSL({ h: 0, s: 0, l: 0 }).l);
    expect(graded.roughness).toBeGreaterThanOrEqual(.78);
    expect(original.color.equals(before)).toBe(true);
    expect(original.roughness).toBe(.4);

    gradeStormCityBuilding(root);
    expect(a.material).toBe(graded);
    a.geometry.dispose(); b.geometry.dispose(); original.dispose(); graded.dispose();
  });
});

describe('gameplay accent selection', () => {
  it('lights road objects while keeping scenery on its original layer', () => {
    const player = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    player.add(body);
    const scenery = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    markGameplayAccentTarget(player);
    markGameplayAccentTarget(player);
    expect(body.layers.isEnabled(0)).toBe(true);
    expect(body.layers.isEnabled(gameplayAccentLayer)).toBe(true);
    expect(scenery.layers.isEnabled(gameplayAccentLayer)).toBe(false);
    body.geometry.dispose(); scenery.geometry.dispose();
    (body.material as THREE.Material).dispose(); (scenery.material as THREE.Material).dispose();
  });
});
