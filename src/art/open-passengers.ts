import * as THREE from 'three';
import type { VehicleKind } from '../vehicles';
import type { VehicleArt } from './vehicle-catalog';

/** Every rider on an open player vehicle gets a real person mount, even when overloaded. */
export function openPassengerSeat(art: VehicleArt, kind: VehicleKind, index: number): THREE.Object3D {
  const builtIn = Array.isArray(art.seats) ? art.seats.slice(1) :
    'passenger' in art.seats ? [art.seats.passenger] : [];
  if (index < builtIn.length) return builtIn[index];
  const name = `overflow_passenger_seat_${index}`;
  const existing = art.root.getObjectByName(name);
  if (existing) return existing;
  const extra = index - builtIn.length;
  const seat = new THREE.Group(); seat.name = name;
  const side = extra % 2 ? 1 : -1;
  const row = Math.floor(extra / 2);
  seat.position.set(side * (kind === 'tricycle' ? .48 : .24),
    1.10 + row * .14, (kind === 'tricycle' ? .55 : .42) + row * .29);
  seat.rotation.z = -side * .10;
  art.root.add(seat);
  return seat;
}
