import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createRoadEffects } from '../src/art/road-effects';
import { vehicleEffectState, vehicleLampSignal } from '../src/art/vehicle-effects';

describe('presentation event pool lifecycle', () => {
  it('carries exhaust with a moving vehicle and fades smoke instead of a solid lingering chunk', () => {
    const fx = createRoadEffects(), point = new THREE.Vector3(), carrier = new THREE.Vector3(0, 0, -20);
    fx.begin(0, 'run', false); fx.burst('boost-smoke', point, new THREE.Vector3(0, 0, 1), 'smoke', 1, 'car', carrier);
    fx.update();
    const mesh = fx.root.children[0] as THREE.InstancedMesh;
    const alpha = mesh.geometry.getAttribute('particleOpacity'), first = alpha.getX(0);
    fx.begin(.3, 'run', false); fx.update();
    const matrix = new THREE.Matrix4(); mesh.getMatrixAt(0, matrix);
    expect(matrix.elements[14]).toBeLessThan(-5); expect(alpha.getX(0)).toBeLessThan(first);
    expect(carrier.z).toBe(-20); expect(point.length()).toBe(0); fx.dispose();
  });
  it('supports single and sided rear lamps, and only the committed indicator side', () => {
    for (const name of ['tail', 'tail_left', 'tail_right']) {
      const tail = vehicleLampSignal(name, false, null, 0, false)!;
      const brake = vehicleLampSignal(name, true, null, 0, false)!;
      expect(tail).not.toBeNull(); expect(brake.size).toBeGreaterThan(tail.size);
    }
    expect(vehicleLampSignal('indicator_front_left', false, 'right', 0, false)).toBeNull();
    expect(vehicleLampSignal('indicator_front_right', false, 'right', .7, false)).toBeNull();
    expect(vehicleLampSignal('indicator_front_right', false, 'right', .7, true)).not.toBeNull();
    expect(vehicleLampSignal('headlamp', false, null, 0, false)).toBeNull();
  });
  it('keeps an undamaged fuel-stopped vehicle distinct from a wreck', () => {
    expect(vehicleEffectState(1, false, 0)).toEqual({ smoke: false, fire: false, lamp: 'tail' });
    expect(vehicleEffectState(.25, false, 0).fire).toBe(false);
    expect(vehicleEffectState(0, true, 0).fire).toBe(true);
    expect(vehicleEffectState(0, true, 2).fire).toBe(false);
  });
  it('deduplicates an event during repeated paused frames and expires only on its clock', () => {
    const fx = createRoadEffects(), origin = new THREE.Vector3(), direction = new THREE.Vector3(0, 0, 1);
    fx.begin(1, 'run', false); fx.burst('contact:1', origin, direction, 'impact'); fx.update();
    const mesh = fx.root.children[0] as THREE.InstancedMesh;
    const frame = Array.from(mesh.instanceMatrix.array);
    fx.begin(1, 'run', false); fx.burst('contact:1', origin, direction, 'impact'); fx.update();
    expect(fx.activeCount).toBe(8); expect(Array.from(mesh.instanceMatrix.array)).toEqual(frame);
    fx.begin(1.5, 'run', false); fx.update(); expect(fx.activeCount).toBe(0);
    fx.dispose();
  });
  it('bounds busy scenes and clears same-seed restarts, epoch changes and retirement', () => {
    const fx = createRoadEffects(24), point = new THREE.Vector3();
    fx.begin(10, 'a', false);
    for (let i = 0; i < 200; i++) fx.burst(`${i}`, point, point, 'water');
    expect(fx.activeCount).toBe(24); expect(fx.rememberedCount).toBeLessThanOrEqual(48);
    fx.begin(0, 'a', false); expect(fx.activeCount).toBe(0);
    fx.burst('new', point, point, 'water'); fx.begin(0, 'b', false);
    expect(fx.activeCount).toBe(0);
    fx.burst('retired', point, point, 'smoke'); fx.begin(4, 'b', false); fx.update();
    expect(fx.activeCount).toBe(0); expect(fx.rememberedCount).toBe(0); fx.dispose();
  });
  it('reduces particle density without removing the event cue', () => {
    const fx = createRoadEffects(), point = new THREE.Vector3();
    fx.begin(0, 'run', true); fx.burst('water', point, point, 'water', 10); fx.update();
    expect(fx.activeCount).toBe(3); expect(point.toArray()).toEqual([0, 0, 0]); fx.dispose();
  });
  it('retires a source immediately before its mesh can be reused by another vehicle', () => {
    const fx = createRoadEffects(), point = new THREE.Vector3();
    fx.begin(1, 'run', false);
    fx.burst('old-car', point, point, 'smoke', 4, 'old');
    fx.burst('new-car', point, point, 'smoke', 3, 'new');
    fx.retainOwners(new Set(['new'])); fx.update();
    expect(fx.activeCount).toBe(3);
    fx.retainOwners(new Set()); fx.update(); expect(fx.activeCount).toBe(0); fx.dispose();
  });
});
