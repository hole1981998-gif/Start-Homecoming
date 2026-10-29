# Homecoming procedural sound auditions — 28 October 2026

This folder holds **200 WAV drafts** for the game's non-voice sound design. Open `LISTEN_V2.html` for the current game engine, collision, pothole and water cues, `LISTEN.html` for the first gameplay pass, and `ui-modern/LISTEN_UI.html` for the modern UI pack. `V2_MANIFEST.json` maps 56 V2 files; `MANIFEST.json` maps 68 full-pack files; `ui-modern/MANIFEST.json` maps 62 UI files. The first eight A/B auditions remain at this folder's top level.

| Group | Files | Coverage |
| --- | ---: | --- |
| First A/B drafts | 8 | Passenger pickup, ejection, roadside passenger impact, traffic impact |
| Vehicle one-shots | 8 | Acceleration, braking, skid, coast, stop, driver fall, breakdown, vehicle switch |
| Road and cargo | 8 | Water, pothole, wind gust, crate/barrel release, roll and impact |
| Hazard and NPC | 16 | Train, police, militia, banana, jam, accident, broken car, barrier, vendor, ambulance, reboard/refusal |
| Item | 7 | Fuel, repair, nitro, jump, landing, star, Grab call |
| Shop and UI | 12 | Shop actions, QTE, pause, resume, restart |
| Results | 5 | Damage, fuel, train, police and secret endings |
| Engine loops | 8 | One loop for each playable vehicle kind |
| Ambience loops | 4 | Light/heavy rain, wind and wet road |
| Modern UI A/B takes | 62 | Menu, controls, cards, toast, rewards, shop, inventory and result panels |
| V2 engine loops and ramp previews | 32 | Three phase-aligned loop states and one 10 s speed sweep per vehicle |
| V2 interaction cues | 24 | Short, medium and long obstacle, cargo, traffic and warning effects |
| Current feedback cues | 6 | Water roll, light/heavy potholes, and light/medium/heavy collisions |

The V2 interaction cues range from 0.73 to 4.45 s; modern UI cues are at most 0.76 s. Files are 44.1 kHz, 16-bit PCM, mono. The V2 engine stems are periodic and phase aligned across idle, cruise and fast. See `ENGINE_MIX_GUIDE.md` for the speed/gain mapping and playback requirements. All five generators use Python's standard library and deterministic seeds. **ElevenLabs was not used** for these local SFX; an ElevenLabs audition attempt on 29 October 2026 did not start because free generations were busy. Voice lines and music are outside this pack.

## Review and integration boundaries

- These are **audition drafts**, not approved final SFX. The current engine, collision, pothole and water cues are wired into the runtime; the rest of the pack remains for review. Numeric/audio checks verify format, length, non-silence, clipping and loop edges; they do not prove that the sounds feel right. Human listening is required, especially for engine realism, impact weight, rain texture and loudness balance.
- Prefer the V2 engine stems for review: their transitions are previewed in `LISTEN_V2.html`. Rain/wind/wet-road loops belong on the ambience bus. Do not trigger loop files as one-shots.
- Trigger one-shots only from real event/state transitions, with cooldown and event deduplication. Do not let audio calls change simulation timing or RNG. For collision variants, trigger once per collision pair rather than every overlapping frame.
- The `barrier`, `vendor` and `ambulance` cues are for corresponding game/fixture states when those are active; do not add gameplay rules because a sound exists. The kick draft includes a soft landing at a tentative time; actual animation timing may require separate landing playback.
- Duck ambience under warnings and future voice lines; keep the SFX and ambience volume/mute controls separate. Every hazard and consequence needs an equivalent visual cue when muted. Avoid stacking police and train warning cues into a continuous alarm.
- Review at gameplay volume with rain, engine and alerts together. If a cue is harsh, repetitive or masks a warning, revise it before final selection. The current runtime wiring remains provisional until owner listening and gameplay checks.

To regenerate, run `generate.py`, `generate_full.py`, `generate_ui.py`, `generate_v2.py`, then `generate_feedback.py` from this directory with Python 3. Run `validate_v2.py` and `validate_feedback.py` to check the exported files. The scripts do not need the ElevenLabs API key.
