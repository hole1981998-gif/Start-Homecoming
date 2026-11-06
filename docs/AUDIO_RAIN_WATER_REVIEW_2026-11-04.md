# Rain and water entry audio pass — 4 November 2026

Revision: `feature/audio-variation-voices`; scenario `?scenario=p8-water&seed=17`.

## Observed

- The rain loop target rose from 2 to 2.7 on the ambience bus. The player ambience slider still applies downstream.
- Entering shallow or deep water no longer requests any `water_entry_*` clip. Rolling water loops continue during contact and the existing exit spray remains. The focused audio test verifies those playback requests and the new rain target.
- In the in-app browser, the four-seat car ran from 841 m into the long water section; fuel dropped from 13 L to 10.9 L. Escape paused and restart returned to 841 m, 13 L, and 184 HP. No browser warning or error appeared.
- Browser automation cannot capture the combined speaker output. The owner should judge whether the rain increase leaves voices and road hazards clear.

## Codex self-review

- Game design: this changes sound presentation only; water's fuel cost and hazard timing are unchanged. The rolling loop still signals continued water contact.
- UI/UX: the separate ambience slider gives players a quick adjustment if louder rain masks nearby voices. The water's visual state and fuel change remain readable without the removed entry sound. No new popup or HUD element is needed.
