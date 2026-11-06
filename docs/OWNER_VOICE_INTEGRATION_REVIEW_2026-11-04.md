# Owner voice integration review — 4 November 2026

Revision under review: `750759c` (`feature/audio-variation-voices`, merged from `origin/main` at `ed59ab7`).
Seed/config: `?scenario=passenger-crash-car&seed=17` and `?scenario=passenger&seed=17`, Vite at 127.0.0.1:5175, ChatGPT in-app browser on Windows.

## Observed

- The latest UI loaded with the audio effect and rain/wind sliders on the start screen. Starting the fixture entered gameplay, showed four occupants and then two after the scripted collision. Fuel, HP, score and distance continued to update. Browser logs reported no error or warning during that pass.
- In the passenger fixture, pressing F near the roadside person changed occupancy from 1/2 to 2/2; pressing G changed it back to 1/2. The game showed the correct +1/−1 visual cues. Escape paused the run, and the new UI's restart button reset distance to 0, money to 280 and fuel to 7.15 L. Browser logs remained clear.
- The owner-supplied audition page loaded. The first MP3 reached browser readyState 4, had no media error, and played at 1.5× with pitch preservation enabled.
- Automated audio tests cover the distance curve and confirm that a roadside voice uses an owner asset and fades behind the player. They do not prove perceived loudness or line quality.

## Self review — game design

**Observation:** Voice events follow existing simulation outcomes; no spawn, damage, economy, RNG or difficulty rule changed. Roadside call level rises with approach and fades after passing. Abandonment is allowed to carry from behind. **Assessment:** Keeping these voices on the SFX bus lets players mute them without losing hazard information, which remains visual. Nearby traffic collisions can trigger a driver response, but repeated collisions should be checked by ear for overlap. No balance change proposed.

## Self review — UI/UX

**Observation:** The new UI presents the two sound sliders on the start modal. The fixture's occupancy and resource changes remained readable after the collision; pickup, drop, pause and restart showed their expected visible states. **Priority P2:** Listen on a real game pass and tune voice versus engine/rain mix, especially the long lines; a browser state check cannot judge that. Stranded-rider, traffic-ejection and terminal-result voice timing still need a human listening pass.

## Limits

The long comedic takes are preserved in full and capped at 1.5× playback (1.9× laughter), so a few exceed the earlier 1–1.5 second target. The `nam_onboard_chatter` clip accompanies boarding but does not literally say thank you. The owner should audition those choices and request edits if they feel off. This is Codex's self review from the named browser states and tests, not an independent sound director or a human listening test.
