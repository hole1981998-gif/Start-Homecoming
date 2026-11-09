// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { discoveryCategory, readDiscoveries, saveDiscoveries } from '../src/discovery';

it('coalesces variants and migrates old read cards and keeps new shop/supply introductions explicit', () => {
  localStorage.clear();
  localStorage.setItem('dvn.cards.v1', '["militia","cargo","fuel","unknown"]');
  const seen = readDiscoveries();
  expect(seen.has(discoveryCategory('police')!)).toBe(true);
  for (const kind of ['traffic','pothole','water','jam','accident','broken'] as const) expect(seen.has(discoveryCategory(kind)!)).toBe(true);
  expect(discoveryCategory('fuel')).toBe('supplies'); expect(discoveryCategory('repair')).toBe('supplies'); expect(discoveryCategory('shop')).toBe('shop');
  expect(seen.has('supplies')).toBe(true);expect(seen.has('shop')).toBe(false);expect(discoveryCategory('score')).toBeNull();
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

it('keeps an explicit replay reset across reloads even when old legacy acknowledgements exist',()=>{
 localStorage.clear();localStorage.setItem('dvn.cards.v1','["passenger","shop","water"]');
 expect([...readDiscoveries()]).toEqual(['passenger','shop','obstacles']);
 saveDiscoveries(new Set());expect([...readDiscoveries()]).toEqual([]);
 const seen=readDiscoveries();seen.add('passenger');saveDiscoveries(seen);
 expect([...readDiscoveries()]).toEqual(['passenger']);expect(readDiscoveries().has('shop')).toBe(false);
});
