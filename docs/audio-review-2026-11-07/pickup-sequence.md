# Audio check — repair, heavy engines, passenger pickup (2026-11-07)

Revision under review: `codex/pickup-sequence-repair-heavy-mix`, based on `84f9708`; seed 17; standard sound sliders at 100%.

## Source mapping

The four user-supplied Đuc Huy takes are copied unchanged into `project-reference/sfx/owner-pickup-voices-2026-11-07/`:

| Game file | Supplied recording time |
| --- | --- |
| `pickup_01.mp3` | 09:03:58 |
| `pickup_02.mp3` | 09:04:58 |
| `pickup_03.mp3` | 09:05:43 |
| `pickup_04.mp3` | 09:06:09 |

## Observed

- In-app browser, `http://127.0.0.1:5173/?scenario=passenger&seed=17`: started the run, pressed F, and observed the passenger count change from 1/2 to 2/2 and the pickup confirmation. This confirms the input and HUD flow; the browser automation cannot judge the recorded sound's subjective loudness.
- In `?scenario=crash&seed=17`: the rider fell, the count changed to 0/2 and HP dropped from 123 to 103; the menu's restart button restored the original run values.
- In `?scenario=coast&seed=17`: fuel reached zero, the run ended after the 25 m coasting allowance, and the result screen appeared. Its `Chơi lại` button started a new run of the same scenario.
- Audio test simulates the first pickup clip ending, then the thud ending, and verifies the passenger thank-you line is created only afterward. A rider leaving before the first clip ends suppresses the late thud/voice. The four-take selector covers all four takes without an immediate repeat.
- Repair pickup gain is 1.6 vs. 1.0 previously. The heavy player engine gain multiplier is 0.85 vs. 1.5 previously; motorcycle/car mix settings are unchanged.
- `pnpm lint`: exit 0. `pnpm typecheck`: exit 0. `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot`: exit 0, 434/434 tests across 79 files. `pnpm build`: exit 0 with the existing chunk-size warning.

## Self-review — game design

The pickup order now makes a short feedback sequence instead of stacking the thank-you line over the new take. Its total duration follows the supplied recording plus the thud, so the thank-you may arrive later than a very quick next encounter. Proposal: after an in-game listening pass, trim pauses in the supplied takes if that delay disrupts the driving rhythm; keep the original files as reference.

## Self-review — UI/UX

The passenger count and pickup toast remain the immediate feedback, regardless of audio timing or mute. The repair item's resource feedback remains visible. Priority for player review: compare repair pickup against fuel pickup, and truck/bus/container engines against rain and music at the default slider settings.
