import { trainClosed, bananaTarget } from './special-events';
import { createElement, ChevronDown } from 'lucide';
import { uiIcon } from './ui-icons';
import { balance, shopBalance } from './config';
import { reachableShop } from './shop';
import { activeVehicle, type Run } from './survival';
import { warningDistance } from './world';

interface Projection { project(x: number, y: number, z: number): { x: number; y: number } }
const icons = { fuel: 'fuel', repair: 'repair', shop: 'bag' } as const;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** Supply tags only. Essential actions are a single fixed cue, never an obstacle label. */
export class RoadHud {
  private cues = new Map<string, { root: HTMLDivElement; value: HTMLSpanElement }>();
  private action: HTMLDivElement;
  constructor(host: HTMLElement) {
    for (const [kind, icon] of Object.entries(icons)) {
      const root = document.createElement('div'), value = document.createElement('span');
      root.className = `world-cue ${kind}`; root.hidden = true; root.dataset.kind = kind;
      root.setAttribute('role', 'img');
      root.append(uiIcon(icon), value,
        createElement([ChevronDown[0], { ...ChevronDown[1], class: 'pointer', 'aria-hidden': 'true' }, ChevronDown[2]]));
      host.append(root); this.cues.set(kind, { root, value });
    }
    this.action = document.createElement('div'); this.action.id = 'road-action'; this.action.hidden = true;
    this.action.setAttribute('role', 'status'); host.append(this.action);
  }
  update(s: Run, projection: Projection, flavor: boolean): void {
    for (const { root } of this.cues.values()) root.hidden = true;
    this.action.hidden = true;
    if (s.phase === 'running' && !s.crash) {
      const nearby = s.world.entities.filter(e => !e.consumed && !e.wrecked &&
        e.distance + (e.kind === 'shop' ? shopBalance.reach : e.length / 2) >= s.distance &&
        e.distance - s.distance <= warningDistance(s.speed, e, activeVehicle(s).length)).sort((a,b) => a.distance-b.distance);
      for (const [kind, cue] of this.cues) {
        const e = kind === 'shop' ? reachableShop(s) ?? nearby.find(e => e.kind === kind) : nearby.find(e => e.kind === kind);
        if (!e) continue;
        const p = projection.project(e.x, 1.1, -(e.distance-s.distance)), x = clamp(p.x,9,91), y = clamp(p.y,32,61);
        cue.root.hidden = false; cue.root.style.left = `${x}%`; cue.root.style.top = `${y}%`;
        const distance = Math.max(0, Math.ceil(e.distance-s.distance));
        cue.value.textContent = kind === 'shop' && reachableShop(s)?.id === e.id ? 'R · GHÉ' : `${distance} m`;
        cue.root.setAttribute('aria-label', `${kind === 'fuel' ? 'Xăng' : kind === 'repair' ? 'Sửa chữa' : 'Cửa hàng'} · ${distance} m`);
      }
      const person = nearby.find(e => e.kind === 'passenger' && e.pickupable !== false && e.lastHit <= s.activeSeconds &&
        Math.abs(e.distance-s.distance) <= balance.passengerReach && Math.abs(e.x-s.x) <= balance.passengerLateralReach);
      const train = nearby.find(e => e.kind === 'train');
      const officer = bananaTarget(s);
      const cargo = nearby.find(e => e.kind === 'traffic' && e.cargoReleaseAt !== undefined && !e.cargoDropped);
      const slot = s.inventory.indexOf('banana');
      const cue = train ? (trainClosed(train,s.activeSeconds) ? 'S · CHỜ TÀU' : train.x * (train.crossMotion?.velocity ?? 0) < 0 ? 'S · TÀU SẮP TỚI' : 'ĐƯỜNG MỞ') :
        officer ? slot >= 0 ? `${slot+1} · DÙNG CHUỐI` : 'NÉ CHỐT' : cargo ? 'CHÚ Ý ĐỒ RƠI' : person ? 'F · ĐÓN KHÁCH' : '';
      this.action.textContent = cue; this.action.hidden = !cue;
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
