import { introCues, introDuration, introFrameAt, type IntroCue, type IntroImage } from './intro-timeline';
import './intro.css';

const imageFiles: Partial<Record<IntroImage, string>> = {
  work: '/intro/shot1-work.png', look: '/intro/shot1-look.png',
  glance: '/intro/shot2-glance.png', rain: '/intro/shot2-rain.png',
  watch: '/intro/shot3-watch.png', jacket: '/intro/shot4-jacket.png',
};
const cueFiles: Record<IntroCue, string> = {
  office: '/intro/office.mp3', typing: '/intro/typing.mp3', rain: '/intro/rain.mp3',
  breath: '/intro/breath.mp3', hmm: '/intro/hmm.mp3', footsteps: '/intro/footsteps.mp3',
  jacket: '/intro/jacket.mp3', 'game-horn': '/intro/game-horn.mp3',
};
const oneShotVolumes: Partial<Record<IntroCue, number>> = {
  breath: .62, hmm: .9, jacket: .7, 'game-horn': .42,
};

export class IntroSequence {
  private readonly root = document.createElement('div');
  private readonly backdrop = document.createElement('div');
  private readonly portrait = document.createElement('div');
  private readonly sceneImage = document.createElement('img');
  private readonly logo = document.createElement('img');
  private readonly startButton = document.createElement('button');
  private readonly skipButton = document.createElement('button');
  private readonly sounds = Object.fromEntries(Object.entries(cueFiles).map(([key, file]) => {
    const sound = new Audio(file);
    sound.preload = 'auto';
    sound.loop = ['office', 'rain', 'typing', 'footsteps'].includes(key);
    return [key, sound];
  })) as Record<IntroCue, HTMLAudioElement>;
  private readonly loops = new Set<IntroCue>();
  private readonly onComplete: () => void;
  private readonly ambienceLevel: () => number;
  private readonly sfxLevel: () => number;
  private cueIndex = 0;
  private elapsed = 0;
  private startedAt = 0;
  private animation = 0;
  private running = false;
  private image: IntroImage = 'black';

