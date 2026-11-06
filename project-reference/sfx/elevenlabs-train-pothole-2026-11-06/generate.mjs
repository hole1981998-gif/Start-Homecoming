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
  ['pothole_light_c.mp3', 1.1, false, 'Immediate small scooter tire pothole impact: a woody tok and short loose plastic mudguard chatter, quick natural decay. Clear dry close sound, no buildup, engine, voice, music or rain.'],
  ['pothole_light_d.mp3', 1.1, false, 'A motorcycle wheel kicks over a deep road hole: instant hollow rubber thump, a sharp fork clack and two little rattles. Tactile and short, no buildup, engine, voice, music or horn.'],
  ['pothole_medium_c.mp3', 1.2, false, 'A passenger car strikes a pothole at speed: immediate rubber tire slap, one solid suspension knock and brief dashboard buzz. Dry close foley, no lead-in, engine, voice, music or explosion.'],
  ['pothole_medium_d.mp3', 1.2, false, 'Short clear car pothole sound: instant low wheel thud, a higher chassis click and a quick tail of loose panel rattling. Realistic road foley, no lead-in, voice, engine, horn or music.'],
  ['pothole_heavy_c.mp3', 1.3, false, 'Heavy delivery truck wheel drops into a road hole: immediate deep tire thump, sprung axle clank and brief body rattle. Clear close impact, no lead-in, voice, engine, horn, music or cinematic boom.'],
  ['pothole_heavy_d.mp3', 1.3, false, 'A bus hits a rough pothole: instant double low rubber knock with a metallic suspension jolt and two short interior rattles. Natural heavy vehicle foley, no lead-in, voice, engine, horn or music.'],
  ['train_horn_approach.mp3', 2.2, false, 'A real train gives one clear sustained horn blast while approaching a road crossing in the distance, with a natural airy fade. Broad low-mid railway horn, audible through rain, not an alarm. No speech, music, crash or wheel rhythm.'],
  ['train_wheels_clack_loop.mp3', 4.0, true, 'Seamless constant loop of a train moving over rail joints close to a road crossing: very clear repeating cha-chunk cha-chunk steel wheel rhythm, subtle squeal of wheel flanges and low carriage rumble. No beginning or ending flourish, no horn, music, voices or crash.'],
];

for (const [file, duration_seconds, loop, text] of sounds) {
  if (await access(join(here, file)).then(() => true, () => false)) continue;
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_text_to_sound_v2', duration_seconds,
      prompt_influence: .82, loop }),
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${(await response.text()).slice(0, 220)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 8_000)
    throw new Error(`${file}: ElevenLabs returned no usable audio`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
