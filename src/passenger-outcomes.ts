/** Decide each rider independently, reproducibly from run seed, crash number and rider ID. */
export function splitCrashRiders(riderIds: readonly string[], seed: number, crashNumber: number,
  returnChance: number): { returning: string[]; stranded: string[] } {
  const returning: string[] = [], stranded: string[] = [];
  for (const id of riderIds) {
    let value = (seed ^ Math.imul(crashNumber + 1, 0x9e3779b1)) >>> 0;
    for (const char of id) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
    value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0;
    value ^= value >>> 15; value = Math.imul(value, 0x846ca68b) >>> 0;
    value = (value ^ (value >>> 16)) >>> 0;
    (value / 0x100000000 < returnChance ? returning : stranded).push(id);
  }
  return { returning, stranded };
}
