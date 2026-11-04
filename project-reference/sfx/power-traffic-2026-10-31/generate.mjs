import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const rate = 44100;
let seed = 0x7a4e21;
const random = () => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) / 0xffffffff * 2 - 1;
};
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function wav(name, seconds, sample) {
  const count = Math.ceil(seconds * rate);
  const pcm = Buffer.alloc(count * 2);
  for (let index = 0; index < count; index++) {
    const time = index / rate;
    const edge = Math.min(1, time / .025, (seconds - time) / .035);
    pcm.writeInt16LE(Math.round(clamp(sample(time) * Math.max(0, edge), -.85, .85) * 32767), index * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  writeFileSync(join(directory, `${name}.wav`), Buffer.concat([header, pcm]));
}

// Both beds have whole-number cycles at their loop boundaries. The game fades
// them in and out with the actual power timer, so they never become a UI cue.
let nitroNoise = 0, nitroAir = 0;
wav('nitro_run_loop', 2.4, t => {
  nitroNoise += .12 * (random() - nitroNoise);
  nitroAir += .035 * (random() - nitroAir);
  const pulse = .78 + .22 * Math.sin(2 * Math.PI * 7.5 * t);
  const growl = .18 * Math.sin(2 * Math.PI * 85 * t) +
    .065 * Math.sin(2 * Math.PI * 170 * t) + .035 * Math.sin(2 * Math.PI * 255 * t);
  return pulse * (growl + .46 * nitroNoise + .24 * nitroAir);
});

// Short bouncy major-pentatonic phrase with a 2.4 s phrase length.
const starNotes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 783.99];
wav('star_run_loop', 2.4, t => {
  const note = Math.floor(t / .3) % starNotes.length;
  const phase = t % .3, frequency = starNotes[note];
  const envelope = Math.min(1, phase / .012) * Math.exp(-phase * 10);
  const fundamental = Math.sin(2 * Math.PI * frequency * phase);
  const mallet = fundamental + .34 * Math.sin(2 * Math.PI * frequency * 2 * phase);
  const bass = .11 * Math.sin(2 * Math.PI * 130.81 * t) * (1 + Math.sin(2 * Math.PI * 2.5 * t));
  const tick = phase < .025 ? (1 - phase / .025) * .035 * random() : 0;
  return .18 * envelope * mallet + bass + tick;
});

let jumpAir = 0;
wav('jump_launch_punch', .86, t => {
  jumpAir += .14 * (random() - jumpAir);
  const rise = Math.min(1, t / .08) * Math.max(0, 1 - t / .86);
  const sweep = Math.sin(2 * Math.PI * (190 * t + 370 * t * t));
  const takeoff = Math.exp(-t * 17) * Math.sin(2 * Math.PI * (110 * t - 32 * t * t));
  return .22 * rise * sweep + .38 * rise * jumpAir + .25 * takeoff;
});
let landNoise = 0;
wav('jump_land_punch', .52, t => {
  landNoise += .1 * (random() - landNoise);
  const thud = Math.exp(-t * 13) * Math.sin(2 * Math.PI * (100 * t - 45 * t * t));
  const rattle = Math.exp(-t * 9) * landNoise;
  return .44 * thud + .2 * rattle;
});

function horn(name, low, high, length, loudness) {
  wav(name, length, t => {
    const attack = Math.min(1, t / .045);
    const release = Math.min(1, (length - t) / .12);
    const vibrato = 1 + .008 * Math.sin(2 * Math.PI * 6 * t);
    const tone = Math.sin(2 * Math.PI * low * vibrato * t) +
      .68 * Math.sin(2 * Math.PI * high * vibrato * t) +
      .13 * Math.sin(2 * Math.PI * low * 3 * t);
    return loudness * attack * release * tone;
  });
}
horn('horn_light', 360, 450, .32, .15);
horn('horn_car', 300, 375, .39, .16);
horn('horn_heavy', 190, 245, .55, .18);

function pass(name, seconds, base, loudness) {
  let filtered = 0;
  wav(name, seconds, t => {
    const phase = t / seconds;
    const rush = Math.pow(Math.max(0, 1 - Math.abs(phase - .48) / .48), 1.4);
    const cutoff = .08 + .18 * (1 - phase);
    filtered += cutoff * (random() - filtered);
    const engine = Math.sin(2 * Math.PI * (base * t - base * .18 * t * t / seconds));
    return loudness * rush * (.7 * filtered + .3 * engine);
  });
}
pass('pass_light', .58, 210, .22);
pass('pass_heavy', .83, 115, .30);
