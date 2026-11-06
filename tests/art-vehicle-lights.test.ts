import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { vehicleIndicatorSide } from '../src/art/vehicle-effects';
import { createVehicleLightBeams } from '../src/art/vehicle-light-beams';
import { attachArticulatedContainerArt, attachVehicleArtToPrototype } from '../src/art/prototype-adapter';
import { createUtilityVehicleArt } from '../src/art/utility-vehicles';
import { bindVehicleLampMaterials } from '../src/art/vehicle-light-materials';
import { vehicles, type VehicleKind } from '../src/vehicles';

describe('vehicle lighting coverage', () => {
  it('lights actual lens areas, flashes the physical side and leaves paint/reflectors alone', () => {
    const art = createVehicleArt('car4', 'player');
    const lens = art.root.getObjectByName('tail_outer_1') as THREE.Mesh;
    const reflector = art.root.getObjectByName('rear_reflector_1') as THREE.Mesh;
    const originalReflector = reflector.material;
    const lights = bindVehicleLampMaterials(art);
    const tail = lens.material as THREE.MeshBasicMaterial;
    const left = (art.root.getObjectByName('tail_upper_1') as THREE.Mesh).material as THREE.MeshBasicMaterial;
    const right = (art.root.getObjectByName('tail_upper_-1') as THREE.Mesh).material as THREE.MeshBasicMaterial;
    lights.update(false, 'left', 0, false, false, false);
    const running = tail.color.clone(); expect(left.color.r).toBeGreaterThan(right.color.r);
    lights.update(true, 'left', .7, false, false, false);
    expect(tail.color.r).toBeGreaterThan(running.r); expect(left.color.toArray()).toEqual(right.color.toArray());
    expect(reflector.material).toBe(originalReflector);
    lights.update(false, null, 0, false, true, false);
    expect(left.color.toArray()).toEqual(right.color.toArray());
    lights.update(false, null, 0, false, false, true);
    expect(tail.color.r).toBeLessThan(running.r); art.dispose();
  });
  it('gives every vehicle head/tail lamps and both indicator sides at front and rear at both LODs', () => {
    for (const kind of Object.keys(vehicles) as VehicleKind[]) for (const lod of ['near', 'far'] as const) {
      const art = createVehicleArt(kind, 'player', lod);
      const names = Object.keys(art.sockets);
      expect(names.some(name => name.startsWith('headlamp')), `${kind} head`).toBe(true);
      expect(names.some(name => name.startsWith('tail')), `${kind} tail`).toBe(true);
      for (const rear of [false, true]) for (const side of ['left', 'right'])
        expect(Object.entries(art.sockets).some(([name, socket]) => name.startsWith('indicator_') &&
          name.includes('rear') === rear && vehicleIndicatorSide(socket.position.x) === side), `${kind} ${rear} ${side}`).toBe(true);
      const frame = new THREE.Group(); attachVehicleArtToPrototype(frame, art);
      for (const [name, socket] of Object.entries(art.sockets)) if (name.startsWith('indicator_')) {
        const x = socket.getWorldPosition(new THREE.Vector3()).x;
        expect(Math.sign(x)).toBe(vehicleIndicatorSide(socket.position.x) === 'left' ? -1 : 1);
      }
      art.dispose();
    }
  });
  it('keeps container rear lamps attached to the independently turning trailer', () => {
    const art = createUtilityVehicleArt('container', 'player');
    const tractor = new THREE.Group(), trailer = new THREE.Group();
    attachArticulatedContainerArt(tractor, trailer, art);
    trailer.position.set(-3, 0, 5); trailer.rotation.y = .4; tractor.position.x = 4;
    const tail = art.sockets['tail_-1'].getWorldPosition(new THREE.Vector3());
    const trailerPart = trailer.getObjectByName('tail_-1')!;
    expect(tail.distanceTo(trailerPart.getWorldPosition(new THREE.Vector3()))).toBeLessThan(.1);
    expect(art.sockets.indicator_rear_left.parent?.parent).toBe(trailer);
    const lenses = bindVehicleLampMaterials(art);
    expect((trailerPart as THREE.Mesh).material).toBeInstanceOf(THREE.MeshBasicMaterial);
    lenses.update(true, null, 0, false, false, false);
    expect(((trailerPart as THREE.Mesh).material as THREE.MeshBasicMaterial).color.r).toBeGreaterThan(1);
    art.dispose();
  });
  it('bounds ground washes, uses the lamp direction and clears retired sources each frame', () => {
    const beams = createVehicleLightBeams(2), point = new THREE.Vector3(2, 1.2, 3);
    beams.add(point, new THREE.Vector3(0, 0, -1)); beams.add(point, new THREE.Vector3(1, 0, 0));
    beams.add(point, new THREE.Vector3(0, 0, 1)); expect(beams.root.count).toBe(2);
    const matrix = new THREE.Matrix4(); beams.root.getMatrixAt(0, matrix);
    const tip = new THREE.Vector3(0, 0, 1).applyMatrix4(matrix);
    expect(tip.z).toBeLessThan(point.z); expect(tip.y).toBeCloseTo(.1);
    expect(point.toArray()).toEqual([2, 1.2, 3]); beams.reset(); expect(beams.root.count).toBe(0); beams.dispose();
  });
});
