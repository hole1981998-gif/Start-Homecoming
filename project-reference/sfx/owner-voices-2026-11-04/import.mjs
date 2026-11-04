import { readdir, copyFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const downloads = join(process.env.USERPROFILE ?? '', 'Downloads');
const available = await readdir(downloads);
// Explicit source take for each cue. The source MP3s remain untouched in Downloads.
const takes = [
  ['14_00_00', '', 'thanh_call_shout'],
  ['14_11_50', '', 'thanh_call_ride'],
  ['14_00_52', '(1)', 'thanh_thanks_sing'],
  ['14_12_17', '(1)', 'thanh_thanks_cry'],
  ['14_08_50', '', 'thanh_return_warning'],
  ['14_12_50', '(1)', 'thanh_return_pain'],
  ['14_09_53', '(1)', 'thanh_abandon_judge'],
  ['14_13_17', '', 'thanh_abandon_problem'],
  ['14_13_41', '', 'thanh_abandon_plead'],
  ['14_10_37', '(1)', 'thanh_laugh'],
  ['14_11_05', '', 'thanh_traffic_surprise'],
  ['14_22_40', '', 'thanh_kick_scream'],
  ['14_28_19', '', 'nam_call_here'],
  ['14_29_15', '', 'nam_call_wait'],
  ['14_30_13', '', 'nam_onboard_chatter'],
  ['14_31_43', '', 'nam_return_mutter'],
  ['14_32_40', '', 'nam_traffic_carcry'],
  ['14_34_08', '', 'nam_abandon_insult'],
  ['09_27_30', '(1)', 'nam_kick_scream'],
  ['14_27_54', '', 'nam_kick_scream_alt'],
  ['14_35_01', '', 'nam_driver_mirror'],
  ['14_35_59', '', 'thuong_driver_police'],
  ['14_36_29', '', 'thuong_driver_taunt'],
  ['14_39_20', '', 'bao_ngoc_driver_lexus'],
  ['14_40_01', '', 'bao_ngoc_driver_touch'],
  ['14_41_10', '', 'huy_kick_scream'],
  ['14_42_20', '', 'huy_kick_short'],
  ['14_42_42', '', 'huy_kick_scream_alt'],
];
await mkdir(here, { recursive: true });
for (const [stamp, suffix, target] of takes) {
  const matches = available.filter(name => name.startsWith(`ElevenLabs_2026-10-31T${stamp}_`) &&
    (suffix ? name.endsWith(` ${suffix}.mp3`) : name.endsWith('.mp3') && !/ \(\d+\)\.mp3$/.test(name)));
  if (matches.length !== 1) throw new Error(`${stamp} ${suffix}: expected one source, got ${matches.length}`);
  await copyFile(join(downloads, matches[0]), join(here, `${target}.mp3`));
  console.log(`${matches[0]} -> ${target}.mp3`);
}
