import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const env = await readFile(process.env.SFX_ENV_FILE || join(root, '.env'), 'utf8');
const key = process.env.ELEVENLABS_API_KEY ??
  env.match(/^ELEVENLABS_API_KEY\s*=\s*([^\r\n#]+)/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!key?.startsWith('sk_')) throw new Error('ELEVENLABS_API_KEY is missing');

const sounds = [
  ['person_impact_a.mp3', 0.9, false, 'Short unmistakable dull thup as a person is bumped by a slow vehicle: soft padded body contact and cloth rustle, instant impact at the very start. Stylized slapstick game sound, non-graphic. No scream, speech, music, horn or metallic crash.'],
  ['person_impact_b.mp3', 0.9, false, 'A brief rounded thump when a pedestrian is knocked by a moving vehicle, with a light shoe scrape and fabric shuffle. Immediate punchy onset, humorous and non-graphic. No voice, scream, music, horn, blood or metal wreck.'],
  ['vendor_cart_impact_a.mp3', 1.2, false, 'A street food pushcart is bumped by a vehicle: instant woody thud, metal tray clatter and two loose utensils rattling to rest. Short and distinct, realistic but playful. No voice, scream, music, horn, explosion or long crash.'],
  ['vendor_cart_impact_b.mp3', 1.2, false, 'A vehicle clips a small roadside vendor cart: immediate hollow cart knock, quick tin-pan rattle and small wheel wobble. Brief tactile game effect, no voice, music, horn or cinematic destruction.'],
  ['indicator_tick.mp3', 0.65, false, 'Single crisp mechanical vehicle turn indicator tick with a tiny soft plastic relay tail, clearly audible but gentle. Starts immediately, no second tick, no engine, horn, voice, music or ambience.'],
  ['train_crossing_loop.mp3', 4.0, true, 'Seamless loop of a moving train crossing a wet road nearby: steady rhythmic steel wheel clack on rail joints, low rolling carriage rumble and light track vibration. Constant perspective and loudness for a seamless repeating loop. No horn, whistle, voices, music, collision, beginning or ending flourish.'],
];

for (const [file, duration_seconds, loop, text] of sounds) {
  if (await access(join(here, file)).then(() => true, () => false)) continue;
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_text_to_sound_v2', duration_seconds,
      prompt_influence: .8, loop }),
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${(await response.text()).slice(0, 220)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 8_000)
    throw new Error(`${file}: ElevenLabs returned no usable audio`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
