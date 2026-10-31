import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Short, restrained ascending cues. Seeded noise keeps the renders reproducible.
const directory = dirname(fileURLToPath(import.meta.url));
const sampleRate = 44100;
let seed = 0x5eed31;
const noise = () => {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return (seed >>> 0) / 0xffffffff * 2 - 1;
};
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

function render(name, notes, texture, duration) {
  const data = new Float64Array(Math.ceil(sampleRate * duration));
  for (const [start, frequency, strength, tail] of notes) {
    const first = Math.floor(start * sampleRate);
    for (let index = first; index < data.length; index++) {
      const time = (index - first) / sampleRate;
      if (time > tail * 5) break;
      const attack = Math.min(1, time / .012);
      const envelope = attack * Math.exp(-time / tail);
      const glide = frequency * (1 - .055 * Math.exp(-time / .04));
      const phase = 2 * Math.PI * glide * time;
      const harmonics = texture === 'fuel' ? Math.sin(phase) + .19 * Math.sin(phase * 2) :
        texture === 'repair' ? Math.sin(phase) + .27 * Math.sin(phase * 2.75) :
        Math.sin(phase) + .13 * Math.sin(phase * 2);
      data[index] += strength * envelope * harmonics;
    }
  }
  // Quiet tactile detail under the notes, without an impact transient.
  let filtered = 0;
  for (let index = 0; index < data.length; index++) {
    const time = index / sampleRate;
    filtered += .035 * (noise() - filtered);
    const bed = texture === 'fuel' ? .022 * filtered * Math.exp(-time / .22) :
      texture === 'repair' ? .012 * noise() * Math.exp(-time / .065) * Math.min(1, time / .012) : 0;
    const fadeOut = clamp((duration - time) / .055, 0, 1);
    data[index] = clamp((data[index] + bed) * fadeOut, -.8, .8);
  }
  const pcm = Buffer.alloc(data.length * 2);
  data.forEach((value, index) => pcm.writeInt16LE(Math.round(value * 32767), index * 2));
  const wav = Buffer.alloc(44);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + pcm.length, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(pcm.length, 40);
  writeFileSync(join(directory, `${name}.wav`), Buffer.concat([wav, pcm]));
}

mkdirSync(directory, { recursive: true });
render('fuel_gain', [[0, 294, .18, .09], [.095, 370, .19, .10], [.205, 494, .24, .16]], 'fuel', .62);
render('repair_gain', [[0, 330, .17, .09], [.105, 440, .19, .11], [.215, 587, .23, .18]], 'repair', .68);
render('passenger_pickup', [[0, 392, .14, .09], [.085, 494, .18, .11], [.18, 659, .22, .18]], 'passenger', .60);
render('shop_success', [[0, 330, .13, .09], [.09, 440, .16, .10], [.18, 554, .19, .11], [.28, 740, .22, .20]], 'shop', .74);
render('vehicle_purchase', [[0, 294, .14, .10], [.11, 392, .17, .10], [.22, 494, .19, .12], [.34, 659, .22, .24]], 'shop', .86);
