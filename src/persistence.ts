import type { RunResult } from './survival';
import type { EntityKind } from './world';
const resultsKey = 'dvn.results.v1', seenKey = 'dvn.cards.v1';
const kinds: EntityKind[] = ['water', 'pothole', 'traffic', 'fuel', 'repair', 'passenger'];
function read(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as unknown; } catch { return null; }
}
function write(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function validResult(value: unknown): value is RunResult {
  if (!value || typeof value !== 'object') return false;
  const r = value as RunResult;
  return typeof r.runId === 'string' && typeof r.config === 'string' && Number.isFinite(r.seed) &&
    ['fuel', 'damage'].includes(r.reason) && [r.distance, r.score, r.money, r.seconds].every(n => Number.isFinite(n) && n >= 0);
}
export function results(): RunResult[] {
  const data = read(resultsKey);
  return Array.isArray(data) ? data.filter(validResult).slice(-100) : [];
}
export function recordResult(result: RunResult): boolean {
  if (!validResult(result)) return false;
  const saved = results();
  if (saved.some(r => r.runId === result.runId)) return true;
  return write(resultsKey, [...saved, result].slice(-100));
}
export function seenCards(): Set<EntityKind> {
  const data = read(seenKey);
  return new Set(Array.isArray(data) ? data.filter((v): v is EntityKind => kinds.includes(v as EntityKind)) : []);
}
export function saveSeen(seen: Set<EntityKind>): void { write(seenKey, [...seen]); }
export function showFlavor(): boolean { return read('dvn.flavor.v1') !== false; }
export function saveFlavor(enabled: boolean): void { write('dvn.flavor.v1', enabled); }
