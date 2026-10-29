/** The force comparison/backup HTML entries also load main.ts. Upgrade their shared
 * UI shell in place, without changing their simulation or source HTML files. */
export function prepareUiShell(): void {
  if (!document.getElementById('controls-menu')) {
    const footer = document.querySelector('footer')!;
    const menu = document.createElement('div'); menu.id = 'controls-menu';
    menu.innerHTML = '<button id="controls-toggle" aria-label="Điều khiển và menu" aria-expanded="false" aria-controls="controls-panel"><i data-lucide="menu" aria-hidden="true"></i></button><div id="controls-panel" hidden></div>';
    menu.lastElementChild!.append(...footer.children); footer.append(menu);
    const primary = document.querySelector('.metric.distance')!;
    const distance = document.getElementById('distance')!, score = document.getElementById('score')!;
    distance.id = 'score'; score.id = 'distance';
    primary.className = 'metric score-primary'; primary.querySelector('span')!.textContent = 'ĐIỂM';
    const secondary = score.parentElement!; secondary.querySelector('svg,i')?.remove();
    secondary.querySelector('span')!.textContent = 'm'; secondary.querySelector('span')!.className = '';
  }
  if (!document.getElementById('quick-start')) {
    const quick = document.createElement('div'); quick.id = 'quick-start';
    quick.innerHTML = '<span><kbd>A D</kbd>Lái</span><span><kbd>W S</kbd>Tốc độ</span><span><kbd>Q E</kbd>Rẽ</span>';
    document.getElementById('instructions')!.before(quick);
  }
  if (!document.getElementById('discovery-art')) {
    const art = document.createElement('div'); art.id = 'discovery-art'; art.hidden = true;
    document.getElementById('shop-panel')!.before(art);
  }
}
