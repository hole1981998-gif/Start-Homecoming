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
  ['pothole_light_a.mp3', 1.1, 'A small motorcycle wheel hits a pothole immediately: crisp rubber-and-metal clack at the very start, then a brief loose suspension rattle. Dry close roadside recording, clear impact, no engine, music, speech, horn, rain or cinematic boom.'],
  ['pothole_light_b.mp3', 1.1, 'A light scooter strikes a road pothole: instant sharp tire thup and two quick plastic bodywork rattles, decaying naturally. No lead-in, no engine, speech, music, horn, rain or crash.'],
  ['pothole_medium_a.mp3', 1.2, 'A passenger car wheel drops into a pothole immediately: firm low rubber thud at the start, followed by a clear short suspension and dashboard rattle. Natural close road sound, no lead-in, engine, voice, music, horn or explosion.'],
  ['pothole_medium_b.mp3', 1.2, 'A small car hits a deep pothole: immediate solid tire knock, a brief chassis clunk and two rattling aftershocks that fade quickly. Realistic tactile road recording, no lead-in, engine, voice, rain, music or horn.'],
  ['pothole_heavy_a.mp3', 1.3, 'A heavy truck wheel drops into a pothole immediately: deep heavy tire thump followed by a clear metal suspension clank and short cargo-bed rattle. Natural close roadside sound, no lead-in, engine, music, voice, horn or explosion.'],
  ['pothole_heavy_b.mp3', 1.3, 'A large bus rolls over a broken pothole: immediate deep double wheel knock, chassis jolt, then brief loose panel rattle. Realistic, punchy but not cinematic; no lead-in, engine, speech, music, rain or horn.'],
];

for (const [file, duration_seconds, text] of sounds) {
  if (await access(join(here, file)).then(() => true, () => false)) continue;
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_text_to_sound_v2', duration_seconds,
      prompt_influence: .85, loop: false }),
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 8_000)
    throw new Error(`${file}: ElevenLabs returned no usable audio`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
