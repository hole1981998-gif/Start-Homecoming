import './style.css';
import { balance } from './config';
import { FixedClock, noInput } from './simulation';
import { initialRun, names, stepRun } from './survival';
import { recordResult, saveSeen, seenCards, showFlavor, saveFlavor } from './persistence';
import { RoadRenderer } from './render';
import type { Entity, EntityKind } from './world';
import { developmentScenario } from './development';

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id); if (!node) throw new Error(`Missing UI: ${id}`); return node as T;
};
const text = (id: string, value: string) => { const node = el(id); if (node.textContent !== value) node.textContent = value; };
const canvas = el<HTMLCanvasElement>('scene'), modal = el('modal');
const play = el<HTMLButtonElement>('play'), pause = el<HTMLButtonElement>('pause'), restart = el<HTMLButtonElement>('restart');
const closeHelp = el<HTMLButtonElement>('close-help');
const formatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const speedFormatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const speedText = (speed: number) => speedFormatter.format(speed * 3.6);
const cruiseLabel = `${speedText(balance.cruiseSpeed)} km/h`;
text('cruise', `Trung vị · ${cruiseLabel}`); text('release-help', `Thả W/S: tự hồi về ${cruiseLabel}.`);
function newRun() {
  const run = initialRun(17, crypto.randomUUID());
  return import.meta.env.DEV ? developmentScenario(run, new URLSearchParams(location.search).get('scenario')) : run;
}
let state = newRun(), previous = state, input = noInput();
type Screen = 'start' | 'pause' | 'help' | 'card' | 'result' | null;
let screen: Screen = 'start';
let discovery: EntityKind | null = null, cardTimer: ReturnType<typeof setTimeout> | undefined;
let savedRunId = '';
const seen = seenCards(), clock = new FixedClock(), listeners = new AbortController();
const flavorToggle = el<HTMLInputElement>('flavor-toggle'); flavorToggle.checked = showFlavor();
flavorToggle.addEventListener('change', () => saveFlavor(flavorToggle.checked), { signal: listeners.signal });
let graphics: RoadRenderer;
try { graphics = new RoadRenderer(canvas, el('game')); }
catch (error) { el('error').hidden = false; modal.hidden = true; throw error; }

