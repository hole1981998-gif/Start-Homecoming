import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const env = await readFile(join(root, '.env'), 'utf8');
const key = env.match(/^ELEVENLABS_API_KEY\s*=\s*([^\r\n#]+)/m)?.[1]?.trim();
if (!key) throw new Error('ELEVENLABS_API_KEY is missing');

const prompt = 'Seamless loop of a dense tropical rain shower heard outdoors on an open road. A continuous broad, full-bodied wash and soft roaring hiss of heavy rainfall at steady intensity. Natural diffuse stereo ambience. No isolated close droplets or sharp taps, no dripping, no puddle splashes, no tin roof, no thunder, no wind, no voices, no traffic, no music, no onset or ending.';
const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
  method: 'POST',
  headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: prompt, model_id: 'eleven_text_to_sound_v2',
    duration_seconds: 12, prompt_influence: .65, loop: true }),
});
if (!response.ok) throw new Error(`ElevenLabs sound generation failed: HTTP ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (!response.headers.get('content-type')?.includes('audio') || bytes.length < 10_000)
  throw new Error('ElevenLabs did not return usable audio');
await writeFile(join(here, 'rain_shower_loop.mp3'), bytes);
console.log(`Generated rain_shower_loop.mp3: ${bytes.length} bytes`);
