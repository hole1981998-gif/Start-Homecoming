import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const env = await readFile(join(root, '.env'), 'utf8');
const key = env.match(/^ELEVENLABS_API_KEY\s*=\s*([^\r\n#]+)/m)?.[1]?.trim();
if (!key) throw new Error('ELEVENLABS_API_KEY is missing');

const sounds = [
  {
    file: 'distant_thunder_loop.mp3', duration_seconds: 16, loop: true, prompt_influence: .7,
    text: 'Seamless quiet background loop of a storm far beyond an open road. Deep, soft, wide thunder rolling continuously in the distance under a diffuse airy low-frequency wash. Even level at the beginning and end. No close thunder crack, no individual rain drops, no wind gust, no traffic, no voices, no music, no dramatic boom.',
  },
  {
    file: 'lightning_distant_a.mp3', duration_seconds: 5, loop: false, prompt_influence: .7,
    text: 'One distant lightning strike in a rainy outdoor landscape: a brief muted crack followed by a long soft rolling thunder tail fading into the distance. Natural, restrained, not startling. Isolated sound effect with no rain drops, traffic, voices, music or repeated strikes.',
  },
  {
    file: 'lightning_distant_b.mp3', duration_seconds: 5, loop: false, prompt_influence: .7,
    text: 'A single far-off lightning flash and thunder: a small dry snap, then a low broad rumble that slowly fades away across a stormy open road. Quiet and spacious, without a harsh close explosive transient. No rain drops, traffic, voices, music or second strike.',
  },
];

for (const { file, ...body } of sounds) {
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, model_id: 'eleven_text_to_sound_v2' }),
  });
  if (!response.ok) throw new Error(`ElevenLabs sound generation failed for ${file}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 10_000)
    throw new Error(`ElevenLabs did not return usable audio for ${file}`);
  await writeFile(join(here, file), bytes);
  console.log(`Generated ${file}: ${bytes.length} bytes`);
}
