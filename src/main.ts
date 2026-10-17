import './style.css';
import { FixedClock, initialState, noInput, step, type State } from './simulation';
import { RoadRenderer } from './render';
import { balance } from './config';
const element = <T extends HTMLElement>(id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing UI: ${id}`);
  return el as T;
};
const canvas = element<HTMLCanvasElement>('scene');
const modal = element('modal');
const play = element<HTMLButtonElement>('play');
const pause = element<HTMLButtonElement>('pause');
const restart = element<HTMLButtonElement>('restart');
const closeHelp = element<HTMLButtonElement>('close-help');
const speed = element('speed'), distance = element('distance');
const driveMode = element('drive-mode');
const speedFormatter = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatSpeed = (metersPerSecond: number) => speedFormatter.format(metersPerSecond * 3.6);
const cruiseLabel = `${formatSpeed(balance.cruiseSpeed)} km/h`;
element('cruise').textContent = `Trung vị · ${cruiseLabel}`;
element('release-help').textContent = `Thả W/S: tự hồi về ${cruiseLabel}.`;
element('modal-description').textContent = `Xe tự chạy ở ${cruiseLabel}. Giữ W/S để chạy nhanh/chậm; thả phím để hồi về tốc độ trung vị.`;
let state = initialState(), previous: State = state;
let input = noInput();
let helpOpen = false;
const clock = new FixedClock();
let graphics: RoadRenderer;
try { graphics = new RoadRenderer(canvas, element('game')); }
catch (error) { element('error').hidden = false; modal.hidden = true; throw error; }

function clearInput(): void { input = noInput(); clock.reset(); previous = state; }
function showModal(title: string, description: string, label: string, button: string): void {
  element('modal-title').textContent = title; element('modal-description').textContent = description;
  element('modal-label').textContent = label; play.textContent = button;
  modal.hidden = false; play.hidden = helpOpen; closeHelp.hidden = !helpOpen;
  element('instructions').hidden = state.phase === 'paused' && !helpOpen;
  element('panel-help').hidden = state.phase !== 'paused' || helpOpen;
  element('panel-restart').hidden = state.phase !== 'paused' || helpOpen;
  (helpOpen ? closeHelp : play).focus();
}
function setPaused(): void {
  if (state.phase !== 'running') return;
  state = { ...state, phase: 'paused' }; clearInput();
  pause.textContent = 'Tiếp tục';
  showModal('Nghỉ một nhịp', 'Xe đã dừng an toàn. Quãng đường không tăng trong lúc tạm dừng.', 'TẠM DỪNG', 'Tiếp tục lái');
}
function resume(): void {
  if (document.hidden) return;
  helpOpen = false; state = { ...state, phase: 'running' }; clearInput(); modal.hidden = true;
  pause.disabled = false; restart.disabled = false; pause.textContent = 'Tạm dừng'; canvas.focus();
}
play.addEventListener('click', resume);
pause.addEventListener('click', () => state.phase === 'running' ? setPaused() : resume());
restart.addEventListener('click', () => {
  state = initialState(); previous = state; helpOpen = false; clearInput();
  pause.disabled = true; restart.disabled = true; pause.textContent = 'Tạm dừng';
  showModal('Thử một lượt mới', 'Quãng đường về 0. Sẵn sàng thử lại tay lái?', 'PROTOTYPE 01 · ĐƯỜNG THỬ', 'Bắt đầu lái');
});
function openHelp(): void {
  setPaused(); helpOpen = true; clearInput();
  showModal('Cách cầm lái', `Xe tự chạy ở ${cruiseLabel}. Giữ W để tăng tốc, giữ S để hãm. Thả W/S: xe hồi dần về mốc này từ cả hai phía.`, 'HƯỚNG DẪN', 'Bắt đầu lái');
}
element('help').addEventListener('click', openHelp);
element('panel-help').addEventListener('click', openHelp);
element('panel-restart').addEventListener('click', () => restart.click());
closeHelp.addEventListener('click', () => {
  helpOpen = false;
  showModal(state.phase === 'ready' ? 'Đường về nhà' : 'Nghỉ một nhịp', 'Chọn nút bên dưới khi bạn sẵn sàng.', 'PROTOTYPE 01', state.phase === 'ready' ? 'Bắt đầu lái' : 'Tiếp tục lái');
});
const mapping = { KeyW: 'accelerate', KeyS: 'brake', KeyA: 'left', KeyD: 'right' } as const;
window.addEventListener('keydown', event => {
  if (event.code === 'Escape' && !event.repeat) {
    event.preventDefault();
    if (helpOpen) closeHelp.click(); else if (state.phase === 'running') setPaused(); else if (state.phase === 'paused') resume();
    return;
  }
  if (event.code === 'Tab' && !modal.hidden) {
    const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>('button')).filter(b => !b.hidden && !b.disabled);
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (state.phase !== 'running' || document.activeElement !== canvas) return;
  if (event.code === 'Space' || event.code === 'Tab') { event.preventDefault(); return; }
  if (event.code in mapping) { event.preventDefault(); input[mapping[event.code as keyof typeof mapping]] = true; }
});
window.addEventListener('keyup', event => { if (event.code in mapping) input[mapping[event.code as keyof typeof mapping]] = false; });
window.addEventListener('blur', setPaused);
canvas.addEventListener('blur', event => {
  // Buttons handle their own transition; do not toggle twice on blur then click.
  clearInput();
  if (![pause, restart, element('help')].includes(event.relatedTarget as HTMLElement)) setPaused();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(); });
canvas.addEventListener('click', () => { if (state.phase === 'running') canvas.focus(); });
let last = performance.now();
const diagnostics = new URLSearchParams(location.search).has('diagnostics');
const frameTimes: number[] = [], renderTimes: number[] = [];
let measuredFrames = 0;
function frame(now: number): void {
  const elapsed = (now - last) / 1000; last = now;
  const renderStart = performance.now();
  const alpha = state.phase === 'running' ? clock.advance(elapsed, () => { previous = state; state = step(state, input); }) : 1;
  graphics.draw(state, previous, alpha);
  if (diagnostics && state.phase === 'running') {
    frameTimes.push(elapsed * 1000); renderTimes.push(performance.now() - renderStart); measuredFrames++;
    if (frameTimes.length > 600) { frameTimes.shift(); renderTimes.shift(); }
    if (measuredFrames % 120 === 0) {
      const sorted = [...frameTimes].sort((a, b) => a - b);
      // Opt-in, DOM-only test evidence, not player UI or persistent analytics.
      canvas.dataset.performance = JSON.stringify({ frames: measuredFrames, window: sorted.length,
        fps: 1000 / (frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length),
        frameP95Ms: sorted[Math.floor(sorted.length * .95)],
        meanRenderCpuMs: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length });
    }
  }
  speed.textContent = formatSpeed(state.phase === 'running' ? state.speed : 0);
  // Prevent 13.99999999999998 from displaying 13 at an exact 14 m boundary.
  distance.textContent = String(Math.floor(state.distance + 1e-8));
  driveMode.textContent = state.phase !== 'running' ? (state.phase === 'ready' ? 'Sẵn sàng lái' : 'Đã tạm dừng') :
    input.brake ? 'Giữ S · hãm / chạy chậm' : input.accelerate ? 'Giữ W · tăng / chạy nhanh' :
      Math.abs(state.speed - balance.cruiseSpeed) > 1e-8 ? 'Thả phím · đang hồi về trung vị' : 'Thả phím · tự chạy trung vị';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
play.focus();
if (import.meta.hot) import.meta.hot.dispose(() => graphics.dispose());
