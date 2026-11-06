import { access, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const env = await readFile(join(root, '.env'), 'utf8');
const key = process.env.ELEVENLABS_API_KEY ??
  env.match(/^ELEVENLABS_API_KEY\s*=\s*([^\r\n#]+)/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!key?.startsWith('sk_')) throw new Error('ELEVENLABS_API_KEY is missing from ignored .env');

const shared = 'Seamless steady loop of tires rolling through shallow road water at constant speed. Already moving at the start and still moving at the end. Natural close recording, continuous water and tire texture. No entry splash, impact, engine, rain, thunder, voices or music.';
const sounds = [
  { file: 'water_light_loop.mp3', text: `${shared} A light motorcycle's narrow tires make a fine quick wet hiss, delicate small ripples and tiny fast sprays. Light and agile, little bass, smooth and restrained.` },
  { file: 'water_medium_loop.mp3', text: `${shared} A regular passenger car's four tires make a broad wet rolling swish, moderate spray and a soft low tire wash. Full but controlled, clearly heavier than a motorcycle.` },
  { file: 'water_heavy_loop.mp3', text: `${shared} A heavy bus or truck's wide tires push a dense low churning sheet of water with a broad rolling roar. Deep and substantial but steady, without a dramatic splash.` },
];

for (const { file, text } of sounds) {
  if (await access(join(here, file)).then(() => true, () => false)) {
    console.log(`Keeping existing ${file}`);
    continue;
  }
  if (text.length > 450) throw new Error(`Prompt too long for ${file}: ${text.length} characters`);
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_text_to_sound_v2',
      duration_seconds: 8, prompt_influence: .7, loop: true }),
  });
  if (!response.ok) throw new Error(`ElevenLabs sound generation failed for ${file}: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 10_000)
    throw new Error(`ElevenLabs did not return usable audio for ${file}`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
