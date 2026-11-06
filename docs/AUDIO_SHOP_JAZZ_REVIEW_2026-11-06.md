# Shop music review — 6 November 2026

**Source:** owner supplied `C:/Users/Admin/Downloads/Afternoon Jazz.mp3`. The game copy matched the source SHA-256 at import; no edit was made to the audio. **Branch:** `codex/shop-jazz-music`, based on remote main `9791eab` plus the current traffic sound branch `44c5017`. **Scenario:** `?scenario=shop&seed=17`.

The shop is a safe pause window. Opening it now pauses the road track and starts `afternoon_jazz.mp3` on the existing music bus with a short fade in. The track loops until the player leaves. Leaving fades jazz down and resumes the road track. A different modal, reset, or browser blur stops shop music; returning to the open shop restarts it. The shared music slider and NPC ducking apply. No shop prices, gameplay timing, warning cues, or simulation rules changed.

## Checks actually run

| Check | Result |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm build` | Pass, exit 0; existing large chunk advisory |
| `pnpm exec vitest run --configLoader native tests/audio-director.test.ts tests/audio-feedback.test.ts --reporter=dot` | Pass, 9/9 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 429/429 across 79 files |

The last context-resume guard was added after the first full run; lint, typecheck, build, targeted audio tests and the 429-test full suite were rerun successfully on the final code.

## Manual browser check

Codex in-app browser at port 5178: started the `shop` scenario, pressed R near the shop, saw the shop panel while speed was 0 and resources stayed visible, then selected “Tiếp tục lái” and observed distance/speed advance. Reopened the scenario and left the shop panel ready to audition. **CHƯA KIỂM TRA THỦ CÔNG:** hearing the jazz against shop interaction effects, the native MP3 loop seam, a full failure/restart, and tab blur/refocus audio; the computer-use surface exposes visual state but no audio capture.

## Codex self-review

**Game design:** The safe shop window is a natural place for a relaxed jazz contrast against the storm road. This is an opinion based on the game flow, not a listener review. The player should confirm whether the change feels welcoming rather than tonally detached, and whether the track level leaves purchase sounds clear. No balance change is proposed.

**UI/UX:** The shop panel and purchase controls remained visible in the manual scenario. The existing music slider controls both tracks, so there is one clear control for music volume. Verify by listening whether the fade and loop seam distract from buying or returning to the road; the visual check cannot answer that.
