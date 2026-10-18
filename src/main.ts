import './style.css';
import { balance, shopBalance } from './config';
import { FixedClock, noInput } from './simulation';
import { activeVehicle, dropPassenger, initialRun, names, passengerDrive, pickUpPassenger, selectTurn, stepRun, switchVehicle } from './survival';
import { canChoose, junction } from './route';
import { recordResult, saveSeen, seenCards, showFlavor, saveFlavor } from './persistence';
import { RoadRenderer } from './render';
import { warningDistance, type EntityKind } from './world';
import { developmentScenario } from './development';
import { createIcons, Fuel, Wrench, Trophy, Coins, Pause, CircleHelp, RotateCcw, CircleAlert, UsersRound } from 'lucide';
import { RoadHud } from './road-hud';
import { vehicles } from './vehicles';
import { enterShop, leaveShop, transact } from './shop';
import { hasBoost, hasStar, itemNames, requestJump, usePowerItem } from './items';
import { ShopView } from './shop-view';
createIcons({ icons: { Fuel, Wrench, Trophy, Coins, Pause, CircleHelp, RotateCcw, CircleAlert, UsersRound } });

const el = <T extends Element = HTMLElement>(id: string): T => {
  const node = document.getElementById(id); if (!node) throw new Error(`Missing UI: ${id}`); return node as unknown as T;
};
const text = (id: string, value: string) => { const node = el(id); if (node.textContent !== value) node.textContent = value; };
const canvas = el<HTMLCanvasElement>('scene'), modal = el('modal');
const play = el<HTMLButtonElement>('play'), pause = el<HTMLButtonElement>('pause'), restart = el<HTMLButtonElement>('restart');
const testHome = document.createElement('a'); testHome.href = '/p61.html';
testHome.textContent = '← Bộ tình huống P6.1'; testHome.hidden = true; modal.append(testHome);
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
  const run = initialRun(seed, crypto.randomUUID());
  return import.meta.env.DEV ? developmentScenario(run, scenario) : run;
}
let state = newRun(), previous = state, input = noInput();
type Screen = 'start' | 'pause' | 'help' | 'card' | 'result' | 'shop' | null;
let screen: Screen = 'start';
let discovery: EntityKind | null = null, cardTimer: ReturnType<typeof setTimeout> | undefined;
let savedRunId = '';
const seen = seenCards(), clock = new FixedClock(), listeners = new AbortController();
const flavorToggle = el<HTMLInputElement>('flavor-toggle'); flavorToggle.checked = showFlavor();
flavorToggle.addEventListener('change', () => saveFlavor(flavorToggle.checked), { signal: listeners.signal });
const roadHud = new RoadHud(el('world-cues'));
const shopView = new ShopView(el('shop-panel'), () => state, command => {
  const result = transact(state, command); state = result.run; previous = state;
  text('shop-status', result.message);
});
function openShop(): void {
  const next = enterShop(state); if (next === state) return;
  state = next; shopView.reset();
  show('shop', 'Cửa hàng ven đường', 'Game tạm dừng. Tiền chỉ trừ khi giao dịch thành công.');
  text('shop-status', 'Chọn danh mục. Esc hoặc Tiếp tục lái để rời cửa hàng.'); shopView.render();
}
let graphics: RoadRenderer;
try { graphics = new RoadRenderer(canvas, el('game')); }
catch (error) { el('error').hidden = false; modal.hidden = true; throw error; }

