import './style.css';
import './ui-flat.css';
import { prepareContentIcons, renderItemSlots } from './ui-icons';
import { prepareUiShell } from './ui-shell';
import { discoveryCards, discoveryCategory, readDiscoveries, saveDiscoveries, discoveryIllustration, type Discovery } from './discovery';
import { balance } from './config';
import { FixedClock, noInput } from './simulation';
import { activeVehicle, dropPassenger, initialRun, passengerDrive, pickUpPassenger, selectTurn, stepRun, switchVehicle } from './survival';
import { canChoose, junction, junctionWindow } from './route';
import { leaderboard, recordResult, showFlavor, saveFlavor } from './persistence';
import { RoadRenderer } from './render';
import { warningDistance } from './world';
import { developmentScenario } from './development';
import { createIcons, Fuel, Wrench, Trophy, Coins, Pause, CircleHelp, RotateCcw, CircleAlert, UsersRound, Menu } from 'lucide';
import { RoadHud } from './road-hud';
import { vehicles } from './vehicles';
import { enterShop, leaveShop, transact } from './shop';
import { hasBoost, hasStar, itemNames, requestJump, usePowerItem } from './items';
import { ShopView } from './shop-view';
import type { ForceIntegration } from './force-integration';
import { runtimeMode } from './runtime-mode';
prepareUiShell();
prepareContentIcons();
createIcons({ icons: { Fuel, Wrench, Trophy, Coins, Pause, CircleHelp, RotateCcw, CircleAlert, UsersRound, Menu } });

const version = runtimeMode(location.pathname);
const isMainGame = version === 'force' && !location.pathname.endsWith('/ver.force.html');
const ForceIntegrationCtor = version === 'force' ? (await import('./force-integration')).ForceIntegration : null;
let force: ForceIntegration | null = ForceIntegrationCtor ? new ForceIntegrationCtor() : null;

