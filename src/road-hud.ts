import { trainClosed, bananaTarget } from './special-events';
import { createElement, Wind, Waves, CircleDot, CarFront, Package, Fuel, Wrench, ChevronDown, UserRound, Store, ShieldAlert, TrainFront, TriangleAlert, Ban } from 'lucide';
import { balance, shopBalance } from './config';
import { reachableShop } from './shop';
import { activeVehicle, names, type Run } from './survival';
import { trafficTypes, warningDistance, type EntityKind } from './world';

interface Projection { project(x: number, y: number, z: number): { x: number; y: number } }
const icons = { wind: Wind, water: Waves, pothole: CircleDot, traffic: CarFront, cargo: Package, fuel: Fuel, repair: Wrench, passenger: UserRound, shop: Store, police: ShieldAlert, militia: ShieldAlert, train: TrainFront, accident: TriangleAlert, jam: Ban, broken: Wrench };
const supplyKind = (kind: EntityKind) => kind === 'fuel' || kind === 'repair' || kind === 'passenger' || kind === 'shop';
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
      (e.kind === 'shop' ? e.distance + shopBalance.reach >= s.distance : e.kind === 'passenger' ? e.distance + balance.passengerReach >= s.distance : e.distance + e.length / 2 >= s.distance) &&
      e.distance - s.distance <= warningDistance(s.speed, e, activeVehicle(s).length)).sort((a, b) => a.distance - b.distance);
    const hazard = nearby.find(e => !supplyKind(e.kind));
    const supply = reachableShop(s) ?? nearby.find(e => e.kind === 'passenger' && Math.abs(e.distance - s.distance) <= balance.passengerReach &&
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
      cue.value.textContent = e.kind === 'shop' && reachableShop(s)?.id === e.id ? 'R · GHÉ' : e.kind === 'passenger' && Math.abs(e.distance - s.distance) <= balance.passengerReach &&
        Math.abs(e.x - s.x) <= balance.passengerLateralReach ? 'F · ĐÓN' : `${distance} m`;
      if (e.lateralPush) cue.value.textContent = (e.lateralPush>0? Math.abs(e.lateralPush)>=1.8?'→→':'→' : Math.abs(e.lateralPush)>=1.8?'←←':'←') + ' · ' + distance + ' m';
      if (e.kind === 'train') cue.value.textContent = e.crossMotion ?
        (trainClosed(e, s.activeSeconds) ? (e.crossMotion.velocity < 0 ? '← · S CHỜ' : '→ · S CHỜ') :
          e.x * e.crossMotion.velocity < 0 ? 'S · TÀU SẮP TỚI' : '↑ · ĐƯỜNG MỞ') :
        trainClosed(e, s.activeSeconds) ? 'S · DỪNG' : '↑ · ĐƯỜNG MỞ';
      if (e.stunned) cue.value.textContent = '✓ · VÔ HẠI';
      if ((e.kind === 'police' || e.kind === 'militia') && bananaTarget(s)?.id === e.id) {
        const slot = s.inventory.indexOf('banana');
        cue.value.textContent = (slot >= 0 ? (slot + 1) + ' · CHUỐI' : e.kind === 'police' ? '300 · TỊCH THU' : '100') + ' · ' + distance + ' m';
      }
      const lane = e.x < -1 ? 'trái' : e.x > 1 ? 'phải' : 'giữa';
      const trafficState = e.trafficStoppedByCollision ? 'dừng sau va chạm' : e.trafficMotion === 'stopped' ? 'đã dừng vì hết xăng' :
        e.trafficMotion === 'coasting' ? 'đang trôi do hết xăng' : e.speed < 0 ? 'ngược chiều' : 'cùng chiều';
      if (e.kind === 'traffic') cue.root.querySelector('.traffic-direction')!.textContent =
        e.trafficStoppedByCollision ? '✕ · ■' : e.trafficMotion === 'stopped' ? '⛽ · ■' : `${e.trafficMotion === 'coasting' ? '⛽ · ' : ''}${e.speed < 0 ? '↓' : '↑'}`;
      if (e.kind === 'traffic' && e.cargoReleaseAt !== undefined && !e.cargoDropped)
        cue.value.textContent = `⚠ ĐỒ SẮP RƠI · ${distance} m`;
      if (e.kind === 'cargo') cue.value.textContent = `${(e.cargoVelocityX ?? 0) > 0 ? '→' : '←'} · ${distance} m`;
      const label = e.displayName ?? (e.kind === 'traffic' ? trafficTypes[e.trafficKind ?? 'car4'].name : e.kind === 'passenger' && e.passengerType === 'grab' ? 'Khách Grab' : names[e.kind]);
      if (e.kind === 'passenger' && e.passengerType === 'grab') cue.value.textContent = 'Grab · ' + cue.value.textContent;
      cue.root.setAttribute('aria-label', `${label} · ${lane}${e.kind === 'traffic' ? ` · ${trafficState}` : ''} · ${distance} m`);
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
