import { expect, it } from 'vitest';
import * as THREE from 'three';
import { colorPlayerHelmet, playerHelmetColor } from '../src/art/player-appearance';

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
