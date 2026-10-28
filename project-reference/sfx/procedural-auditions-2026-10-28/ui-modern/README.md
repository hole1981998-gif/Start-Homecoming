# Modern UI sound auditions

62 WAV drafts: two takes (A/B) for each of 31 UI actions. Open `LISTEN_UI.html` locally to compare. `MANIFEST.json` lists every cue, duration and intended trigger. `generate_ui.py` in the parent folder recreates the files using only Python's standard library.

## Sound direction

- Quiet, light, tactile and friendly: short warm plucks, soft filtered clicks and very small air movement. No arcade fanfare, cash-register cliché or harsh error buzzer.
- A and B share the same action identity but vary slightly in pitch, timing and transient texture. Select one take per action after listening rather than playing both.
- All cues are at most 0.76 seconds and peak below 0.34 full scale. These values are file-level audition targets, not final in-game loudness.

## Coverage

| Group | Actions | Take count |
| --- | ---: | ---: |
| Menu navigation and selection | 6 | 12 |
| Settings, help and first-discovery cards | 6 | 12 |
| Positive/negative toasts, reward and resource changes | 6 | 12 |
| Shop browsing, purchase, failure, upgrade and service | 7 | 14 |
| Inventory, pause/resume, restart and results | 6 | 12 |

The pre-existing `ui/` folder is an earlier gameplay-adjacent audition set. Compare alternatives; do not layer a `ui-modern` cue with the matching `ui/` cue at the same event.

## Trigger guidance for future integration

- `reward_small` and `reward_major` are for **discrete, meaningful rewards**. Score and money accumulate continuously while driving, so neither cue should play per meter or per tick. A major reward cue must be rare.
- `menu_hover`, `menu_move` and `slider_step` need rate limiting; hover may be disabled while driving or on touch devices. Never let a slider sound fire for every pixel.
- `toast_positive` and `toast_negative` are optional flavor. Group simultaneous events and apply cooldown. Numeric resource changes and visual feedback remain readable with UI audio muted.
- Play `purchase_success` only after a successful transaction, `purchase_fail` only after a rejected one. `vehicle_purchase`, `shop_upgrade` and `shop_service` are alternatives to the general purchase cue for those successful actions.
- UI cues belong on a separate UI or SFX bus under independent volume/mute controls. Duck ambience under important game warnings. Keep UI cues quieter than hazard warnings and future character voice.

These are audition drafts. They have passed technical file checks but **have not been listened to or integrated into the game**. Selection and mix need human listening review.
