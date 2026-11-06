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
  ['fuel_pickup_rise.mp3', 1.4, 'Satisfying game pickup for a fuel canister: a quick soft liquid glug and three clean ascending glassy notes, ending in a warm bright shimmer. Upward motion and clear reward resolution. No speech, music, explosion or harsh transient.'],
  ['repair_pickup_rise.mp3', 1.4, 'Satisfying game pickup for a repair kit: three tiny mechanical clicks rapidly climbing in pitch, then a clean warm sparkling resolved chime. Short, tactile and optimistic. No speech, music, crash or harsh transient.'],
  ['passenger_pickup_rise.mp3', 1.3, 'Friendly satisfying game sound when a passenger boards a vehicle: soft latch click followed by a quick ascending two-note bell and a cheerful rounded final tone. Warm human scale, not childish. No voice, music or horn.'],
  ['item_purchase_rise.mp3', 1.5, 'Satisfying game shop purchase: soft coin tick, a quick three-step rising tonal flourish, then a bright resolved sparkle with a short clean tail. Clear sense of gaining something valuable. No speech, music or cash register bell.'],
  ['service_purchase_rise.mp3', 1.5, 'Satisfying game shop fuel or repair service: gentle tool click, a short flowing upward refill sound and three rising luminous notes resolving warmly. Tactile and clean. No speech, music or harsh alarm.'],
  ['upgrade_purchase_rise.mp3', 1.7, 'Satisfying game vehicle upgrade: a brief neat mechanical ratchet climbing upward, three increasingly bright notes and a confident shimmering resolution. Polished but grounded. No speech, music, explosion or harsh transient.'],
  ['vehicle_purchase_rise.mp3', 1.8, 'Satisfying game purchase of a new vehicle: small key click, a fuller three-note ascending brass-and-glass flourish, ending in a warm confident resolved chime. Rewarding and celebratory but not loud or cinematic. No speech or music.'],
  ['ui_soft_select.mp3', 0.7, 'Subtle polished game menu selection sound: one soft tactile wooden click with a tiny upward glassy ping. Very short, gentle, no speech, music or harsh beep.'],
  ['ui_soft_back.mp3', 0.7, 'Subtle polished game menu back sound: one soft tactile click and a tiny descending muted glassy note. Very short, gentle, no speech, music or harsh beep.'],
  ['ui_shop_open.mp3', 1.0, 'Warm understated game shop opening sound: a soft door chime with a small rising two-note welcome, cozy and brief. No door slam, speech, music or loud bell.'],
  ['ui_purchase_fail.mp3', 0.8, 'Gentle game purchase unavailable sound: a small rounded low click followed by a quiet descending muted note. Clear but not punishing, no speech, music or buzzer.'],
  ['ui_pause.mp3', 0.8, 'Subtle game pause sound: a soft rounded downward two-note glassy tap with a short cushioned tail. Calm and clean, no speech, music or alarm.'],
  ['ui_resume.mp3', 0.8, 'Subtle game resume sound: a soft rounded upward two-note glassy tap with a short confident tail. Calm and clean, no speech, music or alarm.'],
  ['ui_restart.mp3', 1.0, 'Game restart confirmation sound: a gentle quick upward sweep resolving in a bright clean single chime, positive and brief. No speech, music or harsh whoosh.'],
];

for (const [file, duration_seconds, text] of sounds) {
  if (await access(join(here, file)).then(() => true, () => false)) {
    console.log(`Keeping existing ${file}`);
    continue;
  }
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_text_to_sound_v2', duration_seconds,
      prompt_influence: .75, loop: false }),
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 8_000)
    throw new Error(`${file}: ElevenLabs returned no usable audio`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
