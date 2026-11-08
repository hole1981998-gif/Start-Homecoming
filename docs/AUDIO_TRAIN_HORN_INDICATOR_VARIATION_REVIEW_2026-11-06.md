# Train horn, indicator loop and pothole variation review — 6 November 2026

**Branch:** `codex/train-horn-indicator-variation`, based on remote main `9791eab` plus the previously pushed sound branch `998be1b`. **Scenario:** `?scenario=p61-train-left&seed=17`. No gameplay balance, spawn or collision changes.

## Changes and reason

The previous train clip combined rolling noise without a separate horn. New ElevenLabs clips provide one 2.2-second approach horn and a distinct four-second loop with a repeating rail-wheel “cha-chunk” and light flange squeal. A train sounds its horn once after its crossing actually activates within hearing range; the wheel loop continues while a train is nearby and fades away afterward. Both predecode on approach.

The indicator used separate one-shot requests every frame. It now keeps one looping Web Audio source while A/D is held or a valid Q/E turn remains selected. It stops on release, crash, pause and route completion. Repeated keydown events cannot stack sources.

Six more ElevenLabs pothole impacts bring each light/medium/heavy group to four. The selector uses a seeded hash and rejects the immediately previous take; it does not force a 1–2–1–2 cycle. Player and NPC pothole triggers continue to choose by vehicle weight.

## Checks actually run

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm lint` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native tests/audio-feedback.test.ts tests/audio-director.test.ts --reporter=dot` | Pass, 11/11 |
| `pnpm build` | Pass, exit 0; pre-existing chunk-size advisory |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, exit 0; 79 files, 431/431 tests |

## Manual browser check

Codex in-app browser on port 5182: started the `p61-train-left` fixture, dismissed the safe first-use cards and observed the run advance from 0 to 72 m. The local audition page loaded controls for the horn, loop and all six new pothole takes. **CHƯA KIỂM TRA THỦ CÔNG:** audible horn timing, loop seam and indicator cadence on speakers, full failure/restart and dense traffic mix. Browser automation has no audio capture. The unit test verifies source lifecycle while an input is held and released, but that is not a listening test.

## Codex self-review

**Game design, inference from event gates and fixture:** The horn follows actual train activation and a distance window, so it should act as a fair cue alongside the existing train graphic. It does not alter the hazard schedule. Four seeded pothole takes should reduce recognisable repetition without injecting unseeded randomness. Listen during dense rain before raising the train further.

**UI/UX, inference from live fixture:** The original visual train warning and safety card remain intact, and sound sliders still apply. The indicator starts and stops from the same input/route state that drives the visible lights, reducing mismatch. Priority for the next human pass is whether the tick loop feels too fast or masks QTE feedback.
