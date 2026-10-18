/** All tunable values are TEMPORARY. Distances m, times s, speeds m/s. */
export const balance = Object.freeze({
  version: 'p61-integrated-2', laneWidth: 3.2, laneCount: 3, vehicleWidth: 0.28 * 3.2, vehicleLength: 2,
  // P1 currently has only the motorcycle; these move into its definition with the garage.
  minSpeed: 8, cruiseSpeed: 14, maxSpeed: 20, acceleration: 5, braking: 10,
  returnAcceleration: 3, returnDeceleration: 4,
  lateralSpeed: 5, lateralAcceleration: 22, lateralBraking: 30,
  fixedStep: 1 / 60, maxFrameSeconds: 0.1, maxSubsteps: 6,
  fuelCapacity: 5.5, durabilityCapacity: 70, fuelPerMeter: 0.0045,
  initialMoney: 200, scorePerMeter: 1, moneyPerMeter: 0.5,
  riderScoreBonus: 0.04, riderMoneyPerMeter: 0.01, motorcycleCapacity: 2, riderLimit: 24,
  riderCruiseLoss: 2, riderCruiseFloor: 8, overloadSpeedPenalty: 0.08, overloadFuelPenalty: 0.15,
  minSpeedFactor: 0.4, maxFuelLoadFactor: 3,
  firstPassenger: 260, passengerInterval: 400, passengerReach: 12, passengerLateralReach: 1.8,
  passengerReboardDelaySeconds: 2,
  passengerWanderRadius: 1.5, passengerWanderSpeed: 0.45, passengerKickSeconds: 0.65,
  passengerReturnChance: 0.5, passengerDownSeconds: 0.4, passengerStandSeconds: 0.55,
  coastDistance: 25, coastDrag: 3, coastCrawlSpeed: 2,
  waterFuelPerSecond: 0.8, potholeImpactDamage: 6, potholeDamagePerSecond: 12, potholeMoneyLoss: 10,
  trafficDamage: 20, trafficSpeed: 6, driverFallSeconds: 0.8, driverPauseSeconds: 0.5, driverReturnSeconds: 1.8,
  trafficWaterSpeedFactor: 0.6, trafficWreckSeconds: 2.5,
  trafficHeavySelfDamageFactor: 0.4,
  trafficPassengerLimit: 3, trafficPassengerClearance: 0.5,
  crashSlideDeceleration: 8, crashSkidLateralMetres: 1.8,
  driverEjectionSpeedFactor: 1.5, driverEjectionLateralMetres: 2.5,
  fuelPickup: 5.5, repairPickup: 40,
  firstHazard: 130, hazardGap: 90, worldLookAhead: 140,
  hazardGapMin: 75, firstJunction: 800, junctionInterval: 800, junctionClearance: 60,
  fuelInterval: 450, firstRepair: 650, repairInterval: 900,
  warningSeconds: 3.5, discoverySeconds: 8,
});
export type Balance = { [K in keyof typeof balance]: typeof balance[K] extends number ? number : string };
export function validateConfig(c: Balance): void {
  for (const [key, value] of Object.entries(c)) {
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      throw new Error(`Invalid balance: ${key}`);
    }
  }
  if (c.maxSpeed < c.minSpeed || c.cruiseSpeed < c.minSpeed || c.cruiseSpeed > c.maxSpeed ||
      c.vehicleWidth >= c.laneWidth * 1.5 || c.laneCount !== 3 ||
      c.maxFrameSeconds > c.fixedStep * c.maxSubsteps + 1e-9) throw new Error('Invalid driving bounds');
  if (c.coastCrawlSpeed > c.minSpeed || c.trafficSpeed >= c.minSpeed ||
      c.fuelInterval > 500 || c.hazardGap / c.maxSpeed < c.warningSeconds ||
      c.hazardGapMin > c.hazardGap || c.hazardGapMin / c.maxSpeed < c.warningSeconds ||
      c.junctionInterval <= c.junctionClearance * 2) throw new Error('Invalid survival bounds');
  if (c.riderCruiseFloor < c.minSpeed || c.riderCruiseFloor >= c.cruiseSpeed ||
      c.riderCruiseLoss <= 0 || c.motorcycleCapacity < 1 || c.riderLimit < c.motorcycleCapacity - 1 ||
      c.overloadSpeedPenalty >= 1 || c.minSpeedFactor > 1 || c.maxFuelLoadFactor < 1 ||
      c.passengerReach >= c.passengerInterval / 2 || c.passengerReturnChance > 1) throw new Error('Invalid passenger bounds');
  if (c.trafficWaterSpeedFactor >= 1 || c.trafficHeavySelfDamageFactor >= 1 ||
      c.trafficWreckSeconds < c.fixedStep || !Number.isInteger(c.trafficPassengerLimit) ||
      c.trafficPassengerLimit > c.riderLimit) throw new Error('Invalid traffic bounds');
}
validateConfig(balance);