function clearInput(): void { input = noInput(); clock.reset(); previous = state; }
function show(view: Exclude<Screen, null>, title: string, description: string): void {
  screen = view; modal.hidden = false; clearInput();
  text('modal-title', title); text('modal-description', description);
  text('modal-label', view === 'card' ? 'DỪNG AN TOÀN · LẦN ĐẦU GẶP' : view === 'result' ? 'KẾT THÚC CHUYẾN ĐI' : 'PROTOTYPE 02 · SINH TỒN');
  el('instructions').hidden = !['start', 'help'].includes(view);
  el('result-summary').hidden = view !== 'result'; el('discovery-hint').hidden = view !== 'card';
  play.hidden = view === 'help'; closeHelp.hidden = view !== 'help';
  el('panel-help').hidden = !['pause', 'result'].includes(view);
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
  state = { ...state, phase: 'running' }; screen = null; modal.hidden = true; clearInput(); canvas.focus({ preventScroll: true });
}
function reset(): void {
  clearTimeout(cardTimer); discovery = null;
  state = newRun(); previous = state;
  show('start', 'Đường về nhà', `Giữ xe còn xăng và độ bền. Xe tự chạy ở ${cruiseLabel}; giữ W/S để chạy nhanh hoặc chậm hơn.`);
}
function resultView(): void {
  const result = state.result; if (!result) return;
  text('result-distance', `${Math.floor(result.distance)} m`); text('result-score', `${Math.floor(result.score)}`);
  text('result-money', formatter.format(result.money)); text('result-time', `${Math.floor(result.seconds / 60)}:${String(Math.floor(result.seconds % 60)).padStart(2, '0')}`);
  show('result', result.reason === 'fuel' ? 'Hết xăng, hết đà' : 'Xe không chạy tiếp được',
    result.reason === 'fuel' ? `Xe đã trôi thêm đủ ${balance.coastDistance} m sau khi hết xăng. Lượt sau hãy tìm bình xăng ven đường.` : 'Độ bền đã về 0 sau va chạm. Lượt sau hãy đọc cảnh báo và chừa thời gian đổi hướng.');
}
function openHelp(): void {
  pauseRun();
  show('help', 'Cách cầm lái', `Giữ W/S để nhanh/chậm hơn ${cruiseLabel}; thả hồi về mốc. Nước: thêm ${formatter.format(balance.waterFuelPerSecond)} L/s. Ổ gà: −${balance.potholeDamage} HP, tối đa −${balance.potholeMoneyLoss} tiền. Va xe: −${balance.trafficDamage} HP, cùng xe cách ${balance.trafficCooldown} giây. Bình xăng: tới +${balance.fuelPickup} L; hộp sửa: tới +${balance.repairPickup} HP. Hết xăng trôi thêm ${balance.coastDistance} m. Hết đà hoặc HP về 0 thì kết ván.`);
}
const cardDescriptions: Record<EntityKind, string> = {
  water: `Mảng nước phẳng trên đường làm hao thêm ${formatter.format(balance.waterFuelPerSecond)} L xăng mỗi giây tiếp xúc. Né sang làn còn trống; nước không trực tiếp trừ độ bền.`,
  pothole: `Ổ gà có viền vàng làm mất ${balance.potholeDamage} HP và tối đa ${balance.potholeMoneyLoss} tiền khi chạm. Một ổ chỉ gây hậu quả một lần; nhìn trước và lái sang khoảng trống.`,
  traffic: `Xe màu cam đang chạy ở làn giữa. Va chạm mất ${balance.trafficDamage} HP, cùng xe có hồi chiêu ${balance.trafficCooldown} giây. Hai bên đường còn lối để vượt.`,
  fuel: `Bình xăng đứng có quai: lái chạm để nhận tới ${balance.fuelPickup} L, không vượt sức chứa. Nhặt được khi đang trôi sẽ giúp xe chạy lại.`,
  repair: `Hộp trắng có dấu cộng: lái chạm để phục hồi tới ${balance.repairPickup} HP, không vượt độ bền tối đa. Đây là nhặt trực tiếp, chưa có kho vật phẩm.`,
};
function dismissCard(): void {
  if (discovery) { seen.add(discovery); saveSeen(seen); } discovery = null; clearTimeout(cardTimer);
  if (document.hidden || !document.hasFocus()) show('pause', 'Sẵn sàng tiếp tục?', 'Thẻ đã đóng. Chọn tiếp tục khi quay lại màn chơi.'); else resume();
}
function discover(): void {
  if (state.phase !== 'running') return;
  const candidate = state.world.entities.filter(e => !e.consumed && !seen.has(e.kind) && e.distance > state.distance &&
    e.distance - state.distance <= Math.max(60, state.speed * balance.warningSeconds)).sort((a, b) => a.distance - b.distance)[0];
  if (!candidate) return;
  discovery = candidate.kind; state = { ...state, phase: 'paused' };
  show('card', names[candidate.kind], cardDescriptions[candidate.kind]);
  text('discovery-hint', `Game đang tạm dừng. Bấm nút hoặc chờ ${balance.discoverySeconds} giây để đóng thẻ.`);
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
const mapping = { KeyW: 'accelerate', KeyS: 'brake', KeyA: 'left', KeyD: 'right' } as const;
window.addEventListener('keydown', event => {
  if (event.code === 'Escape' && !event.repeat) {
    event.preventDefault();
    if (screen === 'card') dismissCard(); else if (screen === 'help') closeHelp.click(); else if (state.phase === 'running') pauseRun(); else if (state.phase === 'paused') resume();
    return;
  }
  if (event.code === 'Tab' && !modal.hidden) {
    const buttons = [...modal.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input')].filter(b => !b.closest('[hidden]') && !b.disabled);
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (state.phase !== 'running' || document.activeElement !== canvas) return;
  if (['Space', 'Tab'].includes(event.code)) event.preventDefault();
  if (event.code in mapping) { event.preventDefault(); input[mapping[event.code as keyof typeof mapping]] = true; }
}, { signal: listeners.signal });
window.addEventListener('keyup', event => { if (event.code in mapping) input[mapping[event.code as keyof typeof mapping]] = false; }, { signal: listeners.signal });
window.addEventListener('blur', pauseRun, { signal: listeners.signal });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRun(); }, { signal: listeners.signal });
canvas.addEventListener('blur', event => {
  clearInput(); if (![pause, restart, el('help')].includes(event.relatedTarget as HTMLElement)) pauseRun();
}, { signal: listeners.signal });
canvas.addEventListener('click', () => { if (state.phase === 'running') canvas.focus(); }, { signal: listeners.signal });

const laneName = (x: number) => x < -1 ? 'trái' : x > 1 ? 'phải' : 'giữa';
const describe = (entity: Entity) => `${names[entity.kind]} · ${laneName(entity.x)} · ${Math.max(0, Math.ceil(entity.distance - state.distance))} m`;
function updateHud(): void {
  text('speed', speedText(state.phase === 'running' ? state.speed : 0)); text('distance', `${Math.floor(state.distance + 1e-8)}`);
  text('score', `${Math.floor(state.score + 1e-8)}`); text('money', formatter.format(state.money));
  const fuel = el<HTMLProgressElement>('fuel'), hp = el<HTMLProgressElement>('hp');
  fuel.max = balance.fuelCapacity; fuel.value = state.fuel; hp.max = balance.durabilityCapacity; hp.value = state.durability;
  text('fuel-value', `${speedFormatter.format(state.fuel)} / ${balance.fuelCapacity} L`);
  text('hp-value', `${state.durability} / ${balance.durabilityCapacity} HP`);
  fuel.parentElement?.classList.toggle('critical', state.fuel < 2); hp.parentElement?.classList.toggle('critical', state.durability < 25);
  text('drive-mode', state.phase !== 'running' ? state.phase === 'ready' ? 'Sẵn sàng' : state.phase === 'ended' ? 'Đã kết ván' : 'Đã tạm dừng' :
    state.motion === 'coasting' ? `Hết xăng · trôi ${Math.ceil(state.coastRemaining)} m` : input.brake ? 'Giữ S · hãm' : input.accelerate ? 'Giữ W · tăng' :
      Math.abs(state.speed - balance.cruiseSpeed) > 1e-8 ? 'Đang hồi về trung vị' : 'Tự chạy trung vị');
  const nearby = state.world.entities.filter(e => !e.consumed && e.distance + e.length / 2 >= state.distance && e.distance - state.distance <= Math.max(60, state.speed * balance.warningSeconds)).sort((a, b) => a.distance - b.distance);
  const hazard = nearby.find(e => !['fuel', 'repair'].includes(e.kind)), supply = nearby.find(e => ['fuel', 'repair'].includes(e.kind));
  text('warning-main', hazard ? describe(hazard) : 'Đường thoáng · quan sát phía trước');
  text('warning-supply', supply ? describe(supply) : '');
  text('feedback', state.activeSeconds - state.feedbackAt < 3 ? `${state.feedback}${flavorToggle.checked ? ` · ${state.feedbackFlavor}` : ''}` : '');
  pause.disabled = state.phase === 'ready' || state.phase === 'ended'; restart.disabled = state.phase === 'ready';
  pause.textContent = state.phase === 'paused' ? 'Tiếp tục' : 'Tạm dừng';
}
let last = performance.now(), animation = 0;
const diagnostics = new URLSearchParams(location.search).has('diagnostics');
const frameTimes: number[] = [], renderTimes: number[] = []; let measuredFrames = 0;
function frame(now: number): void {
  const elapsed = (now - last) / 1000; last = now; const start = performance.now();
  const alpha = state.phase === 'running' ? clock.advance(elapsed, () => { previous = state; state = stepRun(state, input); }) : 1;
  if (state.phase === 'ended' && screen !== 'result' && screen !== 'help') {
    if (state.result && savedRunId !== state.runId) { recordResult(state.result); savedRunId = state.runId; }
    resultView();
  } else discover();
  graphics.draw(state, previous, state.phase === 'running' ? alpha : 1);
  if (diagnostics && state.phase === 'running') {
    frameTimes.push(elapsed * 1000); renderTimes.push(performance.now() - start); measuredFrames++;
    if (frameTimes.length > 600) { frameTimes.shift(); renderTimes.shift(); }
    if (measuredFrames % 120 === 0) {
      const sorted = [...frameTimes].sort((a, b) => a - b);
      canvas.dataset.performance = JSON.stringify({ frames: measuredFrames, window: sorted.length,
        fps: 1000 / (frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length), frameP95Ms: sorted[Math.floor(sorted.length * .95)],
        meanRenderCpuMs: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length });
    }
  }
  updateHud(); animation = requestAnimationFrame(frame);
}
reset(); updateHud(); animation = requestAnimationFrame(frame);
if (import.meta.hot) import.meta.hot.dispose(() => { cancelAnimationFrame(animation); listeners.abort(); clearTimeout(cardTimer); graphics.dispose(); });
