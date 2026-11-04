import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRoadContactShadows } from '../src/art/road-contact-shadows';
import { createRoadTileArt } from '../src/art/road-kit';
import { createCloudShadowArt } from '../src/art/cloud-shadows';
import { createRoadShadowArt } from '../src/art/road-shadows';
import { initialRoute } from '../src/route';

describe('road contact shadows', () => {
  it('puts soft contact, cloud and decorative shade above raised lane paint so paint receives shade', () => {
    const road = createRoadTileArt();
    const paint = road.root.getObjectByName('lane_dash_1')!;
    const top = new THREE.Box3().setFromObject(paint).max.y;
    const contacts = createRoadContactShadows(), contact = contacts.create();
    contacts.place(contact, 0, 0, 0, 2, 4);
    const clouds = createCloudShadowArt(); clouds.update(7, 0, initialRoute());
    const band = createRoadShadowArt(13, 14, 5);
    for (const object of [contact, ...clouds.root.children, band.root])
      expect(new THREE.Box3().setFromObject(object).min.y).toBeGreaterThan(top);
    expect((contact.material as THREE.MeshBasicMaterial).depthWrite).toBe(false);
    contacts.dispose(); clouds.dispose(); band.dispose(); road.dispose();
  });
  it('shares a feathered mask and stays on the road when its owner moves or jumps', () => {
    const shadows = createRoadContactShadows();
    const scene = new THREE.Scene();
    const bike = shadows.create(), traffic = shadows.create();
    scene.add(bike, traffic);
    expect(bike.geometry).toBe(traffic.geometry);
    expect(bike.material).toBe(traffic.material);
    const material = bike.material as THREE.MeshBasicMaterial;
    const pixels = material.alphaMap!.image.data as Uint8Array;
    const size = material.alphaMap!.image.width as number;
    const greenAt = (x: number, y: number) => pixels[(y * size + x) * 4 + 1];
    expect(greenAt(size / 2, size / 2)).toBeGreaterThan(greenAt(0, 0));
    shadows.place(bike, 3, 12, .4, 1.2, 2.5);
    expect(bike.position.x).toBe(3);
    expect(bike.position.z).toBe(12);
    expect(bike.position.y).toBeLessThan(.05);
    expect(bike.rotation.y).toBeCloseTo(.4);
    expect(bike.scale.x).toBeCloseTo(1.2);
    expect(bike.scale.y).toBeCloseTo(2.5);
    expect(bike.userData.collisionRole).toBe('decorative-only');
    shadows.dispose();
    expect(scene.children).toHaveLength(0);
  });
});
