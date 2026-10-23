import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { balance } from '../src/config';
import { createJunctionArt, createRoadTileArt } from '../src/art/road-kit';

describe('road art follows existing route dimensions', () => {
  it('keeps a 4 m road tile at the three-lane simulation width', () => {
    const tile = createRoadTileArt();
    const asphalt = tile.root.getObjectByName('asphalt_4m') as THREE.Mesh<THREE.BoxGeometry>;
    expect(asphalt.geometry.parameters.width).toBe(balance.laneWidth * balance.laneCount);
    expect(asphalt.geometry.parameters.depth).toBe(4);
    expect(tile.root.getObjectByName('lane_dash_1')?.position.x).toBe(balance.laneWidth / 2);
    tile.setJunctionClearance(true);
    expect(tile.root.getObjectByName('markings')?.visible).toBe(false);
    tile.dispose();
  });
  it('matches the current finite cross street and optional blocked straight', () => {
    const junction = createJunctionArt(true);
    const cross = junction.root.getObjectByName('cross_street') as THREE.Mesh<THREE.BoxGeometry>;
    const old = junction.root.getObjectByName('old_straight') as THREE.Mesh<THREE.BoxGeometry>;
    expect(cross.geometry.parameters.width).toBe(90);
    expect(cross.geometry.parameters.depth).toBeCloseTo(balance.laneWidth * balance.laneCount);
    expect(old.geometry.parameters.depth).toBe(190);
    expect(junction.root.getObjectByName('blocked_straight_barrier')?.visible).toBe(true);
    junction.dispose();
  });
});
