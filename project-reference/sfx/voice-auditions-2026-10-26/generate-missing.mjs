// Short Vietnamese NPC lines for interactions absent from the transferred audition pack.
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const env = await readFile(join(here, '..', '..', '..', '.env'), 'utf8').catch(() => '');
const key = process.env.ELEVENLABS_API_KEY ?? env.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, '');
if (!key?.startsWith('sk_')) throw new Error('ELEVENLABS_API_KEY is missing from local .env');
const sarah = 'EXAVITQu4vr4xnSDxMaL';
const lines = {
  vendor_near_a: [sarah, 'Ê, né gánh hàng coi!'],
  vendor_near_b: [sarah, 'Trời ơi, hàng tôi!'],
  vendor_hit_a: [sarah, 'Ủa, tông thiệt luôn hả?'],
  vendor_hit_b: [sarah, 'Hàng rong chứ đâu phải bowling!'],
  passenger_ignored_a: [sarah, 'Ê, quay lại coi!'],
  passenger_ignored_b: [sarah, 'Xe ơi, bỏ tôi thiệt hả?'],
  passenger_fall_a: [sarah, 'Ê, coi chừng té!'],
  passenger_fall_b: [sarah, 'Ui da, lái cẩn thận!'],
  storm_crowd_a: [sarah, 'Mưa dữ quá trời!'],
  storm_crowd_b: [sarah, 'Gió lớn ghê, vô nhà đi!'],
};
for (const [name, [voice, text]] of Object.entries(lines)) {
  const target = join(here, `${name}.mp3`);
  try { await access(target); console.log(`skip ${name}`); continue; } catch { /* generate */ }
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: .36, similarity_boost: .7, style: .55, use_speaker_boost: true } }),
  });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}: ${(await response.text()).replaceAll(key, '[redacted]').slice(0, 300)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024 || !(bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 0xff)) throw new Error(`${name}: invalid MP3`);
  await writeFile(target, bytes);
  console.log(`generated ${name}: ${bytes.length} bytes`);
}
