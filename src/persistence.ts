import type { RunResult } from './survival';
import type { EntityKind } from './world';
const resultsKey = 'dvn.results.v1', seenKey = 'dvn.cards.v1', badgesKey = 'dvn.badges.v1';
const kinds: EntityKind[] = ['wind', 'water', 'pothole', 'traffic', 'cargo', 'fuel', 'repair', 'passenger', 'shop', 'police', 'militia', 'jam', 'accident', 'train', 'broken'];
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
    (r.scoreVersion === undefined || r.scoreVersion === 'legacy-v1' || r.scoreVersion === 'speed-v1') &&
    ['fuel', 'damage', 'train', 'police', 'secret'].includes(r.reason) && [r.distance, r.score, r.money, r.seconds].every(n => Number.isFinite(n) && n >= 0);
}
export function results(): RunResult[] {
  const data = read(resultsKey);
  return Array.isArray(data) ? data.filter(validResult).slice(-100) : [];
}
export function recordResult(result: RunResult): boolean {
  if (!validResult(result)) return false;
  const saved = results();
  if (!saved.some(r => r.runId === result.runId) && !write(resultsKey, [...saved, result].slice(-100))) return false;
  return result.reason !== 'secret' || write(badgesKey, ['home']);
}
export function badges(): Set<'home'> {
  const data = read(badgesKey);
  return new Set(Array.isArray(data) && data.includes('home') ? ['home'] : []);
}
/** Local only; stable tie-breaks make repeated display deterministic. */
export function leaderboard(version?: 'legacy-v1' | 'speed-v1'): RunResult[] {
  return results().filter(r => !version || (r.scoreVersion ?? 'legacy-v1') === version)
    .sort((a, b) => b.score - a.score || b.distance - a.distance || a.seconds - b.seconds || a.runId.localeCompare(b.runId));
}
export function seenCards(): Set<EntityKind> {
  const data = read(seenKey);
  return new Set(Array.isArray(data) ? data.filter((v): v is EntityKind => kinds.includes(v as EntityKind)) : []);
}
export function saveSeen(seen: Set<EntityKind>): void { write(seenKey, [...seen]); }
export function showFlavor(): boolean { return read('dvn.flavor.v1') !== false; }
export function saveFlavor(enabled: boolean): void { write('dvn.flavor.v1', enabled); }
export function audioLevel(bus: 'sfx' | 'ambience'): number {
  const value = read(`dvn.audio.${bus}`);
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}
export function saveAudioLevel(bus: 'sfx' | 'ambience', level: number): boolean {
  return write(`dvn.audio.${bus}`, Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 1);
}
