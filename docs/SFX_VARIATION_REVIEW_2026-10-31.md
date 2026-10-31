# Road SFX variation — 30–31 October 2026

Status: owner rejected the voice lines after listening, so all voice playback and voice assets have been removed from this branch. Road SFX remain a trial mix. No simulation, balance, visual warning, or UI layout change is intended.

## Follow-up mix after owner feedback, 31 October

- Water entry was too abrupt and sounded like a door slam. All light, medium and heavy entry takes now enter at roughly one third of their former level, rise over about 0.3 seconds and pass through a 1.8 kHz low-pass filter. The sustained rotating water loops are unchanged.
- Fuel, repair, passenger pickup and successful shop interactions use new short local WAV cues with three or four ascending notes. Fuel has a soft liquid texture, repair a small metallic edge, passenger a friendly pluck, and shop a longer resolution. The generator is reproducible and uses no external API.
- Fuel/repair and passenger pickups no longer stack the generic resource/reward UI sound on top. Shop service, upgrade, item purchase and vehicle purchase retain their existing event routing; only their successful sounds change. Failed purchases keep their separate failure cue.
- These are mix decisions for owner audition, not a claim that the sounds are final. No gameplay/economy values or visual cues changed.

### Verification of follow-up mix

- Windows / Node 24 / pnpm 11, final audio diff: `pnpm lint` exit 0, `pnpm typecheck` exit 0, `pnpm test --maxWorkers=2 --reporter=dot` exit 0 (40 files, 272 tests), `pnpm build` exit 0. Three superseded pickup MP3s are excluded from the production bundle.
- In-app browser, seed 17: `p62-water-baseline` start, hold W through water, reached 130 m, fuel 7.2→4.8 L, restart restored 0 m and 7.2 L; no console error. `supplies` start and hold W: fuel 0→4.2 L and HP 30→56, proving both pickups triggered; no claim about subjective sound quality.
- `shop`: start, press R near the shop, bought fuel (1→5 L, 4000→3880 money) and repair (30→50 HP, 3880→3740 money); no console error. `passenger`: start and press F, riders 1/2→2/2 with +1 cue; no console error. `coast`: started, reached fuel end at 26 m, result modal appeared and restart returned to active play; no console error.
- Self-review, game design: the rising reward motif reinforces successful actions without changing reward size or adding pressure. Self-review, UI/UX: the distinct fuel/repair/passenger/shop timbres and existing HUD resource change keep outcomes legible; the sound itself needs owner audition to judge timing and satisfaction.

## Changes

- Water: three entry takes for each light, medium and heavy tire class. Each wet contact rotates takes. Shallow and deep water each have three five-second loop-enabled source files. During a continuous puddle the active loop rotates every 3.5 seconds with a gain crossfade; the next puddle starts on a different layer. Wet contact still controls start and fade-out.
- Wind: two seven-second loop-enabled source files alternate with a gain crossfade every nine seconds. Existing gust cue remains separate. MP3 loop endpoints are tapered after decoding.
- Impacts: second takes for light, medium and heavy vehicle collisions, potholes, barrier, crate, barrel, ambulance, vendor cart, pedestrian contact and driver fall. Take selection is presentation-only and alternates per cue. This does not change damage or collision logic.
- NPCs now have only the existing visual cues and nonverbal SFX. No dialogue is imported or played by the game.

## Evidence and limits

- The focused audio test covers three water roll layers, three skim entry takes, wind alternation, collision alternation, and confirms NPC interactions fetch no voice asset.
- Browser: in-app browser, seed 17, `p62-water-baseline`: started and held W, distance 0→110 m, fuel 7.2→4.9 L, no console errors. `force-car-ram`: started and held W, HP 184→164, restart restored 0 m and 184 HP, no console errors. `p62-coast`: started and held W; fuel reached 0, the run ended after 25 m of coasting and showed the result modal, no console errors. These checks prove the game still responds and scenarios run; they do not prove sound quality by ear.
- After voice removal: in-app browser, `force-car-ram`, seed 17, started and held W; HP 184→164, restart restored 0 m and 184 HP, no console errors. Browser audio cannot be assessed by ear here; runtime and build checks below verify no voice file is referenced.
- Listening page: `project-reference/sfx/elevenlabs-2026-10-29/LISTEN_ALL.html`. The voice section has been removed. Subjective SFX quality and loop seam quality still require the owner's ears.
- The source audio comes from ElevenLabs. The key stays in ignored `.env`; generated MP3 files and scripts contain no key.

## Self-review

- Game design: rotating takes reduces obvious repetition without consuming gameplay RNG. Removing dialogue prevents distracting or incorrect NPC delivery. No balance changes proposed.
- UI/UX: water, wind, impacts and NPC interaction retain visual cues. The audio listening page is for review, not a gameplay UI.

## Gate status after voice removal

- `pnpm lint`: exit 0.
- `pnpm typecheck`: exit 0.
- `pnpm test --maxWorkers=2 --reporter=dot`: exit 0, 40 files / 272 tests.
- `pnpm build`: exit 0.
- Production assets contain 0 selected voice MP3 files; `src` and production JavaScript contain 0 voice runtime references.
- `git diff --cached --check`: exit 0. Staged text scan found no `sk_` secret pattern; `.env` is ignored and unstaged.

CI and review status belong in the PR or handoff. Merge requires human approval and is not performed here.