/** P5 trial prices/effects from BALANCE_CONFIG. Amounts L / HP, distances m. */
export const shopBalance = Object.freeze({ firstDistance: 600, secondDistance: 1200,
  minGap: 600, maxGap: 900, reach: 30, lateralReach: 1.8, clearance: 45,
  fuelPrice: 60, repairPrice: 70,
  fuelAmount: 8, repairAmount: 40,
  enginePrices: [200, 400, 700] as const, tankPrices: [180, 350, 600] as const,
  armourPrices: [180, 350, 600] as const, economyPrices: [220, 420, 750] as const,
  enginePerLevel: .08, tankPerLevel: .15, armourPerLevel: .15, economyPerLevel: .08 });
for (const value of Object.values(shopBalance).flatMap(v => typeof v === 'number' ? [v] : [...v])) {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid shop config');
}
if (shopBalance.minGap > shopBalance.maxGap || shopBalance.economyPerLevel * 3 >= 1 ||
    shopBalance.secondDistance - shopBalance.firstDistance < shopBalance.minGap ||
    shopBalance.secondDistance - shopBalance.firstDistance > shopBalance.maxGap ||
    !Number.isInteger(shopBalance.minGap) ||
    !Number.isInteger(shopBalance.maxGap)) throw new Error('Invalid shop bounds');

/** P3A geometry candidates, in metres. All are temporary playtest values. */
export const hazardSizes = Object.freeze({
  water: [[2.4, 4], [3.2, 7], [3.2, 14], [5.7, 9], [5.7, 24], [9.6, 30]] as const,
  pothole: [[1.1, 1.2], [1.5, 1.8], [2.3, 4], [5.7, 5], [5.7, 24], [9.6, 18]] as const,
});
for (const variants of Object.values(hazardSizes)) for (const [width, length] of variants) {
  if (width <= 0 || length <= 0 || width > balance.laneWidth * balance.laneCount) {
    throw new Error('Invalid P3A hazard geometry');
  }
}

/** P5.1 trial: seconds, metres, multiplier and in-run money. Not tuned. */
export const itemBalance = Object.freeze({ boostSeconds: 4, starSeconds: 5, jumpSeconds: 1.6,
  jumpHeight: 2.4, groundClearance: .15, pickupClearance: .8, lowTrafficClearance: 1.8, highTrafficClearance: 3.5, boostFactor: 1.3, nitroPrice: 120, starPrice: 180,
  grabPrice: 240, grabUses: 3, grabShopStock: 1, grabMoneyMultiplier: 10, grabMinAhead: 45, grabMaxAhead: 120,
  grabSearchStep: 10, grabClearance: 1, grabCooldown: 2, grabSteeringMarginSeconds: .5 });
for (const value of Object.values(itemBalance)) if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid power item config');
if (itemBalance.jumpSeconds > itemBalance.boostSeconds || itemBalance.jumpHeight <= itemBalance.lowTrafficClearance || itemBalance.boostFactor <= 1)
  throw new Error('Invalid power item bounds');

