# Homecoming procedural sound auditions — 28 October 2026

This folder holds **138 WAV drafts** for the game's non-voice sound design. Open `LISTEN.html` locally for the gameplay SFX and `ui-modern/LISTEN_UI.html` for the dedicated modern UI pack. `MANIFEST.json` maps the 68 full-pack files; `ui-modern/MANIFEST.json` maps the 62 UI files. The first eight A/B auditions (`generate.py`) remain at this folder's top level; `generate_full.py` adds 68 game files, and `generate_ui.py` adds 62 UI files.

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

Gameplay one-shots are at most 1.83 s; modern UI cues are at most 0.76 s. Files are 44.1 kHz, 16-bit PCM, mono; the loop files have matched first/last samples. All three generators use Python's standard library and deterministic seeds. **ElevenLabs was not used** for these SFX. Voice lines and music are outside this pack.

## Review and integration boundaries

- These are **audition drafts**, not approved final SFX and not wired into the runtime. Numeric/audio checks verify format, length, non-silence, clipping and loop edges; they do not prove that the sounds feel right. Human listening is required, especially for the engine realism, rain texture and loudness balance.
- The engine loops are beds to pitch and scale with each vehicle's speed in a future audio director. Rain/wind/wet-road loops belong on the ambience bus. Do not trigger loop files as one-shots.
- Trigger one-shots only from real event/state transitions, with cooldown and event deduplication. Do not let audio calls change simulation timing or RNG. For collision variants, trigger once per collision pair rather than every overlapping frame.
- The `barrier`, `vendor` and `ambulance` cues are for corresponding game/fixture states when those are active; do not add gameplay rules because a sound exists. The kick draft includes a soft landing at a tentative time; actual animation timing may require separate landing playback.
- Duck ambience under warnings and future voice lines; keep the SFX and ambience volume/mute controls separate. Every hazard and consequence needs an equivalent visual cue when muted. Avoid stacking police and train warning cues into a continuous alarm.
- Review at gameplay volume with rain, engine and alerts together. If a cue is harsh, repetitive or masks a warning, revise it before P12 integration. Final selection and game wiring require owner approval and gameplay checks.

To regenerate, run `generate.py`, `generate_full.py`, then `generate_ui.py` from this directory with Python 3. The scripts do not need the ElevenLabs API key.
