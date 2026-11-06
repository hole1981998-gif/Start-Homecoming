// Generate only the new audio variants listed in generate.py. The local .env is ignored by Git.
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const source = await readFile(join(here, 'generate.py'), 'utf8');
const env = await readFile(join(root, '.env'), 'utf8').catch(() => '');
const key = process.env.ELEVENLABS_API_KEY ?? env.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!key?.startsWith('sk_')) throw new Error('ELEVENLABS_API_KEY is missing from local .env');
for (const name of process.argv.slice(2)) {
  const line = source.split('\n').find(line => line.trim().startsWith(`"${name}":`));
  const match = line?.trim().match(/^"[^"]+": \(([\d.]+), (True|False), "([^"]+)"\),?$/);
  if (!match) throw new Error(`Unknown or unsupported prompt: ${name}`);
  const target = join(here, `${name}.mp3`);
  try { await access(target); console.log(`skip ${name}`); continue; } catch { /* generate */ }
  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: match[3], model_id: 'eleven_text_to_sound_v2', duration_seconds: Number(match[1]), loop: match[2] === 'True', prompt_influence: .55 }),
  });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}: ${(await response.text()).replaceAll(key, '[redacted]').slice(0, 300)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024 || !(bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 0xff)) throw new Error(`${name}: invalid MP3`);
  await writeFile(target, bytes);
  console.log(`generated ${name}: ${bytes.length} bytes`);
}