function clearInput(): void { input = noInput(); clock.reset(); previous = state; }
function show(view: Exclude<Screen, null>, title: string, description: string): void {
  screen = view; modal.hidden = false; clearInput();
  testHome.hidden = !state.world.prototype;
  text('modal-title', title); text('modal-description', description);
  text('modal-label', view === 'card' ? 'DỪNG AN TOÀN · LẦN ĐẦU GẶP' : view === 'result' ? 'KẾT THÚC CHUYẾN ĐI' : state.world.prototype ? 'P6.1 · THỬ TÌNH HUỐNG · CHƯA TÍCH HỢP' : 'PROTOTYPE 06 · SỰ KIỆN · CHUỐI · TÀU');
  el('shop-panel').hidden = view !== 'shop'; el('shop-status').hidden = view !== 'shop';
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
  state = { ...leaveShop(state), phase: 'running' }; screen = null; modal.hidden = true; clearInput(); canvas.focus({ preventScroll: true });
}
function reset(): void {
  clearTimeout(cardTimer); discovery = null;
  state = newRun(); previous = state;
  if (state.world.prototype) {
    document.title = 'P6.1 · ' + state.world.prototype.title;
    show('start', state.world.prototype.title, state.world.prototype.description + ' W/S điều tốc, A/D lái, 1/2 dùng vật phẩm, Space nhảy khi nitro bật; Esc tạm dừng. Vật phẩm và xe dự phòng mẫu không dùng để đánh giá economy.');
    el('instructions').hidden = true;
    return;
  }
  show('start', 'Đường về nhà', `R ghé cửa hàng ven đường để mua xe, tiếp tế, nâng cấp và vật phẩm. Phím 1/2 dùng món trong ô: nitro boost, star miễn damage/debuff, chuối tránh bị bắt khi cảnh báo hoặc Grab gọi khách đặc biệt rồi F đón. Space nhảy khi nitro đang bật. Tab đổi xe; F/G đón hoặc cho khách xuống. Giữ xe còn xăng và độ bền, W/S điều tốc, A/D lái, Q/E rẽ.${state.vehicleInstances.length > 1 ? ` Bản thử có thêm ${vehicles[state.vehicleInstances[1].kind].name}.` : ''}`);
}
function resultView(): void {
  const result = state.result; if (!result) return;
  text('result-distance', `${Math.floor(result.distance)} m`); text('result-score', `${Math.floor(result.score)}`);
  text('result-money', formatter.format(result.money)); text('result-time', `${Math.floor(result.seconds / 60)}:${String(Math.floor(result.seconds % 60)).padStart(2, '0')}`);
  show('result', result.reason === 'train' ? 'Va chạm tàu hoả' : result.reason === 'police' ? 'Xe bị tịch thu' : result.reason === 'fuel' ? 'Hết xăng, hết đà' : 'Xe không chạy tiếp được',
    result.reason === 'train' ? 'Tàu luôn kết thúc ván khi va chạm. Giữ S chờ mở đường hoặc nhảy bằng nitro + Space.' : result.reason === 'police' ? 'Không còn xe dự phòng hợp lệ. Dùng chuối trong cửa sổ cảnh báo ở lượt sau.' : result.reason === 'fuel' ? `Xe đã trôi thêm đủ ${balance.coastDistance} m sau khi hết xăng. Lượt sau hãy tìm bình xăng ven đường.` : 'Độ bền đã về 0 sau va chạm. Lượt sau hãy đọc cảnh báo và chừa thời gian đổi hướng.');
}
function openHelp(): void {
  if (state.shopId) state = leaveShop(state);
  pauseRun();
  const vehicle = activeVehicle(state);
  show('help', 'Cách cầm lái', `Giữ W/S để nhanh/chậm; thả hồi về tốc độ trung vị của ${vehicle.name}. A/D lái; Q/E rẽ; F đón khách; G cho khách xuống. Tab đổi nhanh xe khi có xe dự phòng; khách và tài nguyên của từng xe được giữ nguyên. Xe hiện tại ${vehicle.name}: ${vehicle.capacity} chỗ tính cả tài xế, cruise ${formatter.format(vehicle.cruiseSpeed * 3.6)} km/h khi trống, bình ${formatter.format(vehicle.fuelCapacity)} L, hao ${fuelRateFormatter.format(vehicle.fuelPerMeter * 100)} L/100 m. Chở khách giảm cruise và quá tải tăng hao xăng. Nước hao xăng, ổ gà trừ HP theo thời gian, xe giao thông gây va/ngã; pha ngã/trôi/quay lại miễn tác động xấu. Hết xăng trôi ${balance.coastDistance} m; HP về 0 hoặc hết đà sẽ tự chuyển xe còn chạy được. R ghé cửa hàng đủ gần; Xăng/sửa chỉ tại chỗ. Phím 1/2 dùng nitro boost, star hoặc Grab (gọi khách phía trước rồi F đón); Space nhảy khi nitro đang bật; star không bỏ qua event, nitro không vượt xe cao.`);
}
const cardDescriptions: Record<EntityKind, string> = {
  police: 'Công an phạt 300 và tịch thu xe. Dùng chuối bằng phím ô 1/2 khi cảnh báo xuất hiện để tránh bị bắt. Thiếu tiền: lấy tới 0, xe dự phòng còn nửa xăng hiện có; không có xe hợp lệ thì kết ván. Star không tránh sự kiện.',
  militia: 'Dân phòng phạt 100, không tịch thu. Thiếu tiền chỉ lấy tới 0. Chuối trong cửa sổ cảnh báo tránh lần bắt này; dùng ngoài cửa sổ không mất vật phẩm.',
  jam: 'Hai làn bị kẹt: chuyển sang làn trống. Chạm vào gây ngã, không kết ván ngay. Star miễn ngã.',
  accident: 'Tai nạn chắn hai làn. Né làn trống; chạm làm xe hỏng hoàn toàn, tự chuyển xe dự phòng hợp lệ hoặc kết ván. Star vẫn kích hoạt sự kiện.',
  train: 'Tàu chắn ngang: giữ S để phanh tới dừng và đợi tín hiệu mở. Hoặc bật nitro rồi Space đúng lúc để nhảy qua. Chạm tàu luôn kết ván, kể cả có star hay xe dự phòng.',
  broken: 'Xe chết máy: chạm một lần sẽ xuất hiện khách bên cạnh để F đón, đôi khi có một chuối nếu kho còn chỗ.',
  shop: `Nhà ven đường có biểu tượng cửa hàng. Lái tới cùng phía, nhấn R trong khoảng ${shopBalance.reach} m để ghé; game tạm dừng khi mua. Có xăng, sửa, xe và nâng cấp. Kho tối đa hai xe; mua xe thứ ba phải chọn xe bỏ. Bán nitro/star/Grab cho hai ô 1/2; xăng/sửa chỉ tại chỗ. Tab vẫn đổi xe. Hàng của cùng cửa hàng không đổi khi mở lại.`,
  water: `Mảng nước làm hao thêm ${formatter.format(balance.waterFuelPerSecond)} L xăng mỗi giây tiếp xúc. Có đoạn dài tới 30 m và phủ ba làn: lúc đó phải chấp nhận hao xăng cho đến khi có nhánh rẽ ở prototype sau.`,
  pothole: `Ổ gà viền vàng lấy ${balance.potholeImpactDamage} HP và tối đa ${balance.potholeMoneyLoss} tiền ở lần chạm đầu; tiếp tục lấy ${balance.potholeDamagePerSecond} HP mỗi giây xe còn chạm. Có đoạn dài tới 24 m hoặc phủ cả ba làn; chạy nhanh qua sẽ giảm thời gian chịu hại.`,
  traffic: `Xe giao thông có đủ loại từ xe máy, ô tô, ba gác tới buýt, tải và container; mỗi loại có HP, kích cỡ và sát thương riêng. Làn trái ngược chiều, phải cùng chiều, giữa chọn hướng theo seed. Va xe thường làm tài xế ngã; buýt, tải và container có thể húc hỏng xe yếu nhưng vẫn mất HP. Xe giao thông chịu ổ gà, chậm và hao thêm xăng trong nước. Mỗi loại có bình và mức hao riêng; hết xăng trôi thêm rồi dừng nhưng vẫn còn HP và gây va chạm. Khi xe hỏng, khách xuất hiện bên cạnh nếu có chỗ an toàn; nhấn F khi đủ gần để đón nếu xe tự hỏng vì ổ gà. Khách từ xe bị bạn húc hỏng từ chối lên xe; không tự nhận khách hay thưởng.`,
  fuel: `Bình xăng đứng có quai: lái chạm để nhận tới ${balance.fuelPickup} L, không vượt sức chứa. Nhặt được khi đang trôi sẽ giúp xe chạy lại.`,
  repair: `Hộp trắng có dấu cộng: lái chạm để phục hồi tới ${balance.repairPickup} HP, không vượt độ bền tối đa. Đây là nhặt trực tiếp; mua bộ sửa mang theo ở cửa hàng và dùng R.`,
  passenger: `Người đứng ven đường chờ đi nhờ. Lái tới gần cùng phía và nhấn F để đón; không tự lên xe khi chạm. Nhấn G cho một khách xuống ngay khi chạy. Tài xế chiếm một chỗ, khách thêm làm giảm tốc độ trung vị; quá tải còn giảm tốc tối đa và tăng hao xăng.`,
};
function dismissCard(): void {
  if (discovery) { seen.add(discovery); saveSeen(seen); } discovery = null; clearTimeout(cardTimer);
  if (document.hidden || !document.hasFocus()) show('pause', 'Sẵn sàng tiếp tục?', 'Thẻ đã đóng. Chọn tiếp tục khi quay lại màn chơi.'); else resume();
}
function discover(): void {
  if (state.phase !== 'running') return;
  const candidate = state.world.entities.filter(e => !e.consumed && (e.kind !== 'passenger' || e.pickupable !== false) &&
    !seen.has(e.kind) && e.distance > state.distance &&
    e.distance - state.distance <= warningDistance(state.speed, e, activeVehicle(state).length)).sort((a, b) => a.distance - b.distance)[0];
  if (!candidate) return;
  discovery = candidate.kind; state = { ...state, phase: 'paused' };
  show('card', candidate.displayName ?? names[candidate.kind], candidate.help ?? cardDescriptions[candidate.kind]);
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
    const buttons = [...modal.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLAnchorElement>('button,input,select,a[href]')].filter(b => !b.closest('[hidden]') && !('disabled' in b && b.disabled));
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
  clearInput(); if (![pause, restart, el('help')].includes(event.relatedTarget as HTMLElement)) pauseRun();
}, { signal: listeners.signal });
canvas.addEventListener('click', () => { if (state.phase === 'running') canvas.focus(); }, { signal: listeners.signal });

