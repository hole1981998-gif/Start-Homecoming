# Audio reconciliation — 6 November 2026

## Source and scope

The earlier `feature/elevenlabs-world-sfx` commit `da5c989` was based on `main` and used the 29 October audition pack. That did not contain the audio changes the owner described from the morning of 6 November. This revision merges `origin/feature/audio-variation-voices` at `0e7a7d6` (07:55 +0700, 6 November) into the feature branch. The newer NPC voice lines, weight-based puddle loops, ElevenLabs rain and distant thunder, and owner-provided `nimble_pursuit.mp3` remain active.

The duplicate `GameAudio` player and its `public/audio` copies were removed. `AudioDirector` is the sole runtime player. The old locally synthesized WAV packs (`procedural-auditions-2026-10-28`, `reward-pickups-2026-10-31`, and `power-traffic-2026-10-31`) were removed. Every imported runtime audio file now comes from the retained ElevenLabs MP3 sets or the owner's music MP3. Internal cue names still end in `.wav` for compatibility; they resolve to MP3 files.

Two new ElevenLabs clips from the initial feature are retained for moving NPC footsteps and train approach. Two more ElevenLabs horn variants were generated for approaching traffic. All four clips and their generation IDs are listed in `project-reference/sfx/elevenlabs-world-2026-11-06/README.md`.

## Behavior and limits

The sound director plays footstep and train approach cues once per entity within range. Collisions, train impact, water, weather, voices, and music keep the newer audio branch's routing. Car and light traffic share one horn variant; heavy traffic uses another. Existing ElevenLabs coasting/wind clips are reused for traffic passing. UI cues with no fitting ElevenLabs replacement are silent. The synthesized engine layers are replaced by one existing ElevenLabs engine texture with speed-dependent playback rate. These are conservative audio decisions, not gameplay balance changes.

## Verification

- Local Edge headless via Chrome DevTools Protocol, normal game with seed 17: start screen had three audio sliders; started a run, held W, observed 60.6 km/h and 13 m; Escape opened pause; restart reset distance to 0. `docs/audio-review-2026-11-06/latest-driving.png` records the driving screen. The screenshot only supports layout/readability; input behavior was observed separately through key events and DOM state.
- Edge, `?scenario=events-train&seed=17`: dismissed four first-use/safety cards, held W, reached the actual `Va chạm tàu hoả` result at 68 m, then clicked restart and observed 0 m. `docs/audio-review-2026-11-06/latest-outcome.png` records the result screen. This scenario is a DEV fixture, not a sampled normal run.
- Edge resource requests in a separate stress-scenario check included `engine_bike_texture_loop.mp3`, `rain_shower_loop.mp3`, `distant_thunder_loop.mp3`, and `nimble_pursuit.mp3`. The first stress check hit an onboarding card, so it was not used as evidence of successful driving.
- Automated audio tests cover water contact, voices, collisions, horn routing, one-time footsteps/train approach, and pause/reset. Full suite and final build results are recorded in the handoff when complete.

## Self review

Game design: No hazard timing, RNG, or damage values changed. Earlier audio must not be the only hazard cue; the existing visual warning paths remain. Train approach and NPC steps have one-shot limits to reduce repetition. Listen in a real speaker/headphone session before judging mix quality; automated checks show routing, not perceived balance.

UI/UX: The three audio sliders appear on start/pause/help/result overlays. The driving screenshot shows clear road and near-vehicle resource indicators; the train result title and explanation remain readable. Highest-priority remaining check is whether horns and train approach are audible under rain, music, and speech at default slider levels. The headless run could not establish perceived loudness or stereo positioning by ear. This is a Codex self review based on current build and tests, not an independent designer review.
