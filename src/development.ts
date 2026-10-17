import type { Run } from './survival';
import { entity } from './world';
import { junction } from './route';
/** Manual QA fixtures. Imported only through a DEV branch; no player-facing control. */
export function developmentScenario(run: Run, scenario: string | null): Run {
  if (scenario === 'passenger') return { ...run, world: { ...run.world, entities: [entity('passenger', 'qa-passenger', 5, 0)],
    nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  if (scenario === 'passenger-crash') {
    const car = { ...entity('traffic', 'qa-traffic', 8, 0), speed: 0 };
    const water = entity('water', 'qa-water', 16, 0); water.width = 9.6; water.length = 10;
    const hole = entity('pothole', 'qa-hole', 15, 0); hole.width = 9.6; hole.length = 8;
    return { ...run, passengers: 3, world: { ...run.world, entities: [car, water, hole],
      nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'junction' || scenario === 'blocked-junction' || scenario === 'blocked-window') {
    const index = scenario === 'junction' ? 0 : Array.from({ length: 20 }, (_, i) => i + 1).find(i => junction(run.seed, i).blockedStraight)!;
    return { ...run, phase: 'ready', distance: junction(run.seed, index).distance - (scenario === 'blocked-window' ? 18 : 95),
      route: { ...run.route, index }, world: { ...run.world, entities: [], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
  }
  if (scenario !== 'coast' && scenario !== 'supplies' && scenario !== 'crash') return run;
  return { ...run, fuel: scenario === 'coast' ? .006 : scenario === 'supplies' ? 0 : run.fuel,
    durability: scenario === 'supplies' ? 30 : run.durability,
    motion: scenario === 'supplies' ? 'coasting' : 'powered',
    world: { ...run.world, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
      entities: scenario === 'supplies' ? [entity('fuel', 'qa-fuel', 6, 0), entity('repair', 'qa-repair', 12, 0)] :
        scenario === 'crash' ? [entity('traffic', 'qa-traffic', 8, 0)] : [] } };
}
