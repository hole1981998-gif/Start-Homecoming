import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCloudShadowArt, cloudShadowPlacement } from '../src/art/cloud-shadows';
import { createSceneryCluster } from '../src/art/scenery';
import { landscapeColors } from '../src/landscape';
import { initialRoute, pathPose } from '../src/route';

describe('landscape ground and cloud shade', () => {
  it('keeps the visible rice soil and tree verge aligned with their regional ground color', () => {
    for (const [kind, name] of [['rice', 'field_soil_continuity'],
      ['trees', 'green_verge']] as const) {
      const art = createSceneryCluster(kind, 1);
      const ground = art.root.getObjectByName(name) as THREE.Mesh;
      const material = ground.material as THREE.MeshStandardMaterial;
      expect(material.color.getHexString()).toBe(new THREE.Color(landscapeColors[kind]).getHexString());
      // The regional band is at y=-.08; local ground must remain visible above it.
      expect(ground.position.y + (ground.geometry as THREE.BoxGeometry).parameters.height / 2)
        .toBeGreaterThan(-.08);
      art.dispose();
    }
    const rice = createSceneryCluster('rice', 1);
    const soil = rice.root.getObjectByName('field_soil_continuity') as THREE.Mesh;
    const water = rice.root.getObjectByName('paddy_water_0') as THREE.Mesh;
    expect(water.position.y).toBeGreaterThan(soil.position.y +
      (soil.geometry as THREE.BoxGeometry).parameters.height / 2);
    rice.dispose();
    const sea = createSceneryCluster('sea', 1);
    expect((sea.root.getObjectByName('water_plane') as THREE.Mesh).position.y)
      .toBeGreaterThan(-.08);
    sea.dispose();
  });

  it('places broad patches repeatably along either route, without scene colliders', () => {
    const art = createCloudShadowArt();
    const route = { ...initialRoute(), history: [{ distance: 800, turn: 'left' as const }] };
    art.update(17, 825, route);
    const patches = art.root.children as THREE.Mesh[];
    expect(patches).toHaveLength(5);
    const firstPositions = patches.map(patch => patch.position.clone());
    art.update(17, 825, route);
    patches.forEach((patch, i) => {
      expect(patch.position.equals(firstPositions[i])).toBe(true);
      expect(patch.scale.x).toBeGreaterThanOrEqual(27);
      expect(patch.scale.z).toBeGreaterThanOrEqual(25);
      expect(patch.userData.collider).toBeUndefined();
    });
    const firstCell = Math.floor((825 - 24) / 58);
    const placement = cloudShadowPlacement(17, firstCell);
    const pose = pathPose(placement.distance, route, 17);
    expect(patches[0].position.x).toBeCloseTo(pose.x + Math.cos(pose.heading) * placement.lateral);
    expect(patches[0].position.z).toBeCloseTo(pose.z + Math.sin(pose.heading) * placement.lateral);
    art.update(18, 825, route);
    expect(patches.some((patch, i) => !patch.position.equals(firstPositions[i]))).toBe(true);
    art.dispose();
  });

  it('feathers cloud edges so road markings remain readable', () => {
    const art = createCloudShadowArt();
    const material = (art.root.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
    const texture = material.alphaMap as THREE.DataTexture;
    const pixels = texture.image.data as Uint8Array;
    const green = (x: number, y: number) => pixels[(y * 96 + x) * 4 + 1];
    expect(green(48, 48)).toBeGreaterThan(200);
    expect(green(0, 0)).toBe(0);
    expect(green(3, 48)).toBeLessThan(green(32, 48));
    expect(material.opacity).toBeLessThan(.4);
    expect(material.depthWrite).toBe(false);
    art.dispose();
  });
});
