import { describe, expect, it } from 'vitest';
import { runtimeMode } from '../src/runtime-mode';

describe('game entry point physics mode', () => {
  it('integrates force physics into the main game and keeps the explicit force route', () => {
    expect(runtimeMode('/')).toBe('force');
    expect(runtimeMode('/index.html')).toBe('force');
    expect(runtimeMode('/ver.force.html')).toBe('force');
  });

  it('keeps the noforce backup on its own route', () => {
    expect(runtimeMode('/ver.noforce.html')).toBe('noforce');
  });
});