  constructor(onComplete: () => void, ambienceLevel: () => number, sfxLevel: () => number) {
    this.onComplete = onComplete;
    this.ambienceLevel = ambienceLevel;
    this.sfxLevel = sfxLevel;
    this.root.className = 'intro-overlay';
    this.root.hidden = true;
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', 'Intro Em xin về sớm');
    this.backdrop.className = 'intro-backdrop';
    this.portrait.className = 'intro-portrait';
    this.sceneImage.alt = '';
    this.logo.className = 'intro-title';
    this.logo.src = '/intro/title.png';
    this.logo.alt = 'Em xin về sớm';
    this.logo.hidden = true;
    this.portrait.append(this.sceneImage);
    const controls = document.createElement('div');
    controls.className = 'intro-controls';
    this.startButton.className = 'intro-start';
    this.startButton.textContent = 'Xem intro';
    this.startButton.addEventListener('click', () => this.play());
    this.skipButton.className = 'intro-skip';
    this.skipButton.textContent = 'Bỏ qua';
    this.skipButton.addEventListener('click', () => this.finish());
    controls.append(this.startButton, this.skipButton);
    this.root.append(this.backdrop, this.portrait, this.logo, controls);
    this.root.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.finish(); }
      if (event.key === 'Tab' && event.shiftKey && document.activeElement === this.startButton) {
        event.preventDefault(); this.skipButton.focus();
      } else if (event.key === 'Tab' && !event.shiftKey && document.activeElement === this.skipButton) {
        event.preventDefault(); this.startButton.focus();
      }
    });
    document.addEventListener('visibilitychange', this.onVisibility);
    document.body.append(this.root);
    for (const url of Object.values(imageFiles)) { const preload = new Image(); preload.src = url; }
    { const preload = new Image(); preload.src = '/intro/title.png'; }
  }

  show(): void {
    this.stop();
    this.elapsed = 0;
    this.cueIndex = 0;
    this.image = 'black';
    this.root.hidden = false;
    const game = document.getElementById('app');
    if (game) game.inert = true;
    this.startButton.hidden = false;
    this.startButton.textContent = 'Xem intro';
    this.draw(0);
    this.startButton.focus({ preventScroll: true });
  }

  private play(): void {
    if (this.running) return;
    this.running = true;
    this.startButton.hidden = true;
    this.startedAt = performance.now();
    for (const cue of this.loops) void this.sounds[cue].play().catch(() => undefined);
    this.animation = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    const time = this.elapsed + (now - this.startedAt) / 1000;
    while (this.cueIndex < introCues.length && introCues[this.cueIndex].at <= time) {
      const event = introCues[this.cueIndex++];
      const sound = this.sounds[event.cue];
      if (event.kind === 'stop') { this.loops.delete(event.cue); sound.pause(); sound.currentTime = 0; }
      else {
        if (event.kind === 'start') {
          this.loops.add(event.cue);
          if (event.cue === 'footsteps') sound.currentTime = .48;
        }
        else sound.currentTime = 0;
        void sound.play().catch(() => undefined);
      }
    }
    // The supplied clip has roughly 0.5s of near-silence before the first footfall.
    const footsteps = this.sounds.footsteps;
    if (this.loops.has('footsteps') && footsteps.currentTime >= 1.72) footsteps.currentTime = .48;
    this.draw(time);
    if (time >= introDuration) this.finish();
    else this.animation = requestAnimationFrame(this.tick);
  };

  private draw(time: number): void {
    const frame = introFrameAt(time);
    if (frame.image !== this.image || (frame.image === 'black' && this.sceneImage.src)) {
      this.image = frame.image;
      const url = imageFiles[frame.image];
      if (url) {
        this.sceneImage.src = url;
        this.backdrop.style.backgroundImage = `url("${url}")`;
      } else this.backdrop.style.backgroundImage = 'none';
    }
    const isTitle = frame.image === 'title';
    this.portrait.hidden = frame.image === 'black' || isTitle;
    this.backdrop.hidden = this.portrait.hidden;
    this.logo.hidden = !isTitle;
    this.portrait.style.opacity = String(frame.sceneOpacity);
    this.backdrop.style.opacity = String(frame.sceneOpacity);
    this.portrait.style.transform = frame.image === 'watch' ?
      `translateX(-50%) scale(${frame.watchZoom})` :
      'translateX(-50%)';
    this.logo.style.transform = `translate(-50%, -50%) scale(${frame.titleScale})`;
    this.logo.style.opacity = String(frame.titleOpacity);
    this.sounds.office.volume = Math.min(1, frame.officeVolume * this.ambienceLevel());
    this.sounds.rain.volume = Math.min(1, frame.rainVolume * this.ambienceLevel());
    this.sounds.typing.volume = Math.min(1, .26 * this.sfxLevel());
    this.sounds.footsteps.volume = Math.min(1, .3 * this.sfxLevel());
    for (const [key, volume] of Object.entries(oneShotVolumes)) {
      this.sounds[key as IntroCue].volume = Math.min(1, volume * this.sfxLevel());
    }
  }

  private readonly onVisibility = (): void => {
    if (!document.hidden || !this.running) return;
    this.elapsed += (performance.now() - this.startedAt) / 1000;
    this.running = false;
    cancelAnimationFrame(this.animation);
    for (const sound of Object.values(this.sounds)) if (!sound.paused) sound.pause();
    this.startButton.hidden = false;
    this.startButton.textContent = 'Tiếp tục intro';
  };

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animation);
    this.loops.clear();
    for (const sound of Object.values(this.sounds)) {
      if (!sound.paused) sound.pause();
      sound.currentTime = 0;
    }
  }

  private finish(): void {
    this.stop();
    this.root.hidden = true;
    const game = document.getElementById('app');
    if (game) game.inert = false;
    this.onComplete();
  }

  dispose(): void {
    this.stop();
    const game = document.getElementById('app');
    if (game) game.inert = false;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.root.remove();
  }
}
