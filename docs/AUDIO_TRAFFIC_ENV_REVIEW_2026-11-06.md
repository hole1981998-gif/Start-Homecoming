# Traffic environment audio review — 6 November 2026

**Revision under test:** `codex/traffic-world-audio`, based on remote main `9791eab` plus the current `feature/elevenlabs-world-sfx` sound branch (`71bf3a6`). **Config:** `?scenario=stress&seed=17`; this stress scenario is intentionally unbalanced and is not evidence for normal road density.

## Changed behavior

Three new ElevenLabs horns alternate with existing horns by vehicle class. Horns have a global 4.5 second gap and fire at most once per traffic entity. Three new engine pass-bys replace the reused coasting/wind clips when traffic actually crosses the player's position. Two new traffic-versus-obstacle hits alternate with existing collision clips when traffic contacts a jam, train, accident, or broken vehicle. Contact sets prevent repeated hits while the same contact remains active. Potholes and traffic-versus-traffic collisions keep their existing cues and driver voices. No simulation, balance, warning, or UI behavior changed.

## Checks actually run

| Check | Result |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm build` | Pass, exit 0; Vite reported the existing large chunk advisory |
| `pnpm exec vitest run --configLoader native tests/audio-feedback.test.ts tests/audio-director.test.ts --reporter=dot` | Pass, 9/9 |
| `pnpm exec vitest run --configLoader native tests/discovery.test.ts --reporter=dot` | Pass, 1/1 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 429/429 across 79 files |

The default parallel `pnpm test` attempt timed out in two unrelated DOM tests while the full suite loaded the machine. Both passed in isolation; the full suite passed with two workers. The earlier sound test assertion was adjusted to the new, longer horn gap before the passing run.

## Manual browser check

In the Codex in-app browser at `http://127.0.0.1:5177/?scenario=stress&seed=17`, the run started, accepted an A steering input, advanced its distance and resources, and showed nearby traffic on the road. The browser console showed no errors. A first-use hazard card opened safely and then timed out. **CHƯA KIỂM TRA THỦ CÔNG:** audible quality of each sound in the browser, volume against rain/music, a complete failure/restart, and exact hearing distance. The computer-use surface provided visual state but no audio capture. The eight isolated files can be heard at `/project-reference/sfx/elevenlabs-traffic-2026-11-06/LISTEN.html`.

## Codex self-review

**Game design, opinion based on code and the stress scene:** Fewer repeated horns and distinct passing weights should make traffic easier to parse without increasing encounter frequency. The 4.5 second global horn gap may suppress an approaching vehicle's horn when traffic is dense; visual warning remains. Test next in a normal seed and the stress seed while listening at normal volume, checking whether car, small vehicle and truck passes feel proportional and whether a useful horn is missed.

**UI/UX, opinion based on the current browser view:** Road, vehicle silhouettes, speed, distance and resources remained visible during the stress run. The new sounds do not replace any visual hazard cue. Priority for the next playtest is to check whether rain/music masks approach horns and whether a collision overlaps driver speech. No UI layout change is proposed from this audio-only pass.
