# Water SFX variation review — 30/10/2026

## Direction and implementation

Owner feedback: in-game water still feels dull. Before this pass, every vehicle and puddle used the same motorcycle entry and the same five-second loop. This pass generated six new cues with ElevenLabs `eleven_text_to_sound_v2`: skim, broad wash, heavy splash, shallow rolling loop, deep rolling loop, and exit spray. Prompts and duration/loop flags are in `project-reference/sfx/elevenlabs-2026-10-29/generate.py`; the original two water files remain for comparison in `LISTEN.html`. The first quiet skim take is under `alternatives/`.

The presentation layer now chooses entry by vehicle weight and puddle footprint, then scales the splash by current speed. Small puddles under two-wheel vehicles use skim; heavy vehicles use heavy; other entries use wash. Long/wide puddles or heavy vehicles use the deep rolling layer; smaller puddles use shallow. Both rolling sources stay active and crossfade as contact changes. Their decoded buffer edges get a five-millisecond taper to prevent an MP3 endpoint click. The entry comes from each entity's `touching` transition, so a later feedback event cannot overwrite it in the same render frame. Exit spray plays once when the last water contact ends. A short global cooldown intentionally combines entries on overlapping patches; it does not promise a separate splash for every patch. No simulation, balance, visual cue, or random stream changed.

## Technical checks and evidence

- Six API calls succeeded and saved valid MP3 payloads locally; the API key stayed in ignored `.env.local` and the process environment. A second skim take replaced the first because its decoded RMS was only 0.015, versus 0.055 for the new take.
- Edge decoded all six new MP3s: entry durations 1.00/1.36/1.68 s, loops 5.00 s, exit 1.08 s. Raw decoded loop endpoint differences were 0.007 FS for shallow and 0.072 FS for deep; both are below the 99th percentile of adjacent sample changes within each clip (about 0.17 FS). The runtime taper zeros the boundary samples. These numbers do not prove inaudible seams or good timbre.
- Edge fixture `p62-water-baseline`, seed 17: started, dismissed first water card, held W through the puddle, reached 144 m, fuel 7.2→4.8 L. Network showed runtime requests for `water_entry_wash`, both rolling layers, and `water_exit_spray`; no page error. Both loops are fetched so the mixer can crossfade, even though only one is audible at a time. A separate run reached 90 m, paused via Escape and restarted via the visible button; distance returned to 0 m and Ready state, without page error. Failure was not manually exercised in this pass.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check`: pass on final code. `pnpm test --maxWorkers=1 --reporter=dot`: 40 files, 271 tests pass. The first full run had a test assertion issue (`-0`) and a discovery-test timeout while Edge ran concurrently; after fixing the assertion and closing Edge, the second full run passed. Focused audio and discovery tests also passed.

## Self-review and limits

- Game design: patch size and vehicle weight now have audible presentation differences without affecting damage, fuel, spawn, or RNG. The water warning card and visual water cue remain authoritative for hazard recognition.
- UI/UX: first-contact cue is retained even if a later event changes `feedbackKind`; overlapping patches are rate-limited. The old one-size-fits-all five-second repetition is replaced with crossfading layers.
- This is a **technical self-review**. The agent has no access to audible playback in its environment and has not judged timbre, mix masking, or loop seams by ear. The project owner should audition both loops on repeat and the water fixture with engine/rain in the game; any subjective approval remains open.
