# Player crash voices and louder rain — 4 November 2026

Revision: `feature/audio-variation-voices`, seed 17.

## Observed in automated audio checks

- A player crash with no passengers creates one player scream. A crash with three passengers creates four screams: one driver and one per passenger.
- Reboarding and abandoning a passenger after a player crash do not request extra speech. Dropping a passenger via the kick action still uses a scream.
- Three passengers from a wrecked traffic vehicle each scream; the existing traffic line still follows the first passenger's completed scream.
- Rain loop target rose from 2.7 to 4.5 on the ambience bus, approximately 67% above the preceding revision. The ambience slider continues to control this bus.

## Browser checks

- In-app browser, `?scenario=crash&seed=17`: started with one person (driver only), hit the scripted car, saw the crash/recovery cue, 0/2 occupants during the fall and HP 123 → 103. No browser warning or error.
- In-app browser, `?scenario=traffic-passengers&seed=17`: started a bus run, passed the scripted traffic collision near 55 m, saw HP 210 → 202 and the run continued. No browser warning or error. The automated audio check verifies the corresponding traffic ejection voices.
- The browser tool cannot capture speaker output, so these UI observations do not establish the subjective loudness of the rain or screams.

## Codex self-review

- Game design: the player scream makes solo crashes audible without inventing a passenger voice. Rider count still controls how many rider screams play, with concurrent gain scaled by count. Traffic-wreck passengers retain their separate character response.
- UI/UX: no hazard information depends solely on this voice change. The ambience slider remains available if the louder rain masks other cues. Browser automation can verify page flow and media requests, but cannot judge the combined speaker mix; owner listening is still needed for the final rain level.
