# Owner voice scream pass — 4 November 2026

Revision under review: feature/audio-variation-voices, seed 17, `passenger-crash-car`.

## Observed

- Added five owner-supplied MP3s without changing the Downloads originals. The audition page listed all five; Trâm's clip played in the in-app browser with media ready state 4 and no media error.
- Browser gameplay: started with four occupants, struck the scripted obstacle, then showed two occupants and HP 184 → 164. Escape opened pause; restart restored four occupants, 184 HP, 280 money and distance 0. Browser console showed no warning or error.
- Automated audio test verifies three crash riders trigger three distinct scream playback attempts, two return lines wait until riders reboard, and one abandonment line waits until the crash ends. A roadside swept contact triggers one scream; three wreck passengers trigger three screams. The test also checks that lingering screams are stopped when their rider begins dialogue.
- Owner follow-up exposed a missed roadside scream: an audio frame often advances under 25 cm, while the first implementation required over 25 cm in one frame. The corrected detector follows each passenger's previous world position, accepts small vehicle steps, and rejects a teleported passenger. A seeded `passenger` simulation now advances the real run in 45 steps and verifies exactly one roadside scream.
- The browser automation does not capture the combined speaker output. Relative loudness and whether a specific scream feels natural still need an owner listening pass.

## Codex self-review

- Game design: a scream per affected passenger gives the player clear feedback about the size of a crash without changing collision or passenger balance. Concurrent screams are scaled by rider count to avoid a sudden peak. Roadside contact is audio only; it does not add new gameplay damage or scoring.
- UI/UX: occupancy and HP remained readable through the crash. The pause/restart flow worked. The sound effect slider continues to control voices. Highest priority listening check: compare a close roadside call, a multi-rider crash, and a return line at the default slider level. If the mix masks hazard cues, reduce the scream group level rather than muting warnings.
