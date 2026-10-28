# Engine V2 audition and future playback

Open `LISTEN_V2.html` and hear the eight 10-second ramp previews. Each runs idle → cruise → fast → cruise → idle. The `engine-v2/` folder contains three separate 2-second loops per vehicle. All three stems for one vehicle share a sample count, pulse phase and frequency grid. `V2_MANIFEST.json` lists their exact filenames, peaks and RMS levels. The old `engine/` loops remain as V1 comparisons.

For a future audio director, start all three buffers at the **same audio clock time and offset 0**, loop them, and give them a **common playback rate**. Map normalized speed `s` from 0 (idle) to 1 (fast):

| Speed | Idle gain | Cruise gain | Fast gain | Playback rate |
| --- | ---: | ---: | ---: | ---: |
| 0 | 1 | 0 | 0 | 0.86 |
| 0.5 | 0 | 1 | 0 | 1.05 |
| 1 | 0 | 0 | 1 | 1.24 |

Interpolate gains linearly within each half of the range. Smooth `s` over roughly 85 ms and ramp gains/rates through the audio API; abrupt speed input must not cause a click. Start only the selected vehicle's three stems. On vehicle switch, crossfade whole sets and stop the old set after the fade. Keep SFX volume/mute separate from ambience and voice. The 10-second preview is rendered with these weights and rates as a proof of the transition, but runtime mixing is **not implemented** in this pack.

The `interaction-v2/` folder revises 24 obstacle, traffic and NPC cues. It deliberately mixes short (0.73–0.86 s), medium (1.00–1.65 s) and long (2.05–4.45 s) durations. Long train, wind, rolling cargo and ambulance cues have sound through the middle of their files, not a padded silent tail. Trigger each cue from its actual event or state; warning and pass-by timing needs checking in gameplay before integration. Treat these as audition drafts pending owner listening and the project's final SFX gate.
