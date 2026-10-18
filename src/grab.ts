import { balance, itemBalance, shopBalance } from './config';
import type { Run } from './survival';
import { effectiveVehicle } from './vehicles';
import { entity, passengerMotion } from './world';
import { junction, nearJunction } from './route';

/** A successful call creates exactly one real NPC. No pending asynchronous spawn or instant reward. */
export function callGrab(run: Run, slot: number): Run {
  if (!Number.isInteger(slot) || slot < 0 || slot > 1 || run.phase !== 'running' || run.crash || run.result || run.inventory[slot] !== 'grab' ||
    !Number.isInteger(run.grabUses[slot]) || run.grabUses[slot] <= 0 || run.activeSeconds < run.nextGrabAt ||
    run.world.entities.some(e => e.kind === 'passenger' && e.passengerType === 'grab' && !e.consumed && e.pickupable !== false)) return run;
  const vehicle = effectiveVehicle(run.vehicleInstances.find(v => v.id === run.activeVehicleId)!);
  const nextJunction = junction(run.seed, run.route.index);
  const ahead = Math.max(itemBalance.grabMinAhead, run.speed * balance.warningSeconds);
  const hash = (Math.imul(run.seed ^ run.world.branchSeed ^ run.grabSequence, 1664525) >>> 0) % 3;
  const lanes = [-balance.laneWidth, 0, balance.laneWidth].map((x, i) => ({ x, rank: (i + hash) % 3 }))
    .sort((a, b) => Math.abs(a.x - run.x) - Math.abs(b.x - run.x) || a.rank - b.rank);
  for (let offset = ahead; offset <= itemBalance.grabMaxAhead; offset += itemBalance.grabSearchStep) {
    const distance = run.distance + offset;
    if (nearJunction(distance) || (!run.route.choice && run.distance < nextJunction.distance + 4 &&
      distance >= nextJunction.distance - 8)) continue;
    const early = offset / Math.max(run.speed, vehicle.maxSpeed), late = offset / vehicle.minSpeed;
    for (const { x } of lanes) {
      if (Math.abs(x - run.x) > balance.lateralSpeed * Math.max(0, early - itemBalance.grabSteeringMarginSeconds)) continue;
      const safe = run.world.entities.every(e => {
        if (e.consumed) return true;
        if (e.kind === 'passenger') return Math.abs(e.x - x) > itemBalance.grabClearance || Math.abs(e.distance - distance) > balance.passengerReach;
        if (e.kind === 'shop') return Math.abs(e.distance - distance) > shopBalance.clearance;
        if (!['traffic', 'water', 'pothole'].includes(e.kind)) return true;
        const clearance = (vehicle.length + e.length) / 2 + itemBalance.grabClearance;
        const from = Math.min(e.distance, e.distance + e.speed * early, e.distance + e.speed * late);
        const to = Math.max(e.distance, e.distance + e.speed * early, e.distance + e.speed * late);
        return Math.abs(e.x - x) > (vehicle.width + e.width) / 2 + itemBalance.grabClearance ||
          distance < from - clearance || distance > to + clearance;
      });
      if (!safe) continue;
      const npc = entity('passenger', `grab:${run.runId}:${run.world.branchId}:${run.grabSequence}`, distance, x);
      npc.passengerType = 'grab'; npc.riderId = npc.id;
      // Stay inside the checked pickup pocket rather than wandering into a hazard.
      npc.passengerMotion = { ...passengerMotion(npc, run.activeSeconds), idle: true };
      const remaining = run.grabUses[slot] - 1;
      return { ...run, eventSequence: run.eventSequence + 1, feedbackKind: 'passenger', feedbackAt: run.activeSeconds,
        feedback: 'Gọi Grab · −1 lượt', grabSequence: run.grabSequence + 1, nextGrabAt: run.activeSeconds + itemBalance.grabCooldown,
        inventory: run.inventory.map((item, index) => index === slot && remaining === 0 ? null : item),
        grabUses: run.grabUses.map((uses, index) => index === slot ? remaining : uses),
        world: { ...run.world, entities: [...run.world.entities, npc] } };
    }
  }
  return run;
}
