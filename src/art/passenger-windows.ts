import type { VehicleKind } from '../vehicles';

export interface PassengerWindowPose { x: number; y: number; z: number }

const windowLayouts: Partial<Record<VehicleKind, PassengerWindowPose[]>> = {
  car4: Array.from({ length: 3 }, (_, index) => ({
    x: index === 0 ? .76 : index === 1 ? -.76 : .76,
    y: 1.34,
    z: index === 0 ? .52 : -.60,
  })),
  car7: Array.from({ length: 6 }, (_, index) => ({
    x: (index % 2 ? 1 : -1) * .96,
    y: 1.40,
    z: .95 - Math.floor(index / 2) * .93,
  })),
  bus: Array.from({ length: 24 }, (_, index) => ({
    x: (index % 2 ? 1 : -1) * 1.28,
    y: 2.22,
    z: 3.72 - Math.floor(index / 2) * .68,
  })),
  truck: Array.from({ length: 2 }, (_, index) => ({
    x: index ? 1.20 : -1.20,
    y: 2.12,
    z: 2.10,
  })),
  container: [{ x: 1.20, y: 2.19, z: 5.96 }],
};

/** Visual seats only. The roster and capacity remain owned by simulation. */
export function passengerWindowPoses(kind: VehicleKind, riderCount: number): PassengerWindowPose[] {
  return (windowLayouts[kind] ?? []).slice(0, Math.max(0, Math.floor(riderCount)));
}
