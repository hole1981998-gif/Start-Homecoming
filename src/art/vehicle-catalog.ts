import { createCar4Art } from './car4';
import { createCar7Art } from './car7';
import { createTwoWheelerArt } from './two-wheelers';
import { createUtilityVehicleArt, type VehicleRole } from './utility-vehicles';
import { createPersonArt, mountPersonOnSeat } from './people';
import type { VehicleKind } from '../vehicles';

export type VehicleArt = ReturnType<typeof createCar4Art> | ReturnType<typeof createCar7Art> |
  ReturnType<typeof createTwoWheelerArt> | ReturnType<typeof createUtilityVehicleArt>;

/** One family master per kind; the traffic role reuses it without external passenger meshes. */
export function createVehicleArt(kind: VehicleKind, role: VehicleRole = 'player',
  lod: 'near' | 'far' = 'near', trafficColor?: string): VehicleArt {
  const asset = kind === 'car4' ? createCar4Art(lod) :
    kind === 'car7' ? createCar7Art(lod) :
      kind === 'motorcycle' || kind === 'motorbike' ? createTwoWheelerArt(kind, lod) :
        createUtilityVehicleArt(kind, role, lod);
  if (role === 'traffic' && (kind === 'motorcycle' || kind === 'motorbike')) {
    const bike = asset as ReturnType<typeof createTwoWheelerArt>;
    mountPersonOnSeat(createPersonArt('driver', lod), bike.seats.driver, 'riding');
  } else if (role === 'traffic' && kind === 'tricycle') {
    const tricycle = asset as ReturnType<typeof createUtilityVehicleArt>;
    mountPersonOnSeat(createPersonArt('driver', lod), tricycle.seats[0], 'riding');
  }
  asset.root.name = `veh_${kind}_${role}_${lod}`;
  asset.root.userData.id = `veh_${kind}_${role}_A`;
  asset.root.userData.role = role;
  if (role === 'traffic' && trafficColor) asset.setPaint(trafficColor);
  return asset;
}
