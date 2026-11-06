# Reward and UI audio review — 6 November 2026

**Branch:** `codex/reward-sfx-remix`, based on remote main `9791eab` plus current local shop music branch `ddb9e18`. **Scenarios:** `?scenario=items&seed=17` and `?scenario=shop&seed=17`. The owner explicitly requested ElevenLabs reward/UI sounds and a louder thunder/recent traffic/shop mix. No simulation or balance values changed.

## Audio changes

Fourteen ElevenLabs Sound Effects v2 MP3s are stored under `project-reference/sfx/elevenlabs-rewards-2026-11-06/`. Seven rising cues cover roadside fuel, repair, passenger boarding, shop item purchase, service, upgrade, and vehicle purchase. Quieter UI sounds cover selection/back, shop open, purchase fail, pause/resume and restart; related category/help/card/toggle actions reuse these short cues. Resource-loss UI remains silent where a physical hazard impact already plays. Distant thunder rises from 1 to 1.4, shop jazz from 0.78 to 0.95, and recent traffic cues gain roughly one step. Rain is unchanged.

## Checks actually run

| Check | Result |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm build` | Pass, exit 0; existing large chunk advisory |
| `pnpm exec vitest run --configLoader native tests/audio-director.test.ts tests/audio-feedback.test.ts --reporter=dot` | Pass, 9/9 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, exit 0; 79 files, 429/429 tests |

## Manual browser check

Codex in-app browser on port 5179: started the items scenario, dismissed the safe first-use cards and observed the run advance. Opened the shop fixture with R near the shop, bought fuel, and observed money decrease by 120 with fuel increase by 4 L. The reward audition page loaded all 14 audio controls. **CHƯA KIỂM TRA THỦ CÔNG:** perceived loudness and pleasantness through speakers, exact overlap with NPC voices and shop jazz, native MP3 audition by ear, full failure/restart and tab switching. The computer-use surface exposes visual state but no audio capture.

## Codex self-review

**Game design, opinion based on triggers and observed shop flow:** Distinct upward rewards should clarify successful pickup/purchase without changing economy or hazard pacing. The increased thunder and traffic levels may compete with music in dense scenes; listen in a normal run and the stress scenario and reduce individual cues if they mask hazard warnings or voice lines. The UI reward sound should remain shorter than the shop action cadence.

**UI/UX, opinion based on live shop and items views:** The shop transaction updated money/fuel in place and the player still has the visual feedback when audio is muted. The shared SFX slider controls these sounds while music/ambience remain separate. Priority for listening QA is whether an unavailable purchase is clearly different from success and whether repeated category/menu taps feel too busy. No UI layout change is proposed.