if (!Number.isInteger(itemBalance.grabUses) || itemBalance.grabMinAhead > itemBalance.grabMaxAhead ||
    itemBalance.grabMaxAhead > balance.worldLookAhead || itemBalance.grabMoneyMultiplier <= 1) throw new Error('Invalid Grab bounds');

/** P6 trial values: money, metres, seconds, probability. */
export const eventBalance = Object.freeze({ policeFine: 300, militiaFine: 100, reserveFuelFactor: .5,
  firstDistance: 1700, gap: 1250, reactionSeconds: 3.5, bananaReach: 45, bananaPrice: 80,
  trainPeriod: 16, trainClosedSeconds: 8, trainClearance: 1.8, brokenItemChance: .25,
  corridor: 110 });
for (const value of Object.values(eventBalance)) if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid event config');
if (eventBalance.trainClosedSeconds >= eventBalance.trainPeriod || eventBalance.reserveFuelFactor > 1 ||
    eventBalance.brokenItemChance > 1 || eventBalance.trainClearance >= itemBalance.jumpHeight ||
    eventBalance.gap < 1200) throw new Error('Invalid event bounds');

export const movingVersion = 'p61-scenarios-3';

/** Opt-in P6.1 scenarios only. Units: m, m/s, s. No normal-route spawn tuning. */
export const movingBalance = Object.freeze({ trainWidth: 24, trainDepth: 2.8, trainSpeed: (24 + balance.laneWidth * balance.laneCount) / 4, trainCrossSeconds: 4, trainOrigin: 20,
  npcWidth: .65, npcDepth: .65, patrolSpeed: 4.5, patrolFastSpeed: 6.3, patrolStaggerSpeed: 5.6, patrolSlowSpeed: 3.8, patrolStaggerDepth: 3, patrolBound: 4.35,
  barrierWidth: 6.2, barrierDepth: 1.4, blockerDamage: 20, vendorSpeed: 3.4, vendorWidth: 1.8, vendorLength: 2.1, ambulanceSpeed: 16 });
for (const value of Object.values(movingBalance)) if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid moving hazard config');
if (movingBalance.npcWidth + 2 * movingBalance.patrolBound > balance.laneWidth * balance.laneCount ||
    movingBalance.trainOrigin - movingBalance.trainWidth / 2 < balance.laneWidth * 1.5 ||
    balance.laneWidth * balance.laneCount - movingBalance.barrierWidth < 2.88) throw new Error('Invalid prototype footprints');

/** DEV stress values, deliberately unbalanced: metres, traffic per station, in-run money. */
export const stressBalance = Object.freeze({ first: 80, gap: 24, trafficPerStation: 2, specialEvery: 3, lookAhead: 480, money: 10000 });
for (const value of Object.values(stressBalance)) if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid stress config');

/** P6.2 fixture-only push speeds m/s and zone geometry m; provisional. */
export const forceBalance = Object.freeze({ windPush: 1.5, maxPush: 2.2, zoneStart: 45, zoneLength: 65, windWidth: 9.6 });
for(const value of Object.values(forceBalance)) if(!Number.isFinite(value)||value<=0)throw new Error('Invalid force config');
if(forceBalance.maxPush>=balance.lateralSpeed||forceBalance.windWidth>balance.laneWidth*balance.laneCount)throw new Error('Force must remain countersteerable');

/** P6.3 fixture-only cargo: m, m/s, s, HP. Provisional until playtest. */
export const cargoBalance = Object.freeze({ lifetime: 12, rollSpeed: .9, backwardSpeed: 1.2, roadHalfWidth: 4.45,
  crateDamage: 8, barrelDamage: 14, maxActive: 4, releaseGap: 1.2 });
for (const value of Object.values(cargoBalance)) if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid cargo config');
if (!Number.isInteger(cargoBalance.maxActive) || cargoBalance.roadHalfWidth > balance.laneWidth * balance.laneCount / 2)
  throw new Error('Invalid cargo bounds');
