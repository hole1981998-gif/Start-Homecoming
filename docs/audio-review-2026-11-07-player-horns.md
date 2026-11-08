# Player horn pack review — 2026-11-07

Revision: `codex/player-horn-packs` before commit. Config `p8-encounter-c3-refinement-1`; browser: in-app browser at `127.0.0.1:5173`.

## Observed

- The owner supplied 16 files. The filenames identify four motorcycle, three car, four bus, and five truck/container recordings. The truck-labelled file is in the heavy family. The requested verbal counts included four cars, but only three car files were attached; no heavy file was mislabelled as a car.
- Opened `project-reference/sfx/owner-player-horns-2026-11-07/LISTEN.html` and started the first motorcycle clip. The browser exposed controls for all 16 recordings. Browser automation cannot judge whether the sound itself is convincing or its perceived volume in the game mix.
- In `?scenario=passenger&seed=17`, started a run, pressed T and F; the run continued and rider count changed from 1/2 to 2/2. The audio test verifies that every T press triggers one selected horn from the active vehicle family along with one of three voice clips, with no immediately repeated horn within that family.
- After preloading the new horns, reloaded the passenger scenario, started a run and pressed T. The run continued and the browser reported no console errors. Automated browser inspection still cannot verify the perceived timing by ear.
- In `?scenario=coast&seed=17`, the run ended from fuel depletion after 25 m of coasting, displayed the end screen and restarted through the button. This checks the surrounding play loop after the audio change.

## Self-review — game design

Horn choice is only flavor and changes no simulation outcome or balance value. Distinct bus and truck/container pools make the vehicle silhouette and sound more consistent. The seeded selector avoids consecutive repeats per family while preserving variety across vehicle changes. A listening playtest should check whether the longest car or heavy horn masks the concurrent voice line.

## Self-review — UI/UX

T still works during active play and the controls explain the paired call and horn. The listening page groups files by vehicle so the owner can check each take directly. This browser run verified input and HUD response, but did not measure auditory onset or loudness. No sound is needed to read a hazard; existing visual cues remain.

## Limits

The recordings were copied unchanged from the user attachments. Human listening feedback for the revised mix remains pending.
