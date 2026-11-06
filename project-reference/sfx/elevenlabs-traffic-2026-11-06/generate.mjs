import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const envPath = process.env.SFX_ENV_FILE || join(root, '.env');
const env = await readFile(envPath, 'utf8');
const key = process.env.ELEVENLABS_API_KEY ??
  env.match(/^ELEVENLABS_API_KEY\s*=\s*([^\r\n#]+)/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!key?.startsWith('sk_')) throw new Error('ELEVENLABS_API_KEY is missing');

const sounds = [
  ['horn_scooter_short.mp3', 1.2, 'One quick playful double toot from a small Vietnamese motorbike horn passing on a wet city road. Natural street recording. No speech, music, crash or rain bed.'],
  ['horn_car_urgent.mp3', 1.5, 'A mid-size car gives a brief impatient two-note horn, beep beep, on a busy wet street. Natural close vehicle horn with short tail, no voices, music, siren or crash.'],
  ['horn_truck_low.mp3', 1.8, 'A heavy road truck gives one deep short air horn honk with a rough pneumatic tail. Natural outdoor roadside recording. No voices, music, siren, impact or rain bed.'],
  ['pass_scooter.mp3', 2.5, 'A small motorcycle engine approaches, revs briefly and zips past the listener on a wet road, then recedes. Fast Doppler movement, tire hiss underneath. No horn, voices, music or crash.'],
  ['pass_car.mp3', 2.7, 'A normal passenger car engine approaches and sweeps close past the listener on a wet road, with a soft tire whoosh and clear receding engine. Natural Doppler pass. No horn, voices, music or crash.'],
  ['pass_truck.mp3', 3.2, 'A large truck approaches and passes the listener on a wet road, deep diesel engine roar and wide tire wash, then recedes. Natural Doppler movement. No horn, voices, music or crash.'],
  ['traffic_block_light.mp3', 1.8, 'A small moving car strikes a roadside metal barrier: brief tire skid, sharp metal thud and a short rattling scrape. Realistic outdoor accident, close but not cinematic. No voices, horn, music or explosion.'],
  ['traffic_block_heavy.mp3', 2.2, 'A heavy truck collides with a roadside obstruction: deep body thump, crunching metal and a short rattling settle. Realistic wet-road accident, close but not cinematic. No voices, horn, music or explosion.'],
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
      prompt_influence: .7, loop: false }),
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 10_000)
    throw new Error(`${file}: ElevenLabs returned no usable audio`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