function updateHud(): void {
  const vehicle = activeVehicle(state);
  const nextJunction = junction(state.seed, state.route.index);
  const approach = nextJunction.distance - state.distance;
  const junctionCue = el('junction-cue');
  junctionCue.hidden = state.phase !== 'running' || !!state.crash || approach < 0 || approach > Math.max(70, state.speed * 4);
  if (!junctionCue.hidden) {
    const activeChoice = canChoose(state.distance, state.speed, nextJunction);
    junctionCue.classList.toggle('active', activeChoice);
    junctionCue.classList.toggle('forced', nextJunction.blockedStraight);
    text('junction-distance', activeChoice ? `${(approach / Math.max(state.speed, 1)).toFixed(1)} s` : `${Math.ceil(approach)} m`);
    text('junction-message', state.route.choice ? state.route.choice === 'left' ? 'ĐÃ CHỌN TRÁI' : 'ĐÃ CHỌN PHẢI' :
      !activeChoice ? 'SẮP TỚI GIAO LỘ' : nextJunction.blockedStraight ? 'RẼ NGAY · ĐƯỜNG THẲNG CHẶN' : 'CHỌN LỐI');
    el('junction-left').classList.toggle('selected', state.route.choice === 'left');
    el('junction-right').classList.toggle('selected', state.route.choice === 'right');
  }
  text('speed', speedText(state.phase === 'running' ? state.speed : 0)); text('distance', `${Math.floor(state.distance + 1e-8)}`);
  text('score', `${Math.floor(state.score + 1e-8)}`); text('money', formatter.format(state.money));
  const occupants = state.crash ? 0 : state.riderIds.length + 1;
  text('rider-count', `${occupants}/${vehicle.capacity}`);
  text('vehicle-name', vehicle.name);
  const effects = [hasBoost(state) ? '↟ NITRO ' + Math.max(0, state.powers.boostUntil - state.activeSeconds).toFixed(1) + 's' : '',
    hasStar(state) ? '☆ STAR ' + Math.max(0, state.powers.starUntil - state.activeSeconds).toFixed(1) + 's' : ''].filter(Boolean);
  el('item-cue').hidden = !state.inventory.some(Boolean) && effects.length === 0;
  text('item-cue', state.inventory.map((item, i) => (i + 1) + ' · ' + (item ? item === 'nitro' ? '↟' : item === 'banana' ? 'Chuối' : item === 'grab' ? 'Grab×' + state.grabUses[i] : '☆' : '—')).join('  ') + '  ' + effects.join(' · '));
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
