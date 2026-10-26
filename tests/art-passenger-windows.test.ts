import { describe, expect, it } from 'vitest';
import { passengerWindowPoses } from '../src/art/passenger-windows';
import { vehicles } from '../src/vehicles';

describe('player passengers on 3D vehicle windows', () => {
  it('places one visible upper body per rider, without adding the driver', () => {
    for (const kind of ['car4', 'car7', 'bus', 'truck'] as const) {
      const riders = vehicles[kind].capacity - 1;
      const poses = passengerWindowPoses(kind, riders);
      expect(poses).toHaveLength(riders);
      expect(passengerWindowPoses(kind, 0)).toHaveLength(0);
      expect(poses.every(pose => Math.abs(pose.x) > 0 && pose.y > 1)).toBe(true);
    }
    expect(passengerWindowPoses('motorcycle', 1)).toHaveLength(0);
    expect(passengerWindowPoses('container', 1)).toEqual([{ x: 1.20, y: 2.19, z: 5.96 }]);
  });

  it('spreads a full bus roster along its side windows instead of stacking heads', () => {
    const poses = passengerWindowPoses('bus', 24);
    expect(new Set(poses.map(pose => pose.z)).size).toBe(12);
    expect(Math.max(...poses.map(pose => pose.z)) - Math.min(...poses.map(pose => pose.z)))
      .toBeGreaterThan(7);
    expect(poses.every(pose => Math.abs(pose.x) < vehicles.bus.width / 2 + .2)).toBe(true);
  });

  it('keeps truck riders at the cabin rather than along the cargo box', () => {
    expect(passengerWindowPoses('truck', 2).map(pose => pose.z)).toEqual([2.1, 2.1]);
    expect(passengerWindowPoses('truck', 12)).toHaveLength(2);
  });
});
