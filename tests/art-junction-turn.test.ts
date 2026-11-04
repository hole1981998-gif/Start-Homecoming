import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createJunctionTurnArt } from '../src/art/junction-turn';
import { initialRoute, junction, pathPose } from '../src/route';
import { balance } from '../src/config';

describe('junction turn road model', () => {
  it('joins the real route at both tile boundaries for straight, left and right', () => {
    const art = createJunctionTurnArt();
    const seed = 14, at = junction(seed, 0).distance;
    const before = pathPose(at - 8, initialRoute(), seed);
    for (const turn of [null, 'left', 'right'] as const) {
      art.setTurn(turn);
      const active = art.root.children.filter(child => child.name.startsWith('junction_apron_') && child.visible);
      expect(active).toHaveLength(1);
      const surface = art.root.getObjectByName(`turn_surface_${turn ?? 'straight'}`) as THREE.Mesh;
      const positions = surface.geometry.getAttribute('position');
      const route = { ...initialRoute(), choice: turn };
      for (const sample of [0, 4, 8, 12, 16]) {
        const metres = -8 + sample * 2;
        const pose = pathPose(at - 8 + metres, route, seed);
        const centerX = (positions.getX(sample * 2) + positions.getX(sample * 2 + 1)) / 2;
        const centerZ = (positions.getZ(sample * 2) + positions.getZ(sample * 2 + 1)) / 2;
        expect(centerX).toBeCloseTo(pose.x - before.x, 4);
        expect(centerZ).toBeCloseTo(pose.z - before.z, 4);
        const width = Math.hypot(positions.getX(sample * 2 + 1) - positions.getX(sample * 2),
          positions.getZ(sample * 2 + 1) - positions.getZ(sample * 2));
        expect(width).toBeCloseTo(balance.laneWidth * balance.laneCount, 4);
      }
      expect(surface.userData.collider).toBeUndefined();
    }
    const cross = art.root.getObjectByName('junction_cross_street') as THREE.Mesh<THREE.BoxGeometry>;
    expect(cross.geometry.parameters.width).toBe(90);
    expect(cross.geometry.parameters.depth).toBe(balance.laneWidth * balance.laneCount);
    art.dispose();
  });
});
