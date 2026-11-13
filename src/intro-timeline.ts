export const introDuration = 25;

export type IntroImage = 'black' | 'work' | 'look' | 'glance' | 'rain' | 'watch' | 'jacket' | 'title';
export type IntroCue = 'office' | 'typing' | 'rain' | 'breath' | 'hmm' | 'footsteps' | 'jacket' | 'game-horn';

export interface IntroFrame {
  image: IntroImage;
  sceneOpacity: number;
  watchZoom: number;
  watchProgress: number;
  titleScale: number;
  titleOpacity: number;
  officeVolume: number;
  rainVolume: number;
}

export const introCues: ReadonlyArray<{ at: number; kind: 'start' | 'stop' | 'one-shot'; cue: IntroCue }> = [
  { at: 1, kind: 'start', cue: 'office' },
  { at: 1, kind: 'start', cue: 'typing' },
  { at: 4, kind: 'start', cue: 'rain' },
  { at: 6, kind: 'stop', cue: 'typing' },
  { at: 6, kind: 'one-shot', cue: 'breath' },
  { at: 10.5, kind: 'one-shot', cue: 'hmm' },
  { at: 15, kind: 'start', cue: 'footsteps' },
  { at: 18, kind: 'one-shot', cue: 'jacket' },
  { at: 21, kind: 'stop', cue: 'footsteps' },
  { at: 23, kind: 'one-shot', cue: 'game-horn' },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function introFrameAt(seconds: number): IntroFrame {
  const time = Math.min(introDuration, Math.max(0, seconds));
  const image: IntroImage = time < 2 ? 'black' : time < 6 ? 'work' : time < 7.5 ? 'look' :
    time < 9.75 ? 'glance' : time < 12 ? 'rain' : time < 17 ? 'watch' : time < 21 ? 'jacket' : 'title';
  const titleProgress = clamp01((time - 21) / 4);
  let sceneOpacity = 1;
  if (time < 2 || time >= 21) sceneOpacity = 0;
  else if (time < 2.85) sceneOpacity = clamp01((time - 2) / .85);
  else if (time >= 5.72 && time < 6) sceneOpacity = clamp01((6 - time) / .28);
  else if (time >= 6 && time < 6.58) sceneOpacity = clamp01((time - 6) / .58);
  else if (time >= 11.78 && time < 12) sceneOpacity = clamp01((12 - time) / .22);
  else if (time >= 12 && time < 12.36) sceneOpacity = clamp01((time - 12) / .36);
  else if (time >= 19.65) sceneOpacity = clamp01((21 - time) / 1.35);
  const watchProgress = clamp01((time - 12) / 5);
  return {
    image,
    sceneOpacity,
    watchProgress,
    watchZoom: 1 + 4.5 * watchProgress,
    titleScale: 1.2 - .28 * titleProgress,
    titleOpacity: Math.min(clamp01((time - 21) / 1.2), clamp01((25 - time) / 1)),
    officeVolume: time < 7.5 ? .34 : time < 12 ? .17 : .34,
    rainVolume: time < 7.5 ? .13 : time < 12 ? .34 : .13,
  };
}
