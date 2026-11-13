import { expect, it } from 'vitest';
import * as THREE from 'three';
import { colorPlayerHelmet, colorPlayerJacket, playerHelmetColor, playerJacketColor,
  playerPantsColor } from '../src/art/player-appearance';
import { createPersonArt } from '../src/art/people';

it('tints only the player helmet shell/brim without changing shared skin or NPC materials', () => {
  const root = new THREE.Group(), shared = new THREE.MeshStandardMaterial({ color: '#e5d9ba' });
  const parts = ['rain_helmet.003', 'helmet_brim.003', 'head', 'helmet_dark_band'].map(name => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(), shared); part.name = name; root.add(part); return part;
  });
  const original = shared.color.getHex(); colorPlayerHelmet(root);
  expect((parts[0].material as THREE.MeshStandardMaterial).color.getHexString()).toBe(playerHelmetColor.slice(1));
  expect(parts[0].material).toBe(parts[1].material); expect(parts[2].material).toBe(shared);
  expect(parts[3].material).toBe(shared); expect(shared.color.getHex()).toBe(original);
  const first = parts[0].material; colorPlayerHelmet(root); expect(parts[0].material).toBe(first);
  parts.forEach(part => part.geometry.dispose()); first.dispose(); shared.dispose();
});

it('colors only the player jacket body and sleeves without changing shared NPC clothing or skin', () => {
  const root = new THREE.Group(), shared = new THREE.MeshStandardMaterial({ color: '#4c98a4' });
  const names = ['coat_torso', 'soft_shoulder_-1', 'upper_arm_1', 'soft_elbow_1',
    'forearm_-1', 'head', 'hand_1'];
  const parts = names.map(name => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(), shared); part.name = name; root.add(part); return part;
  });
  const original = shared.color.getHex();
  colorPlayerJacket(root);
  for (const part of parts.slice(0, 5)) {
    expect((part.material as THREE.MeshStandardMaterial).color.getHexString()).toBe(playerJacketColor.slice(1));
    expect(part.material).toBe(parts[0].material);
  }
  expect(parts[5].material).toBe(shared);
  expect(parts[6].material).toBe(shared);
  expect(shared.color.getHex()).toBe(original);
  const first = parts[0].material;
  colorPlayerJacket(root);
  expect(parts[0].material).toBe(first);
  parts.forEach(part => part.geometry.dispose()); first.dispose(); shared.dispose();
});

it('keeps the player suit on the torso through poses without recoloring other people', () => {
  const driver = createPersonArt('driver');
  const commuter = createPersonArt('commuter');
  const originalCommuter = (commuter.root.getObjectByName('coat_torso') as THREE.Mesh)
    .material as THREE.MeshStandardMaterial;
  const commuterColor = originalCommuter.color.getHex();
  colorPlayerJacket(driver.root);
  const torso = driver.root.getObjectByName('torso_pivot')!;
  const coat = driver.root.getObjectByName('coat_torso') as THREE.Mesh;
  const pants = driver.root.getObjectByName('thigh_1') as THREE.Mesh;
  expect((coat.material as THREE.MeshStandardMaterial).color.getHexString()).toBe(playerJacketColor.slice(1));
  expect((pants.material as THREE.MeshStandardMaterial).color.getHexString()).toBe(playerPantsColor.slice(1));
  for (const name of ['suit_shirt_front', 'suit_lapel_-1', 'suit_lapel_1', 'suit_tie'])
    expect(torso.getObjectByName(name)?.parent).toBe(torso);
  driver.setPose('riding');
  driver.setPose('ejected', .5);
  expect(torso.getObjectByName('suit_tie')?.parent).toBe(torso);
  colorPlayerJacket(driver.root);
  expect(torso.children.filter(child => child.name === 'suit_tie')).toHaveLength(1);
  expect(originalCommuter.color.getHex()).toBe(commuterColor);
  driver.dispose(); commuter.dispose();
});
