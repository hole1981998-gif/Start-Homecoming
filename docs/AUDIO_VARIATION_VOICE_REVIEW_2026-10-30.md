# Audio variation and voice integration — 30 October 2026

Status: owner requested a playable integration. These are trial mixes, not final listening approval. No simulation, balance, visual warning, or UI layout change is intended.

## Changes

- Water: three entry takes for each light, medium and heavy tire class. Each wet contact rotates takes. Shallow and deep water each have three five-second loop-enabled source files. During a continuous puddle the active loop rotates every 3.5 seconds with a gain crossfade; the next puddle starts on a different layer. Wet contact still controls start and fade-out.
- Wind: two seven-second loop-enabled source files alternate with a gain crossfade every nine seconds. Existing gust cue remains separate. MP3 loop endpoints are tapered after decoding.
- Impacts: second takes for light, medium and heavy vehicle collisions, potholes, barrier, crate, barrel, ambulance, vendor cart, pedestrian contact and driver fall. Take selection is presentation-only and alternates per cue. This does not change damage or collision logic.
- Voices: the transferred ElevenLabs short-line pack plus ten new lines. Police/militia speak on contact; passengers call near approach and complain after being passed; Grab and stranded passengers use their own lines; vendor calls when the cart is close and reacts on hit; other drivers and pedestrians react to impact; a passenger aboard reacts to a fall; bystanders comment on the storm at spaced intervals. One voice at a time, with a 1.5-second minimum start gap. Voice uses the SFX volume control, so mute works. Visual gameplay cues remain.

## Evidence and limits

- `pnpm test tests/audio-feedback.test.ts tests/audio-director.test.ts --maxWorkers=2 --reporter=dot`: pass after changes to contact/variation logic. The focused test covers three water roll layers, three skim entry takes, wind alternation, collision alternation, and selected voice triggers.
- Browser: in-app browser, seed 17, `p62-water-baseline`: started and held W, distance 0→110 m, fuel 7.2→4.9 L, no console errors. `force-car-ram`: started and held W, HP 184→164, restart restored 0 m and 184 HP, no console errors. `p62-coast`: started and held W; fuel reached 0, the run ended after 25 m of coasting and showed the result modal, no console errors. These checks prove the game still responds and scenarios run; they do not prove sound quality by ear.
- Listening page: `project-reference/sfx/elevenlabs-2026-10-29/LISTEN_ALL.html`. Browser media elements reported no error and valid durations for the new water/wind loops and selected voices. Subjective sound, Vietnamese pronunciation, and loop seam quality still require the owner's ears.
- The source audio comes from ElevenLabs. The key stays in ignored `.env`; generated MP3 files and scripts contain no key.

## Self-review

- Game design: rotating takes reduces obvious repetition without consuming gameplay RNG. Voice start cooldown avoids a constant shouted warning bed. A busy collision can still mask a short voice; assess while driving and adjust the mix after listening feedback. No balance changes proposed.
- UI/UX: water, wind, impacts and NPC interaction retain visual cues. SFX mute silences voices too. A separate voice slider could help later, but is deferred until the UI pass as requested. The audio listening page is for review, not a gameplay UI.

## Gate status on final code

- `pnpm lint`: exit 0.
- `pnpm typecheck`: exit 0.
- `pnpm test --maxWorkers=2 --reporter=dot`: exit 0, 40 files / 272 tests.
- `pnpm build`: exit 0.
- `git diff --cached --check`: exit 0. Staged text scan found no `sk_` secret pattern; `.env` is ignored and unstaged.

CI and review status belong in the PR or handoff. Merge requires human approval and is not performed here.
