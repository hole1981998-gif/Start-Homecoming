import type { Run } from './survival';
import { entity } from './world';
/** Manual QA fixtures. Imported only through a DEV branch; no player-facing control. */
export function developmentScenario(run: Run, scenario: string | null): Run {
  if (scenario !== 'coast' && scenario !== 'supplies' && scenario !== 'crash') return run;
  return { ...run, fuel: scenario === 'coast' ? .006 : scenario === 'supplies' ? 0 : run.fuel,
    durability: scenario === 'supplies' ? 30 : run.durability,
    motion: scenario === 'supplies' ? 'coasting' : 'powered',
    world: { ...run.world, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
      entities: scenario === 'supplies' ? [entity('fuel', 'qa-fuel', 6, 0), entity('repair', 'qa-repair', 12, 0)] :
        scenario === 'crash' ? [entity('traffic', 'qa-traffic', 8, 0)] : [] } };
}
