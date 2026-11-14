import { describe, expect, it } from 'vitest';
import { introCues, introDuration, introFrameAt } from '../src/intro-timeline';

describe('static intro shotlist', () => {
  it('holds the six supplied images for their requested durations before the logo', () => {
    expect([0, 1.99, 2, 5.99, 6, 7.49, 7.5, 9.74, 9.75, 11.99, 12, 16.99, 17, 20.99, 21, 24.99]
      .map(time => introFrameAt(time).image)).toEqual([
        'black', 'black', 'work', 'work', 'look', 'look', 'glance', 'glance',
        'rain', 'rain', 'watch', 'watch', 'jacket', 'jacket', 'title', 'title',
      ]);
    expect(introDuration).toBe(25);
  });

  it('continues office and rain across shots with the requested relative levels', () => {
    const first = introFrameAt(5), window = introFrameAt(8), watch = introFrameAt(14), jacket = introFrameAt(18), logo = introFrameAt(23);
    expect(window.officeVolume).toBeLessThan(first.officeVolume);
    expect(window.rainVolume).toBeGreaterThan(first.rainVolume);
    expect(watch.officeVolume).toBe(first.officeVolume);
    expect(watch.rainVolume).toBe(first.rainVolume);
    expect(jacket.officeVolume).toBe(watch.officeVolume);
    expect(logo.rainVolume).toBe(watch.rainVolume);
    expect(introFrameAt(16.9).watchZoom).toBeGreaterThan(introFrameAt(12).watchZoom);
    expect(introFrameAt(17).watchZoom).toBeCloseTo(1.07);
    expect(introFrameAt(24.9).titleScale).toBeLessThan(introFrameAt(21).titleScale);
    expect(introFrameAt(23).titleScale).toBeCloseTo((introFrameAt(21).titleScale + introFrameAt(25).titleScale) / 2);
    expect(introFrameAt(21).titleOpacity).toBe(0);
    expect(introFrameAt(22.5).titleOpacity).toBe(1);
    expect(introFrameAt(24.5).titleOpacity).toBeCloseTo(.5);
    expect(introFrameAt(25).titleOpacity).toBe(0);
    expect(introFrameAt(2).sceneOpacity).toBe(0);
    expect(introFrameAt(3).sceneOpacity).toBe(1);
    expect(introFrameAt(6).sceneOpacity).toBe(0);
    expect(introFrameAt(6.7).sceneOpacity).toBe(1);
    expect(introFrameAt(12).sceneOpacity).toBe(0);
    expect(introFrameAt(12.5).sceneOpacity).toBe(1);
    expect(introFrameAt(20.9).sceneOpacity).toBeLessThan(introFrameAt(19.5).sceneOpacity);
  });

  it('times the single sounds and never restarts the continuing ambience', () => {
    expect(introCues.map(({ at, kind, cue }) => [at, kind, cue])).toEqual([
      [1, 'start', 'office'], [1, 'start', 'typing'], [4, 'start', 'rain'],
      [6, 'stop', 'typing'], [6, 'one-shot', 'breath'], [10.5, 'one-shot', 'hmm'],
      [15, 'start', 'footsteps'], [18, 'one-shot', 'jacket'],
      [21, 'stop', 'footsteps'], [23, 'one-shot', 'game-horn'],
    ]);
  });
});
