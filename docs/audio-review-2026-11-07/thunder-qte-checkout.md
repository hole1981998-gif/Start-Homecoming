# Audio check — thunder, turn QTE, checkout (2026-11-07)

Revision under review: `codex/thunder-qte-cash-audio`, based on `56cc7d8`; seed 17; standard audio sliders at 100%.

## Observed

- Generated `qte_turn_confirm.mp3` (0.65 s request) and `cash_checkout.mp3` (1.2 s request) with ElevenLabs Sound Effects v2. The UI path now requests the turn cue only when `selectTurn` changes the run; the four successful purchase categories request the checkout cue. Failed purchases keep their own cue.
- In the in-app browser on `http://127.0.0.1:5173`, `?scenario=junction&seed=17`: started the run, accelerated with W, pressed Q through the approach, and saw `ĐÃ CHỌN TRÁI` at 9 m remaining. The road, speed, fuel and junction HUD updated. Browser automation cannot judge the sound's perceived loudness; the source path and triggering are covered by the audio test.
- In `?scenario=shop&seed=17`: opened the shop with R, bought fuel, observed money 4000.5 → 3880.5 and fuel 1.0 → 5.0 L. In `?scenario=crash&seed=17`, the rider fell, HP dropped, then returned; menu restart restored the initial run.
- `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` exit 0 (433/433, 79 files); `pnpm build` exit 0. Build reported the existing large chunk warning.

## Self-review — game design

The QTE cue is tied to a successful choice, so early or repeated presses do not falsely confirm a turn. The louder storm remains on the ambience slider; the rain setting and strike timing are unchanged. Proposal for the next listening pass: compare thunder and checkout in a normal run with music and voices active before changing global mix levels again.

## Self-review — UI/UX

The selected Q/E branch remains visible, so sound is extra confirmation rather than the only feedback. The purchase still shows money and resource changes. Priority: verify the perceived timing and loudness of both generated clips on the player's speakers; browser automation verified interaction and asset routing but cannot replace that listening check.
