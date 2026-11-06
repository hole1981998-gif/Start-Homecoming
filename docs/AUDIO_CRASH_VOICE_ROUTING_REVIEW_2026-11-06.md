# Crash voice routing review — 6 November 2026

Revision: `feature/audio-variation-voices` (working tree before commit). Seed: 17 for the audio test fixture.

## Observed issue and fix

- The audio layer inferred a roadside collision from relative positions sampled on separate frames. That could produce a scream without a physics hit. Roadside screams now follow the `lastHit` transition and `hitByPlayer` marker produced by the physics integration.
- Player crash screams remain immediate. Return and abandonment lines wait for `crash` to clear, which is the simulation's driver-remount transition. Each crash roster is consumed once.
- Voice take selection previously counted per rider, so every new rider started with the same first take. The count now belongs to event plus actor, with a seed-based starting take. A supplied group containing one take still has one possible sound.
- Kicked passengers and traffic wreck passengers retain their separate scream paths. A wreck passenger scream requires a newly observed nearby entity; a kicked passenger must be near the player.

## Automated observation

`tests/audio-feedback.test.ts`: position-only drive-by produces no scream; a confirmed player hit produces one; crash emits player and rider screams; remount emits two return lines and one abandonment line; a later update emits no duplicate; two same-actor callers select different takes.

Windows: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --reporter=dot --testTimeout=15000` exit 0 (422 tests in 76 files); `pnpm build` exit 0 (existing Three.js chunk-size warning).

Manual browser: in-app browser at `http://127.0.0.1:5175/?scenario=crash&seed=17`. Started run; HUD changed from 1/2 to 0/2 with 20 HP lost and the crash recovery cue; after remount, HUD returned to 1/2 and acceleration resumed. Esc paused the run, and “Chơi lại từ đầu” reset distance, HP, fuel, and score. In `?scenario=passenger&seed=17`, the run started and advanced, but the F input arrived after the pickup window, so that interaction was not verified manually. Browser automation cannot judge speaker output or a crash with passengers; automated audio assertions cover routing, and subjective mix still needs listening playtest.

## Self review

Game design: The event-aligned scream gives clearer cause and effect without changing collision balance or difficulty. The test cannot judge how convincing the spoken delivery sounds in the full mix.

UI/UX: Audio is supplementary to the existing visual collision and rider state. Priority for the next playtest is checking whether a return/abandon line stays intelligible amid rain, music, and multiple riders; if it is masked, tune mix or stagger speech without delaying the event trigger.

This is Codex's review of code and automated fixtures, not an independent sound director review.
