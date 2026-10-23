import { describe, expect, it } from 'vitest';
import { LANDSCAPE_REGION_METRES, landscapeAt, landscapeColors, landscapeWindow, roadsidePoint, roadsideRegions } from '../src/landscape';
import { initialRoute, pathPose } from '../src/route';

describe('seeded landscape placeholders', () => {
  it('rebuilds the same world regions after restart without consuming gameplay RNG', () => {
    const first = landscapeWindow(17, -12, -760);
    landscapeWindow(42, 500, 1200);
    expect(landscapeWindow(17, -12, -760)).toEqual(first);
    expect(landscapeWindow(18, -12, -760).some((tile, i) => tile.kind !== first[i].kind)).toBe(true);
    expect(new Set(first.map(tile => tile.kind)).size).toBeGreaterThan(2);
  });

  it('keeps overlapping world cells identical while the player turns at a junction', () => {
    const seed = 17;
    const approaching = pathPose(790, initialRoute(), seed);
    const turning = pathPose(900, { ...initialRoute(), choice: 'right' }, seed);
    const before = landscapeWindow(seed, approaching.x, approaching.z);
    const after = landscapeWindow(seed, turning.x, turning.z);
    const old = new Map(before.map(tile => [`${tile.cellX}:${tile.cellZ}`, tile]));
    const shared = after.filter(tile => old.has(`${tile.cellX}:${tile.cellZ}`));
    expect(shared.length).toBeGreaterThan(0);
    for (const tile of shared) expect(tile).toEqual(old.get(`${tile.cellX}:${tile.cellZ}`));
  });

  it('uses floor-based cells on both sides of the road and changes only at a boundary', () => {
    expect(landscapeAt(17, -.01, -30)).toBe(landscapeAt(17, -95, -30));
    expect(landscapeAt(17, .01, -30)).toBe(landscapeAt(17, 95, -30));
    const left = landscapeWindow(17, -1, -30);
    const right = landscapeWindow(17, 1, -30);
    expect(right.filter(tile => left.some(other => tile.cellX === other.cellX && tile.cellZ === other.cellZ))).toHaveLength(20);
  });

  it('can produce every planned placeholder region across a longer route', () => {
    const found = new Set<string>();
    for (let x = -8; x <= 8; x++) for (let z = -8; z <= 8; z++) {
      found.add(landscapeAt(17, x * LANDSCAPE_REGION_METRES, z * LANDSCAPE_REGION_METRES));
    }
    expect(found).toEqual(new Set(Object.keys(landscapeColors)));
  });

  it('sometimes matches and sometimes splits the two roadside regions without changing within a section', () => {
    const pairs = Array.from({ length: 30 }, (_, section) => roadsideRegions(17, section * LANDSCAPE_REGION_METRES + 1));
    expect(pairs.some(pair => pair.left === pair.right)).toBe(true);
    expect(pairs.some(pair => pair.left !== pair.right)).toBe(true);
    expect(pairs.some((pair, section) => JSON.stringify(pair) !== JSON.stringify(roadsideRegions(18, section * LANDSCAPE_REGION_METRES + 1)))).toBe(true);
    for (let section = 0; section < pairs.length; section++) {
      expect(roadsideRegions(17, section * LANDSCAPE_REGION_METRES + 95)).toEqual(pairs[section]);
    }
  });

  it('keeps the two colored shoulders on opposite sides of a turned centerline', () => {
    const route = { ...initialRoute(), choice: 'right' as const };
    for (const distance of [100, 796, 804, 900]) {
      const pose = pathPose(distance, route, 17);
      const left = roadsidePoint(pose, -1, 30);
      const right = roadsidePoint(pose, 1, 30);
      expect((left[0] + right[0]) / 2).toBeCloseTo(pose.x, 8);
      expect((left[1] + right[1]) / 2).toBeCloseTo(pose.z, 8);
      expect(Math.hypot(right[0] - left[0], right[1] - left[1])).toBeCloseTo(60, 8);
    }
  });
});
