// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { discoveryCategory, readDiscoveries, saveDiscoveries } from '../src/discovery';

it('coalesces variants and migrates old read cards without creating supply popups', () => {
  localStorage.clear();
  localStorage.setItem('dvn.cards.v1', '["militia","cargo","fuel","unknown"]');
  const seen = readDiscoveries();
  expect(seen.has(discoveryCategory('police')!)).toBe(true);
  for (const kind of ['traffic','pothole','water','jam','accident','broken'] as const) expect(seen.has(discoveryCategory(kind)!)).toBe(true);
  expect(discoveryCategory('fuel')).toBeNull(); expect(discoveryCategory('repair')).toBeNull(); expect(discoveryCategory('shop')).toBeNull();
  expect(seen.has('wind')).toBe(false); expect(seen.has('train')).toBe(false);
});
it('persists each item introduction independently across reloads, ignoring invalid data', () => {
  localStorage.clear();
  const seen = readDiscoveries(); seen.add('nitro'); seen.add('banana'); saveDiscoveries(seen);
  expect([...readDiscoveries()]).toEqual(['nitro','banana']);
  expect(readDiscoveries().has('grab')).toBe(false);
  localStorage.setItem('dvn.discovery.v2', '["star",null,12,"unknown","__proto__"]');
  expect([...readDiscoveries()]).toEqual(['star']);
  localStorage.setItem('dvn.discovery.v2', '{bad'); expect([...readDiscoveries()]).toEqual([]);
});
