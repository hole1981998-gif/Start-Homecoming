import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameAudio, cueForAudioEvent, unseenAudioEvents } from '../src/audio';
import { initialRun } from '../src/survival';
import { entity } from '../src/world';

describe('game audio events', () => {
  it('distinguishes impact material and vehicle mass', () => {
    expect(cueForAudioEvent({ id: 1, kind: 'traffic', variant: 'motorcycle' })).toBe('collision_light');
    expect(cueForAudioEvent({ id: 2, kind: 'traffic', variant: 'bus' })).toBe('collision_heavy');
    expect(cueForAudioEvent({ id: 3, kind: 'cargo', variant: 'barrel' })).toBe('cargo_barrel_hit');
    expect(cueForAudioEvent({ id: 4, kind: 'train' })).toBe('train_hit');
    expect(cueForAudioEvent({ id: 5, kind: 'traffic', variant: 'ambulance' })).toBe('ambulance_hit');
    expect(cueForAudioEvent({ id: 6, kind: 'jam', variant: 'vendor' })).toBe('vendor_cart_hit');
  });

  it('preserves multiple contacts in one tick while excluding previously played ids', () => {
    const events = [
      { id: 9, kind: 'water' as const },
      { id: 11, kind: 'traffic' as const, variant: 'truck' },
      { id: 10, kind: 'cargo' as const, variant: 'crate' },
    ];
    expect(unseenAudioEvents(events, 9).map(event => event.id)).toEqual([10, 11]);
    expect(unseenAudioEvents(events, 11)).toEqual([]);
  });
});

class FakeAudio {
  static all: FakeAudio[] = [];
  src: string; volume = 1; loop = false; preload = ''; playbackRate = 1; currentTime = 0;
  paused = true; dataset: Record<string, string> = {};
  plays = 0;
  constructor(src: string) { this.src = src; FakeAudio.all.push(this); }
  play(): Promise<void> { this.paused = false; this.plays++; return Promise.resolve(); }
  pause(): void { this.paused = true; }
  addEventListener(): void { /* The test does not advance audio playback time. */ }
}

describe('GameAudio playback', () => {
  afterEach(() => { vi.unstubAllGlobals(); FakeAudio.all = []; });

  it('plays each contact once and retains the terminal impact tail after pausing', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const audio = new GameAudio();
    const start = initialRun(17, 'audio-test');
    audio.update(start);
    audio.unlock();
    const hit = { ...start, phase: 'running' as const, eventSequence: 1,
      audioEvents: [{ id: 1, kind: 'train' as const, entityId: 'train-1' }] };
    audio.update(hit);
    audio.update(hit);
    expect(FakeAudio.all.filter(voice => voice.src.endsWith('train_hit.mp3') && voice.plays === 1)).toHaveLength(1);
    audio.pause();
    expect(FakeAudio.all.find(voice => voice.src.endsWith('train_hit.mp3'))?.paused).toBe(false);
  });

  it('plays a newly dropped cargo cue once, and silence is immediate at zero SFX volume', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const audio = new GameAudio();
    const start = initialRun(17, 'cargo-audio');
    audio.update(start);
    audio.unlock();
    const cargo = entity('cargo', 'cargo:new', start.distance + 35, 0);
    const run = { ...start, phase: 'running' as const,
      world: { ...start.world, entities: [...start.world.entities, cargo] } };
    audio.update(run);
    audio.update(run);
    expect(FakeAudio.all.filter(voice => voice.src.endsWith('cargo_release.mp3') && voice.plays === 1)).toHaveLength(1);
    audio.setVolume('sfx', 0);
    expect(FakeAudio.all.find(voice => voice.src.endsWith('cargo_release.mp3'))?.volume).toBe(0);
    audio.play('train_hit');
    expect(FakeAudio.all.filter(voice => voice.src.endsWith('train_hit.mp3'))).toHaveLength(0);
  });

  it('resumes ambient loops after restarting into a new run', () => {
    vi.stubGlobal('Audio', FakeAudio);
    const audio = new GameAudio();
    const first = initialRun(17, 'first');
    audio.update(first);
    audio.unlock();
    audio.update({ ...first, phase: 'running' });
    audio.reset();
    audio.unlock();
    const second = { ...initialRun(17, 'second'), phase: 'running' as const };
    audio.update(second);
    expect(FakeAudio.all.filter(voice => voice.src.endsWith('rain_road_loop.mp3') && !voice.paused)).toHaveLength(1);
  });
});
