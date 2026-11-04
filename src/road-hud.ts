import { approachCueScale, roadCueDistance } from './cue-scale';
import { createElement, ChevronDown } from 'lucide';
import { uiIcon } from './ui-icons';
import { balance, shopBalance } from './config';
import { reachableShop } from './shop';
import type { Run } from './survival';

interface Projection { project(x: number, y: number, z: number): { x: number; y: number } }
const icons = { fuel: 'fuel', repair: 'repair', shop: 'bag' } as const;
/** Only supply/shop tags; no floating action instructions. */
export class RoadHud {
  private cues = new Map<string, { root: HTMLDivElement; value: HTMLSpanElement }>();
  constructor(host: HTMLElement) {
    for (const [kind, icon] of Object.entries(icons)) {
      const root = document.createElement('div'), value = document.createElement('span');
      root.className = `world-cue ${kind}`; root.hidden = true; root.dataset.kind = kind;
      root.setAttribute('role', 'img');
      const badge = document.createElement('span');
      if (kind === 'shop') { badge.className = 'shop-label'; badge.textContent = 'CỬA HÀNG'; }
      else { badge.className = 'supply-badge'; badge.append(uiIcon(icon)); }
      root.append(badge, value,
        createElement([ChevronDown[0], { ...ChevronDown[1], class: 'pointer', 'aria-hidden': 'true' }, ChevronDown[2]]));
      host.append(root); this.cues.set(kind, { root, value });
    }

  }
  update(s: Run, projection: Projection): void {
    for (const { root } of this.cues.values()) root.hidden = true;
    if (s.phase === 'running' && !s.crash) {
      for (const [kind, cue] of this.cues) {
        const e = s.world.entities.filter(e => e.kind === kind && !e.consumed && !e.wrecked &&
          e.distance + (kind === 'shop' ? shopBalance.reach : e.length / 2) >= s.distance &&
          e.distance - s.distance <= roadCueDistance).sort((a,b) => a.distance-b.distance)[0];
        if (!e) continue;
        const p = projection.project(e.x, .15, -(e.distance-s.distance));
        cue.root.style.setProperty('--cue-scale', String(approachCueScale(e.distance-s.distance)));
        cue.root.hidden = false; cue.root.style.left = `${p.x}%`; cue.root.style.top = `${p.y}%`;
        const distance = Math.max(0, Math.ceil(e.distance-s.distance));
        cue.value.textContent = kind === 'shop' && reachableShop(s)?.id === e.id ? 'R · GHÉ' : `${distance} m`;
        cue.root.setAttribute('aria-label', `${kind === 'fuel' ? 'Xăng' : kind === 'repair' ? 'Sửa chữa' : 'Cửa hàng'} · ${distance} m`);
      }

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
    // Resource values/arcs remain the visible consequence; retain the live text for accessibility.
    document.getElementById('impact-cue')!.hidden = true;
    document.getElementById('impact-value')!.textContent = '';
    document.getElementById('impact-flavor')!.textContent = '';
  }
}
