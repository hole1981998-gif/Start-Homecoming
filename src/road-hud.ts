import { createElement, Waves, CircleDot, CarFront, Fuel, Wrench, ChevronDown, UserRound } from 'lucide';
import { balance } from './config';
import { names, type Run } from './survival';
import { warningDistance, type EntityKind } from './world';

interface Projection { project(x: number, y: number, z: number): { x: number; y: number } }
const icons = { water: Waves, pothole: CircleDot, traffic: CarFront, fuel: Fuel, repair: Wrench, passenger: UserRound };
const supplyKind = (kind: EntityKind) => kind === 'fuel' || kind === 'repair' || kind === 'passenger';
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Read-only presentation: neither cue placement nor flavor changes simulation/RNG. */
export class RoadHud {
  private cues = new Map<EntityKind, { root: HTMLDivElement; value: HTMLSpanElement }>();
  constructor(host: HTMLElement) {
    for (const kind of Object.keys(icons) as EntityKind[]) {
      const root = document.createElement('div'), value = document.createElement('span');
      root.className = `world-cue ${kind}`; root.hidden = true; root.dataset.kind = kind;
      root.setAttribute('role', 'img');
      root.append(createElement([icons[kind][0], { ...icons[kind][1], 'aria-hidden': 'true' }, icons[kind][2]]), value,
        createElement([ChevronDown[0], { ...ChevronDown[1], class: 'pointer', 'aria-hidden': 'true' }, ChevronDown[2]]));
      if (kind === 'traffic') {
        const direction = document.createElement('em'); direction.className = 'traffic-direction'; direction.setAttribute('aria-hidden', 'true');
        root.append(direction);
      }
      host.append(root); this.cues.set(kind, { root, value });
    }
  }
  update(s: Run, projection: Projection, flavor: boolean): void {
    for (const { root } of this.cues.values()) root.hidden = true;
    const nearby = s.world.entities.filter(e => !e.consumed && !e.wrecked && (e.kind !== 'passenger' ||
      (e.pickupable !== false && e.lastHit <= s.activeSeconds)) &&
      (e.kind === 'passenger' ? e.distance + balance.passengerReach >= s.distance : e.distance + e.length / 2 >= s.distance) &&
      e.distance - s.distance <= warningDistance(s.speed, e)).sort((a, b) => a.distance - b.distance);
    const hazard = nearby.find(e => !supplyKind(e.kind));
    const supply = nearby.find(e => e.kind === 'passenger' && Math.abs(e.distance - s.distance) <= balance.passengerReach &&
      Math.abs(e.x - s.x) <= balance.passengerLateralReach) ?? nearby.find(e => supplyKind(e.kind));
    let hazardPosition: { x: number; y: number } | undefined;
    if (s.phase === 'running' && !s.crash) for (const e of [hazard, supply]) {
      if (!e) continue;
      const p = projection.project(e.x, 1.1, -(e.distance - s.distance));
      const x = clamp(p.x, 9, 91), y = clamp(p.y, 24, 61);
      // Preserve the imminent warning when markers coincide; the item mesh stays visible.
      if (supplyKind(e.kind) && hazardPosition && Math.abs(x - hazardPosition.x) < 11 && Math.abs(y - hazardPosition.y) < 9) continue;
      if (!supplyKind(e.kind)) hazardPosition = { x, y };
      const cue = this.cues.get(e.kind)!;
      cue.root.hidden = false; cue.root.style.left = `${x}%`; cue.root.style.top = `${y}%`;
      cue.root.querySelector<SVGElement>('.pointer')!.style.transform = p.x < 9 ? 'rotate(90deg)' : p.x > 91 ? 'rotate(-90deg)' : '';
      const distance = Math.max(0, Math.ceil(e.distance - s.distance));
      cue.value.textContent = e.kind === 'passenger' && Math.abs(e.distance - s.distance) <= balance.passengerReach &&
        Math.abs(e.x - s.x) <= balance.passengerLateralReach ? 'F · ĐÓN' : `${distance} m`;
      const lane = e.x < -1 ? 'trái' : e.x > 1 ? 'phải' : 'giữa';
      if (e.kind === 'traffic') cue.root.querySelector('.traffic-direction')!.textContent = e.speed < 0 ? '↓' : '↑';
      const label = e.kind === 'traffic' ? e.trafficKind === 'truck' ? 'Xe tải' :
        e.trafficKind === 'van' ? 'Xe van' : 'Xe nhỏ' : names[e.kind];
      cue.root.setAttribute('aria-label', `${label} · ${lane}${e.kind === 'traffic' ? e.speed < 0 ? ' · ngược chiều' : ' · cùng chiều' : ''} · ${distance} m`);
    }
    const coast = document.getElementById('coast-cue')!;
    coast.hidden = s.motion !== 'coasting' || s.phase !== 'running';
    coast.textContent = `Trôi ${Math.ceil(s.coastRemaining)} m`;
    const crash = document.getElementById('crash-cue')!;
    crash.hidden = !s.crash || s.phase !== 'running';
    if (s.crash) {
      const remaining = Math.max(0, balance.driverFallSeconds + balance.driverPauseSeconds + balance.driverReturnSeconds - s.crash.elapsed);
      document.getElementById('crash-time')!.textContent = `${remaining.toFixed(1)} s`;
    }
    const feedback = document.getElementById('feedback')!;
    const active = s.phase === 'running' && s.activeSeconds - s.feedbackAt < 1.5;
    const full = active ? s.feedback : '';
    if (feedback.textContent !== full) feedback.textContent = full;
    const impact = document.getElementById('impact-cue')!;
    impact.hidden = !active || !s.feedbackKind;
    impact.dataset.kind = s.feedbackKind ?? '';
    document.getElementById('impact-value')!.textContent = !active ? '' : s.feedbackKind === 'water' ? '−xăng' :
      s.feedbackKind === 'coast' ? 'Cạn xăng' : s.feedback.split(' · ').slice(1).join(' · ');
    document.getElementById('impact-flavor')!.textContent = active && flavor && ['pothole', 'traffic'].includes(s.feedbackKind ?? '') ? 'OH MY XE!' : '';
  }
}
