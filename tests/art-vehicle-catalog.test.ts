import { describe, expect, it } from 'vitest';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { vehicles, type VehicleKind } from '../src/vehicles';

describe('vehicle art catalog', () => {
  it('covers all eight player and traffic roles from the same family factories', () => {
    const kinds = Object.keys(vehicles) as VehicleKind[];
    expect(kinds).toHaveLength(8);
    for (const kind of kinds) for (const role of ['player', 'traffic'] as const) {
      const art = createVehicleArt(kind, role, role === 'traffic' ? 'far' : 'near', '#7c9d9a');
      expect(art.root.userData.id).toBe(`veh_${kind}_${role}_A`);
      expect(art.root.children.length).toBeGreaterThan(0);
      art.dispose();
    }
  });
  it('shows a driver on open traffic while leaving closed traffic cabins visually sealed', () => {
    for (const kind of ['motorcycle', 'motorbike', 'tricycle'] as const) {
      const traffic = createVehicleArt(kind, 'traffic', 'far');
      expect(traffic.root.getObjectByName('chr_driver_root')).toBeDefined();
      traffic.dispose();
    }
    const car = createVehicleArt('car4', 'traffic');
    expect(car.root.getObjectByName('chr_driver_root')).toBeUndefined();
    car.dispose();
  });
});
