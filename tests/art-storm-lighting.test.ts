import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { gameplayAccentLayer, gradeStormCityBuilding, markGameplayAccentTarget } from '../src/art/storm-lighting';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { createPersonArt } from '../src/art/people';
import { createPropHazardArt, createSurfaceHazardArt } from '../src/art/hazards';
import { createTrainArt, createAmbulanceArt, createOfficerArt, createVendorArt } from '../src/art/moving-events';
import { createAccidentArt } from '../src/art/special-hazards';

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
  it('quiets broad facades more than small warm shop accents', () => {
    const facade = new THREE.MeshStandardMaterial({ name: 'midrise ivory columns', color: '#d7ad91' });
    const accent = new THREE.MeshStandardMaterial({ name: 'midrise shop amber', color: '#d7ad91' });
    const root = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.BoxGeometry(), facade);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(), accent);
    root.add(wall, sign);
    gradeStormCityBuilding(root);
    const luminance = (mesh: THREE.Mesh) =>
      (mesh.material as THREE.MeshStandardMaterial).color.getHSL({ h: 0, s: 0, l: 0 }).l;
    expect(luminance(sign) - luminance(wall)).toBeGreaterThan(.06);
    expect(facade.color.equals(accent.color)).toBe(true);
    wall.geometry.dispose(); sign.geometry.dispose();
    facade.dispose(); accent.dispose();
    (wall.material as THREE.Material).dispose(); (sign.material as THREE.Material).dispose();
  });
  it('brings a sunlit cream GLB facade toward the storm palette without muting its shop interior', () => {
    const plaster = new THREE.MeshStandardMaterial({ name: 'sunlit cream plaster', color: '#f2cc91' });
    const interior = new THREE.MeshStandardMaterial({ name: 'warm shop interior', color: '#f2b85c' });
    const root = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.BoxGeometry(), plaster);
    const shop = new THREE.Mesh(new THREE.BoxGeometry(), interior);
    root.add(wall, shop);
    const before = plaster.color.clone();
    gradeStormCityBuilding(root);
    const gradedWall = (wall.material as THREE.MeshStandardMaterial).color;
    const gradedShop = (shop.material as THREE.MeshStandardMaterial).color;
    const brightness = (color: THREE.Color) => color.r * .2126 + color.g * .7152 + color.b * .0722;
    expect(brightness(gradedWall)).toBeLessThan(brightness(before) * .65);
    expect(brightness(gradedShop)).toBeGreaterThan(brightness(gradedWall));
    expect(plaster.color.equals(before)).toBe(true);
    wall.geometry.dispose(); shop.geometry.dispose(); plaster.dispose(); interior.dispose();
    (wall.material as THREE.Material).dispose(); (shop.material as THREE.Material).dispose();
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
  it('tags vehicles and road hazards while keeping verge passengers unlit', () => {
    const assets = [createVehicleArt('car4'), createVehicleArt('bus', 'traffic'),
      createSurfaceHazardArt('water', 3.2, 7), createSurfaceHazardArt('pothole', 2.3, 4),
      createPropHazardArt('barrier'), createPropHazardArt('fuel'),
      createTrainArt(), createAmbulanceArt(), createOfficerArt('police'),
      createVendorArt(), createAccidentArt()];
    for (const asset of assets) {
      let meshCount = 0;
      asset.root.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        meshCount++;
        expect(object.layers.isEnabled(0), asset.root.name).toBe(true);
        expect(object.layers.isEnabled(gameplayAccentLayer), asset.root.name).toBe(true);
      });
      expect(meshCount, asset.root.name).toBeGreaterThan(0);
      asset.dispose();
    }
    const waitingPassenger = createPersonArt('commuter');
    waitingPassenger.root.traverse(object => {
      if (object instanceof THREE.Mesh)
        expect(object.layers.isEnabled(gameplayAccentLayer)).toBe(false);
    });
    waitingPassenger.dispose();
    const scenery = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    expect(scenery.layers.isEnabled(gameplayAccentLayer)).toBe(false);
    scenery.geometry.dispose(); (scenery.material as THREE.Material).dispose();
  });
});
