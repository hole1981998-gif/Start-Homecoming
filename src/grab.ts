import { isSpecial } from './special-events';
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
  const mixed = Math.imul(run.seed ^ 0x85ebca6b, 2246822519) >>> 0;
  const hash = Math.imul(mixed ^ run.world.branchSeed ^ run.grabSequence, 3266489917) >>> 0;
  const preferredSide = (hash >>> 16) & 1 ? 1 : -1;
  const roadHalfWidth = balance.laneWidth * balance.laneCount / 2;
  const vehicleBound = roadHalfWidth - vehicle.width / 2;
  const npcHalfWidth = entity('passenger', 'geometry', 0, 0).width / 2;
  const sides = [preferredSide, -preferredSide];
  for (let offset = ahead; offset <= itemBalance.grabMaxAhead; offset += itemBalance.grabSearchStep) {
    const distance = run.distance + offset;
    if (nearJunction(distance) || (!run.route.choice && run.distance < nextJunction.distance + 4 &&
      distance >= nextJunction.distance - 8)) continue;
    const early = offset / Math.max(run.speed, vehicle.maxSpeed), late = offset / vehicle.minSpeed;
    for (const side of sides) {
      const x = side * (roadHalfWidth + npcHalfWidth);
      const pickupX = side * vehicleBound;
      if (Math.abs(x - pickupX) > balance.passengerLateralReach) continue;
      if (Math.abs(pickupX - run.x) > balance.lateralSpeed * Math.max(0, early - itemBalance.grabSteeringMarginSeconds)) continue;
      const safe = run.world.entities.every(e => {
        if (e.consumed) return true;
        if (e.kind === 'passenger') return Math.abs(e.x - x) > itemBalance.grabClearance || Math.abs(e.distance - distance) > balance.passengerReach;
        if (e.kind === 'shop') return Math.abs(e.distance - distance) > shopBalance.clearance;
        if (isSpecial(e.kind)) return Math.abs(e.distance - distance) > 110;
        if (!['traffic', 'water', 'pothole'].includes(e.kind)) return true;
        const clearance = (vehicle.length + e.length) / 2 + itemBalance.grabClearance;
        const from = Math.min(e.distance, e.distance + e.speed * early, e.distance + e.speed * late);
        const to = Math.max(e.distance, e.distance + e.speed * early, e.distance + e.speed * late);
        return Math.abs(e.x - pickupX) > (vehicle.width + e.width) / 2 + itemBalance.grabClearance ||
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
