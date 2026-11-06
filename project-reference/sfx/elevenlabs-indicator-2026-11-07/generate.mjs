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
  ['indicator_tick_crisp.mp3', 'One isolated, sharp and clearly audible car turn-signal relay click at the very start, with a brief dry plastic tail and silence afterwards. Natural small vehicle dashboard, no second click, no engine, horn, voice, music, rain or ambience.'],
  ['indicator_tick_hollow.mp3', 'One isolated, clearly audible hollow mechanical turn-indicator clack at the very start, slightly lower pitched than a crisp relay tick, then short decay and silence. Natural old vehicle dashboard, no second click, no engine, horn, voice, music, rain or ambience.'],
];

for (const [file, text] of sounds) {
  if (await access(join(here, file)).then(() => true, () => false)) continue;
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_text_to_sound_v2', duration_seconds: .65,
      prompt_influence: .8, loop: false }),
  });
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status} ${(await response.text()).slice(0, 220)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 8_000)
    throw new Error(`${file}: ElevenLabs returned no usable audio`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