const el = <T extends Element = HTMLElement>(id: string): T => {
  const node = document.getElementById(id); if (!node) throw new Error(`Missing UI: ${id}`); return node as unknown as T;
};
const text = (id: string, value: string) => { const node = el(id); if (node.textContent !== value) node.textContent = value; };
const canvas = el<HTMLCanvasElement>('scene'), modal = el('modal');
const play = el<HTMLButtonElement>('play'), pause = el<HTMLButtonElement>('pause'), restart = el<HTMLButtonElement>('restart');
const versionLink = document.createElement('a');
versionLink.className = 'version-link';
versionLink.textContent = isMainGame ? 'Mở bản backup ver.noforce' : version === 'force' ? 'Chuyển sang ver.noforce' : 'Chuyển sang ver.force';
versionLink.href = `${version === 'force' ? '/ver.noforce.html' : '/ver.force.html'}${location.search}`;
const modalVersionLink = versionLink.cloneNode(true) as HTMLAnchorElement;
modalVersionLink.className = 'modal-version-link';
el('modal-title').after(modalVersionLink);
const helpDetails = document.createElement('section');
helpDetails.id = 'help-details'; helpDetails.hidden = true;
el('instructions').after(helpDetails);
const testHome = document.createElement('a'); testHome.href = '/p61.html';
testHome.textContent = '← Bộ tình huống P6.1'; testHome.className = 'test-home-link';
testHome.hidden = true; modal.querySelector('.panel')!.append(testHome);
const closeHelp = el<HTMLButtonElement>('close-help');
const formatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const fuelRateFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const speedFormatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const speedText = (speed: number) => speedFormatter.format(speed * 3.6);
text('release-help', 'Thả W/S: xe tự hồi về tốc độ trung vị riêng của xe.');
function newRun() {
  const params = new URLSearchParams(location.search);
  const scenario = import.meta.env.DEV ? params.get('scenario') : null;
  const requestedSeed = import.meta.env.DEV && params.has('seed') ? Number(params.get('seed')) : NaN;
  const seed = Number.isSafeInteger(requestedSeed) && requestedSeed >= 0 && requestedSeed <= 0xffffffff ?
    requestedSeed : scenario?.startsWith('passenger-crash') ? 17 : crypto.getRandomValues(new Uint32Array(1))[0];
  const run = initialRun(seed, crypto.randomUUID(), version === 'noforce' ? 'backup' : undefined);
  return import.meta.env.DEV ? developmentScenario(run, scenario, Number(params.get('start') ?? 0)) : run;
}
let state = newRun(), previous = state, input = noInput();
type Screen = 'start' | 'pause' | 'help' | 'card' | 'result' | 'shop' | null;
let screen: Screen = 'start';
let discovery: Discovery | null = null, cardTimer: ReturnType<typeof setTimeout> | undefined;
let savedRunId = '';
const seen = readDiscoveries(), clock = new FixedClock(), listeners = new AbortController();
const flavorToggle = el<HTMLInputElement>('flavor-toggle'); flavorToggle.checked = showFlavor();
flavorToggle.addEventListener('change', () => saveFlavor(flavorToggle.checked), { signal: listeners.signal });
const effectsToggle = document.querySelector<HTMLInputElement>('#effects-toggle');
if (effectsToggle) {
  try { effectsToggle.checked = localStorage.getItem('homecoming-low-effects') === 'true'; } catch { /* Optional preference. */ }
  if (new URLSearchParams(location.search).get('fx') === 'low') effectsToggle.checked = true;
  effectsToggle.addEventListener('change', () => {
    graphics.setLowEffects(effectsToggle.checked);
    try { localStorage.setItem('homecoming-low-effects', String(effectsToggle.checked)); } catch { /* Session still works. */ }
  }, { signal: listeners.signal });
}
const roadHud = new RoadHud(el('world-cues'));
const shopView = new ShopView(el('shop-panel'), () => state, command => {
  const result = transact(state, command); state = result.run; previous = state;
  text('shop-status', result.message);
});
function openShop(): void {
  const next = enterShop(state); if (next === state) return;
  state = next; shopView.reset();
  show('shop', 'Cửa hàng ven đường', 'Tiếp tế rồi lên đường.');
  text('shop-status', 'Đã dừng an toàn.'); shopView.render();
}
let graphics: RoadRenderer;
try { graphics = new RoadRenderer(canvas, el('game'), version === 'force'); }
catch (error) { el('error').hidden = false; modal.hidden = true; throw error; }
graphics.setLowEffects(effectsToggle?.checked ?? false);

