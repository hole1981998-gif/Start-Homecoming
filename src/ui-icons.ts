/** Purpose-built atlas. Source alpha bounds were inspected after generation:
 * icon silhouettes extend beyond the nominal grid, so each uses its own padded
 * window. Preserve shape/aspect and exclude neighbouring silhouettes. */
export const uiIconNames = ['fuel','repair','motorcycle','car','bus','truck','nitro','star','banana','grab',
  'engine','shield','economy','passenger','wind','train','coins','bag','obstacles','parcel'] as const;
export type UiIcon = typeof uiIconNames[number];
const bounds = [
  [71,44,269,261], [343,59,602,257], [669,42,917,268], [948,59,1232,263],
  [32,300,307,505], [344,294,614,505], [711,287,854,517], [983,292,1204,502],
  [47,539,281,748], [390,527,576,754], [668,539,918,759], [998,532,1193,752],
  [64,778,261,1005], [353,770,577,1003], [640,807,922,986], [958,778,1237,990],
  [42,1028,275,1224], [358,1019,591,1230], [631,1033,937,1218], [992,1024,1212,1225],
] as const;
export function uiIcon(name: UiIcon): HTMLSpanElement {
  const index = uiIconNames.indexOf(name), node = document.createElement('span');
  node.className = 'volume-icon'; node.setAttribute('aria-hidden','true'); node.dataset.icon = name;
  const [left,top,right,bottom] = bounds[index], width = right-left, height = bottom-top;
  const windowWidth = Math.max(width,height*1.25)*1.12, windowHeight = windowWidth/1.25;
  node.style.backgroundSize = `${1254/windowWidth*100}% ${1254/windowHeight*100}%`;
  node.style.backgroundPosition = `${((left+right-windowWidth)/2)/(1254-windowWidth)*100}% ${((top+bottom-windowHeight)/2)/(1254-windowHeight)*100}%`;
  const insetY = Math.max(0,(windowHeight-height)/2-2)/windowHeight*100;
  const insetX = Math.max(0,(windowWidth-width)/2-2)/windowWidth*100;
  node.style.clipPath = `inset(${insetY}% ${insetX}%)`;
  return node;
}
export function prepareContentIcons(): void {
  for (const [name, icon] of Object.entries({fuel:'fuel',wrench:'repair',coins:'coins','users-round':'passenger'} as const)) {
    for (const node of document.querySelectorAll(`[data-lucide="${name}"]`)) node.replaceWith(uiIcon(icon));
  }
}

/** A fixed slot never moves when its neighbour is consumed. */
export function renderItemSlots(host: HTMLElement, inventory: readonly ('nitro'|'star'|'banana'|'grab'|null)[], uses: readonly number[], effects: readonly string[]): void {
  const signature = JSON.stringify([inventory,uses,effects]);
  if (host.dataset.items === signature) return;
  host.dataset.items = signature; host.setAttribute('role','group');
  host.replaceChildren();
  for (const [index,item] of inventory.entries()) {
    const slot = document.createElement('span'); slot.className = 'item-slot'; slot.dataset.slot = String(index);
    slot.setAttribute('aria-hidden','true');
    const key = document.createElement('kbd'); key.textContent = String(index+1); slot.append(key);
    if (item) slot.append(uiIcon(item));
    const detail = document.createElement('small'); detail.textContent = item === 'grab' ? 'Grab×'+uses[index] : item ? '' : '—';
    slot.append(detail); host.append(slot);
  }
  const timers = document.createElement('span'); timers.className = 'power-effects'; timers.textContent = effects.join(' · '); host.append(timers);
}
