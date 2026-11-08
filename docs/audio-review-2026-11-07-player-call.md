# Audio review — passenger pickup and player call

Revision under review: `codex/pickup-thud-and-player-horn` (commit pending). Seed 17, passenger scenario, local Vite build in the in-app browser.

## Observed

- Started the passenger scenario, pressed T, then F. The game continued and the rider counter changed from 1/2 to 2/2. The controls panel showed `T gọi + còi`.
- Browser automation cannot judge perceived loudness or exact acoustic synchrony. The targeted audio test verifies one matching horn and one of three voice clips per accepted T press; it verifies all three clips occur across repeated presses without immediate repetition.
- The pickup audio test verifies the person thud and one of four owner pickup clips start on the pickup event, followed by passenger thanks after the owner clip. If the rider leaves before that clip ends, thanks is suppressed.

## Self-review — game design

The new T action is flavor feedback and does not change driving, economy, collisions or RNG. The 350 ms cooldown and replacement of the previous T voice avoid stacking loud calls while still responding to a new press. The horn selection follows the active vehicle class. Listen in a live playtest to determine whether the horn masks the voice at default volume.

## Self-review — UI/UX

The controls menu and detailed instructions explain T as a combined call and horn. The command works only in the running game and ignores held-key repeats. The player still has visual driving and hazard cues; this sound is optional flavor. Browser input testing confirmed the game remained controllable and F pickup worked, but did not independently prove acoustic timing.

## Limits

No human listening review of the three provided recordings or mixed game audio was performed in this automated check. No gameplay balance values were changed.