function clearInput(): void { input = noInput(); clock.reset(); previous = state; }
function show(view: Exclude<Screen, null>, title: string, description: string): void {
  screen = view; modal.hidden = false; modal.setAttribute('data-view', view); setMenu(false); clearInput();
  el('discovery-art').hidden = view !== 'card';
  el('quick-start').hidden = view !== 'start';
  versionLink.hidden = true;
  modalVersionLink.hidden = view === 'help' || view === 'card';
  testHome.hidden = !state.world.prototype || state.world.prototype.version.startsWith('force-');
  modal.querySelector('.panel')!.scrollTop = 0;
  text('modal-title', title); text('modal-description', description);
  text('modal-label', view === 'card' ? 'DỪNG AN TOÀN · LẦN ĐẦU GẶP' : view === 'result' ? 'KẾT THÚC CHUYẾN ĐI' : state.world.stress ? 'P6.1 · STRESS TEST · KHÔNG CÂN BẰNG' : state.world.prototype ? state.world.prototype.version.startsWith('force-tail-') ? `ver.${version} · THỬ ĐIỀU KHIỂN XE LỚN` : state.world.prototype.version.startsWith('force-npc-') ? `ver.${version} · THỬ VA CHẠM NPC` : state.world.prototype.version.startsWith('force-car-') ? `ver.${version} · THỬ VA CHẠM XE` : state.world.prototype.version.startsWith('handling-') ? 'THỬ ĐỘ BÁM VÀ QUÁN TÍNH' : state.world.prototype.version.startsWith('p8-') ? 'P8 · THỬ CÂN BẰNG' : state.world.prototype.version.startsWith('p7-') ? 'P7 · THỬ KẾT VÁN' : state.world.prototype.version.startsWith('p63-') ? 'P6.3 · THỬ ĐỒ RƠI' : state.world.prototype.version.startsWith('p62-') ? 'P6.2 · THỬ LỰC NGANG' : 'P6.1 · THỬ TÌNH HUỐNG RIÊNG' : 'CHUYẾN ĐI CỦA BẠN');
  el('shop-panel').hidden = view !== 'shop'; el('shop-status').hidden = view !== 'shop';
  el('instructions').hidden = view !== 'help';
  helpDetails.hidden = view !== 'help';
  if (view === 'help') el('modal-title').after(closeHelp); else play.after(closeHelp);
  el('result-summary').hidden = view !== 'result'; el('discovery-hint').hidden = view !== 'card';
  el('result-badge').hidden = view !== 'result' || state.result?.reason !== 'secret';
  el('leaderboard').hidden = view !== 'result';
  el('effects-toggle').parentElement!.hidden = !['pause', 'help', 'start'].includes(view);
  play.hidden = view === 'help'; closeHelp.hidden = view !== 'help';
  el('panel-help').hidden = !['pause', 'result', 'start'].includes(view);
  el('panel-restart').hidden = view !== 'pause';
  el('feedback-options').hidden = !['pause', 'help', 'result'].includes(view);
  play.textContent = view === 'card' ? 'Đã hiểu · tiếp tục' : view === 'result' ? 'Chơi lại' : view === 'start' ? 'Bắt đầu lái' : 'Tiếp tục lái';
  (view === 'help' ? closeHelp : play).focus({ preventScroll: true });
}
function pauseRun(): void {
  if (state.phase !== 'running') return;
  state = { ...state, phase: 'paused' };
  show('pause', 'Nghỉ một nhịp', 'Xe đã dừng an toàn. Xăng, điểm và tiền không thay đổi khi tạm dừng.');
}
function resume(): void {
  if (document.hidden || state.phase === 'ended') return;
  setMenu(false); state = { ...leaveShop(state), phase: 'running' }; screen = null; modal.hidden = true;
  clearInput(); canvas.focus({ preventScroll: true });
}
function reset(): void {
  clearTimeout(cardTimer); discovery = null;
  force = ForceIntegrationCtor ? new ForceIntegrationCtor() : null;
  state = newRun(); previous = state;
  if (state.world.prototype) {
    testHome.href = state.world.prototype.version.startsWith('p8-') ? '/' : '/p61.html';
    testHome.textContent = state.world.prototype.version.startsWith('p8-') ? '← Bản chính' : '← Bộ tình huống P6.1';
    document.title = (state.world.prototype.version.startsWith('force-') ? `ver.${version} · ` : state.world.prototype.version.startsWith('handling-') ? '' : state.world.prototype.version.startsWith('p8-') ? 'P8 · ' : state.world.prototype.version.startsWith('p7-') ? 'P7 · ' : state.world.prototype.version.startsWith('p63-') ? 'P6.3 · ' : state.world.prototype.version.startsWith('p62-') ? 'P6.2 · ' : 'P6.1 · ') + state.world.prototype.title;
    const description = version === 'noforce' && state.world.prototype.version.startsWith('force-tail-') ?
      'Bản đối chiếu: xe giữ thân một khối, không có trục sau/khớp nối riêng. Giữ D để so cùng tình huống với ver.force.' :
      state.world.prototype.description;
    show('start', state.world.prototype.title, description + ' W/S điều tốc, A/D lái, 1/2 dùng vật phẩm, Space nhảy khi nitro bật; Esc tạm dừng. Vật phẩm và xe dự phòng mẫu không dùng để đánh giá economy.');
    el('instructions').hidden = true;
    return;
  }
  document.title = isMainGame ? 'Đường Về Nhà' : `ver.${version} · Đường Về Nhà`;
  show('start', 'Đường về nhà', `${isMainGame ? 'Giữ vững tay lái giữa cơn mưa. Đón người đi nhờ, tìm xăng và chọn lối về nhà.' : `ver.${version}: bản đối chiếu điều khiển, chọn cùng seed để so sánh.`}${state.vehicleInstances.length > 1 ? ` Bản thử có thêm ${vehicles[state.vehicleInstances[1].kind].name}.` : ''}`);
}
function resultView(): void {
  const result = state.result; if (!result) return;
  if (savedRunId !== state.runId && recordResult(result)) savedRunId = state.runId;
  text('result-distance', `${Math.floor(result.distance)} m`); text('result-score', `${Math.floor(result.score)}`);
  text('result-money', formatter.format(result.money)); text('result-time', `${Math.floor(result.seconds / 60)}:${String(Math.floor(result.seconds % 60)).padStart(2, '0')}`);
  show('result', result.reason === 'secret' ? 'Đã về nhà!' : result.reason === 'train' ? 'Va chạm tàu hoả' : result.reason === 'police' ? 'Xe bị tịch thu' : result.reason === 'fuel' ? 'Hết xăng, hết đà' : 'Xe không chạy tiếp được',
    result.reason === 'secret' ? 'Bạn đã hoàn tất chuỗi bí mật và nhận huy hiệu Đã về nhà.' :
      result.reason === 'train' ? 'Tàu luôn kết thúc ván khi va chạm. Giữ S chờ mở đường hoặc nhảy bằng nitro + Space.' : result.reason === 'police' ? 'Không còn xe dự phòng hợp lệ. Dùng chuối trong cửa sổ cảnh báo ở lượt sau.' : result.reason === 'fuel' ? `Xe đã trôi thêm đủ ${balance.coastDistance} m sau khi hết xăng. Lượt sau hãy tìm bình xăng ven đường.` : 'Độ bền đã về 0 sau va chạm. Lượt sau hãy đọc cảnh báo và chừa thời gian đổi hướng.');
  const list = el<HTMLOListElement>('leaderboard-list'); list.replaceChildren();
  const boardVersion = result.scoreVersion ?? 'legacy-v1';
  text('leaderboard-title', boardVersion === 'speed-v1' ? 'Bảng điểm tốc độ · trên máy này' : 'Bảng điểm cũ · trên máy này');
  for (const [index, entry] of leaderboard(boardVersion).slice(0, 5).entries()) {
    const row = document.createElement('li');
    row.textContent = `${index + 1}. ${Math.floor(entry.score)} điểm · ${Math.floor(entry.distance)} m${entry.reason === 'secret' ? ' · ⌂' : ''}`;
    list.append(row);
  }
  const legacy = boardVersion === 'speed-v1' ? leaderboard('legacy-v1').slice(0, 3) : [];
  el('legacy-board').hidden = legacy.length === 0;
  const oldList = el<HTMLOListElement>('legacy-list'); oldList.replaceChildren();
  for (const entry of legacy) {
    const row = document.createElement('li');
    row.textContent = `${Math.floor(entry.score)} điểm · ${Math.floor(entry.distance)} m`;
    oldList.append(row);
  }
}
function openHelp(): void {
  if (state.shopId) state = leaveShop(state);
  pauseRun();
  const vehicle = activeVehicle(state);
  helpDetails.replaceChildren();
  for (const [title, description] of [
    [vehicle.name, `${vehicle.capacity} chỗ, tính cả tài xế · bình ${formatter.format(vehicle.fuelCapacity)} L · hao ${fuelRateFormatter.format(vehicle.fuelPerMeter * 100)} L/100 m. Trung vị khi trống ${formatter.format(vehicle.cruiseSpeed * 3.6)} km/h; thêm khách làm giảm trung vị, quá tải tăng hao xăng.`],
    ['Đường và phục hồi', `Nước hao xăng; ổ gà trừ HP khi tiếp xúc; va xe có thể làm ngã. Trong lúc ngã, trôi và quay lại, xe miễn tác động xấu; tàu vẫn kết ván khi va chạm. Hết xăng trôi thêm ${balance.coastDistance} m. HP về 0 hoặc hết đà: tự đổi sang xe còn chạy được, nếu có.`],
    ['Vật phẩm', 'Phím 1/2 dùng ô tương ứng. Grab gọi khách phía trước, cần F để đón. Space chỉ nhảy khi nitro đang bật; nitro không vượt xe cao. Star không bỏ qua sự kiện.'],
  ]) {
    const section = document.createElement('section'), heading = document.createElement('h2'), copy = document.createElement('p');
    heading.textContent = title; copy.textContent = description; section.append(heading, copy); helpDetails.append(section);
  }
  show('help', 'Cách cầm lái', 'Game đã tạm dừng. Xem lại phím và luật chơi rồi quay lại khi sẵn sàng.');
}
function dismissCard(): void {
  if (discovery) { seen.add(discovery); saveDiscoveries(seen); } discovery = null; clearTimeout(cardTimer);
  if (document.hidden || !document.hasFocus()) show('pause', 'Sẵn sàng tiếp tục?', 'Chọn tiếp tục khi quay lại màn chơi.'); else resume();
}
function discover(): void {
  if (state.phase !== 'running' || state.crash) return;
  // No discovery overlay over an active turn decision. Freeze before showing a card.
  const next = junction(state.seed, state.route.index);
  if (next.distance - state.distance >= 0 && next.distance - state.distance <= Math.max(70, state.speed * 4)) return;
  const item = state.inventory.find(value => value !== null && !seen.has(value));
  const candidate = state.world.entities.filter(e => !e.consumed && (e.kind !== 'passenger' || e.pickupable !== false) &&
    discoveryCategory(e.kind) !== null && !seen.has(discoveryCategory(e.kind)!) && e.distance > state.distance &&
    e.distance - state.distance <= warningDistance(state.speed, e, activeVehicle(state).length)).sort((a, b) => a.distance - b.distance)[0];
  const key = item ?? (candidate ? discoveryCategory(candidate.kind) : null);
  if (!key) return;
  discovery = key; state = { ...state, phase: 'paused' };
  show('card', discoveryCards[key].title, discoveryCards[key].copy);
  el('discovery-art').replaceChildren(discoveryIllustration(key));
  text('discovery-hint', 'Đã dừng an toàn · chỉ giới thiệu một lần.');
  cardTimer = setTimeout(dismissCard, balance.discoverySeconds * 1000);
}
play.addEventListener('click', () => {
  if (screen === 'card') dismissCard(); else if (screen === 'result') { reset(); resume(); } else resume();
}, { signal: listeners.signal });
pause.addEventListener('click', () => state.phase === 'running' ? pauseRun() : resume(), { signal: listeners.signal });
restart.addEventListener('click', reset, { signal: listeners.signal });
el('panel-restart').addEventListener('click', reset, { signal: listeners.signal });
el('help').addEventListener('click', openHelp, { signal: listeners.signal });
el('panel-help').addEventListener('click', openHelp, { signal: listeners.signal });
closeHelp.addEventListener('click', () => {
  if (state.phase === 'ended') resultView(); else if (state.phase === 'ready') reset(); else show('pause', 'Nghỉ một nhịp', 'Chọn tiếp tục khi bạn sẵn sàng.');
}, { signal: listeners.signal });
const menu = el('controls-menu'), menuToggle = el<HTMLButtonElement>('controls-toggle'), menuPanel = el('controls-panel');
function setMenu(open: boolean): void {
  menuPanel.hidden = !open; menuToggle.setAttribute('aria-expanded', String(open));
}
menuToggle.setAttribute('aria-keyshortcuts', 'M');
menuToggle.title = 'Điều khiển và menu · M';
menuToggle.addEventListener('click', () => { const open = menuPanel.hidden; setMenu(open); if (!open && state.phase === 'running') canvas.focus({preventScroll:true}); }, { signal: listeners.signal });
menu.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') setMenu(true); }, { signal: listeners.signal });
menu.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') setMenu(false); }, { signal: listeners.signal });
menu.addEventListener('focusin', event => { if (event.target !== menuToggle) setMenu(true); }, { signal: listeners.signal });
menu.addEventListener('focusout', event => { if (!menu.contains(event.relatedTarget as Node)) setMenu(false); }, { signal: listeners.signal });
document.addEventListener('pointerdown', event => { if (!menu.contains(event.target as Node)) setMenu(false); }, { signal: listeners.signal });
menu.addEventListener('keydown', event => {
  if (event.code === 'Escape') { event.stopPropagation(); setMenu(false); if (state.phase === 'running') canvas.focus({preventScroll:true}); else menuToggle.focus(); setMenu(false); }
}, { signal: listeners.signal });
const mapping = { KeyW: 'accelerate', KeyS: 'brake', KeyA: 'left', KeyD: 'right' } as const;
window.addEventListener('keydown', event => {
  if (event.code === 'KeyM' && modal.hidden && !event.repeat) { event.preventDefault(); const open = menuPanel.hidden; if (open) menuToggle.focus(); else canvas.focus({preventScroll:true}); setMenu(open); return; }
  if (event.code === 'Escape' && !event.repeat) {
    event.preventDefault();
    if (screen === 'card') dismissCard(); else if (screen === 'help') closeHelp.click(); else if (state.phase === 'running') pauseRun(); else if (state.phase === 'paused') resume();
    return;
  }
  if (event.code === 'Tab' && !modal.hidden) {
    const buttons = [...modal.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLAnchorElement>('button,input,select,a[href],summary')].filter(b => !b.closest('[hidden]') && !('disabled' in b && b.disabled));
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (state.phase !== 'running' || document.activeElement !== canvas) return;
  if (['Space', 'Tab'].includes(event.code)) event.preventDefault();
  if (!event.repeat && event.code === 'Space') { state = requestJump(state); return; }
  if (!event.repeat && event.code === 'KeyR') { event.preventDefault(); openShop(); return; }
  if (!event.repeat && ['Digit1', 'Digit2', 'Numpad1', 'Numpad2'].includes(event.code)) {
    event.preventDefault(); state = usePowerItem(state, event.code.endsWith('1') ? 0 : 1); return;
  }
  if (!event.repeat && event.code === 'Tab') { state = switchVehicle(state); return; }
  if (!event.repeat && event.code === 'KeyF') { state = pickUpPassenger(state); return; }
  if (!event.repeat && event.code === 'KeyG') { state = dropPassenger(state); return; }
  if (!event.repeat && (event.code === 'KeyQ' || event.code === 'KeyE')) {
    event.preventDefault(); state = selectTurn(state, event.code === 'KeyQ' ? 'left' : 'right'); return;
  }
  if (event.code in mapping) { event.preventDefault(); input[mapping[event.code as keyof typeof mapping]] = true; }
}, { signal: listeners.signal });
window.addEventListener('keyup', event => { if (event.code in mapping) input[mapping[event.code as keyof typeof mapping]] = false; }, { signal: listeners.signal });
window.addEventListener('blur', pauseRun, { signal: listeners.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRun(); }, { signal: listeners.signal });
canvas.addEventListener('blur', event => {
  clearInput(); if (!menu.contains(event.relatedTarget as Node)) pauseRun();
}, { signal: listeners.signal });
canvas.addEventListener('click', () => { if (state.phase === 'running') canvas.focus(); }, { signal: listeners.signal });

function updateHud(): void {
  const vehicle = activeVehicle(state);
  const nextJunction = junction(state.seed, state.route.index);
  const approach = nextJunction.distance - state.distance;
  const junctionCue = el('junction-cue');
  junctionCue.hidden = state.phase !== 'running' || !!state.crash || approach < 0 || approach > Math.max(70, state.speed * 4);
  el('junction-branches').hidden = junctionCue.hidden;
  if (!junctionCue.hidden) {
    const activeChoice = canChoose(state.distance, state.speed, nextJunction, vehicle.kind, state.route.window);
    junctionCue.classList.toggle('active', activeChoice);
    junctionCue.classList.toggle('forced', nextJunction.blockedStraight);
    const closeDistance = state.route.window?.index === nextJunction.index ? state.route.window.closeDistance :
      junctionWindow(nextJunction, state.speed, vehicle.kind).closeDistance;
    text('junction-distance', activeChoice ? `${Math.max(0, (closeDistance - state.distance) / Math.max(state.speed, 1)).toFixed(1)} s` : `${Math.ceil(approach)} m`);
    text('junction-message', state.route.choice ? state.route.choice === 'left' ? 'ĐÃ CHỌN TRÁI' : 'ĐÃ CHỌN PHẢI' :
      !activeChoice ? state.route.window?.closed ? 'ĐÃ HẾT CỬA RẼ' : 'SẮP TỚI GIAO LỘ' :
        nextJunction.blockedStraight ? 'RẼ NGAY · ĐƯỜNG THẲNG CHẶN' : 'CHỌN LỐI');
    el('junction-left').classList.toggle('selected', state.route.choice === 'left');
    el('junction-right').classList.toggle('selected', state.route.choice === 'right');
    for (const [id, side] of [['junction-left', -1], ['junction-right', 1]] as const) {
      const target = graphics.project(side * 5.2, 0.6, -(approach + 2));
      const cue = el<HTMLElement>(id);
      cue.style.left = `${Math.max(side < 0 ? 12 : 64, Math.min(side < 0 ? 36 : 88, target.x))}%`;
      cue.style.top = `${Math.max(40, Math.min(52, target.y))}%`;
    }
  }
  text('speed', speedText(state.phase === 'running' ? state.speed : 0)); text('distance', `${Math.floor(state.distance + 1e-8)}`);
  text('score', `${Math.floor(state.score + 1e-8)}`); text('money', formatter.format(state.money));
  const occupants = state.crash ? 0 : state.riderIds.length + 1;
  text('rider-count', `${occupants}/${vehicle.capacity}`);
  text('vehicle-name', vehicle.name);
  const effects = [hasBoost(state) ? '↟ NITRO ' + Math.max(0, state.powers.boostUntil - state.activeSeconds).toFixed(1) + 's' : '',
    hasStar(state) ? '☆ STAR ' + Math.max(0, state.powers.starUntil - state.activeSeconds).toFixed(1) + 's' : ''].filter(Boolean);
  el('item-cue').hidden = !state.inventory.some(Boolean) && effects.length === 0;
  renderItemSlots(el('item-cue'), state.inventory, state.grabUses, effects);
  el('item-cue').setAttribute('aria-label', state.inventory.map((item, i) => 'Phím ' + (i + 1) + ': ' + (item ? itemNames[item] + (item === 'grab' ? ', còn ' + state.grabUses[i] + ' lượt' : '') : 'trống')).join('; ') + '; ' + effects.join('; '));
  el('rider-count').setAttribute('aria-label', `${occupants} người trên xe gồm tài xế, sức chứa ${vehicle.capacity}`);
  el('rider-count').classList.toggle('overloaded', state.riderIds.length + 1 > vehicle.capacity);
  const fuel = el<HTMLProgressElement>('fuel'), hp = el<HTMLProgressElement>('hp');
  fuel.max = vehicle.fuelCapacity; fuel.value = state.fuel; hp.max = vehicle.durabilityCapacity; hp.value = state.durability;
  el<SVGPathElement>('fuel-arc').style.strokeDasharray = `${Math.max(0, Math.min(100, state.fuel / vehicle.fuelCapacity * 100))} 100`;
  el<SVGPathElement>('hp-arc').style.strokeDasharray = `${Math.max(0, Math.min(100, state.durability / vehicle.durabilityCapacity * 100))} 100`;
  text('fuel-value', `${speedFormatter.format(state.fuel)} L`);
  text('hp-value', `${Math.ceil(state.durability - 1e-8)} HP`);
  fuel.parentElement?.classList.toggle('critical', state.fuel < 2); hp.parentElement?.classList.toggle('critical', state.durability < 25);
  el('fuel-arc').classList.toggle('critical', state.fuel < 2);
  el('hp-arc').classList.toggle('critical', state.durability < 25);
  text('drive-mode', state.phase !== 'running' ? state.phase === 'ready' ? 'Sẵn sàng' : state.phase === 'ended' ? 'Đã kết ván' : 'Đã tạm dừng' :
    state.crash ? state.speed > 0 ? 'Xe đang trôi · tài xế quay lại · miễn nhiễm' : 'Tài xế đang quay lại xe · miễn nhiễm' :
    state.recovering ? 'Đang tăng tốc lại' :
    state.motion === 'coasting' ? `Hết xăng · trôi ${Math.ceil(state.coastRemaining)} m` : input.brake ? 'Giữ S · hãm' : hasBoost(state) ? 'Nitro boost' : input.accelerate ? 'Giữ W · tăng' :
      Math.abs(state.speed - passengerDrive(state.riderIds.length, vehicle).cruiseSpeed) > 1e-8 ? 'Đang hồi về trung vị' : 'Tự chạy trung vị');
  roadHud.update(state, graphics, flavorToggle.checked);
  pause.disabled = state.phase === 'ready' || state.phase === 'ended'; restart.disabled = state.phase === 'ready';
  pause.setAttribute('aria-label', state.phase === 'paused' ? 'Tiếp tục' : 'Tạm dừng');
  pause.title = state.phase === 'paused' ? 'Tiếp tục · Esc' : 'Tạm dừng · Esc';
}
let last = performance.now(), animation = 0;
const diagnostics = new URLSearchParams(location.search).has('diagnostics');
const frameTimes: number[] = [], renderTimes: number[] = []; let measuredFrames = 0;
let diagnosticRunId = '';
const diagnosticSamples: unknown[] = [];
function frame(now: number): void {
  const elapsed = (now - last) / 1000; last = now; const start = performance.now();
  const alpha = state.phase === 'running' ? clock.advance(elapsed, () => { previous = state; state = force ? force.step(state, input) : stepRun(state, input); }) : 1;
  if (state.phase === 'ended' && screen !== 'result' && screen !== 'help') {
    resultView();
  } else discover();
  graphics.draw(state, previous, state.phase === 'running' ? alpha : 1, input);
  if (diagnostics && diagnosticRunId !== state.runId) {
    diagnosticRunId = state.runId; measuredFrames = 0;
    frameTimes.length = renderTimes.length = diagnosticSamples.length = 0;
    delete canvas.dataset.performance; delete canvas.dataset.performanceSamples;
  }
  if (diagnostics && state.phase === 'running') {
    frameTimes.push(elapsed * 1000); renderTimes.push(performance.now() - start); measuredFrames++;
    if (frameTimes.length > 600) { frameTimes.shift(); renderTimes.shift(); }
    if (measuredFrames % 120 === 0) {
      const sorted = [...frameTimes].sort((a, b) => a - b);
      const sample = { frames: measuredFrames, window: sorted.length, distance: state.distance, seed: state.seed,
        fps: 1000 / (frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length), frameP95Ms: sorted[Math.floor(sorted.length * .95)],
        meanRenderCpuMs: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
        ...graphics.renderStats() };
      canvas.dataset.performance = JSON.stringify(sample);
      diagnosticSamples.push(sample);
      if (diagnosticSamples.length > 16) diagnosticSamples.shift();
      canvas.dataset.performanceSamples = JSON.stringify(diagnosticSamples);
    }
  }
  updateHud(); animation = requestAnimationFrame(frame);
  canvas.dataset.forceContacts = `${force?.contactPairs ?? 0}`;
}
reset(); updateHud(); animation = requestAnimationFrame(frame);
if (import.meta.hot) import.meta.hot.dispose(() => { cancelAnimationFrame(animation); listeners.abort(); clearTimeout(cardTimer); graphics.dispose(); });
