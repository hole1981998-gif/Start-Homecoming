# Full non-voice SFX pass — 30/10/2026

## Scope and direction

Owner requested another pass across all kinds of in-game sound. The selected palette is rain-dark road texture with playful but restrained feedback: rubber and intake for driving, water and air for weather, material-specific impacts, short rounded UI gestures. No voice line or music was added. This is a provisional integration for owner audition, not an approved final sound direction.

Starting revision: `0312263` on `feature/procedural-sfx-auditions`. Thirty-two new ElevenLabs MP3s cover rain/wind/wet road, three neutral engine textures, coast/stop/fall/switch, cargo release and rolls, ambulance pass, wind gust, police/banana/broken car, pickups/powers/jump/landing/passenger actions, and five result endings. Two weak first takes (jump and fuel result) are archived under `alternatives/`; their stronger retakes are used. Existing ElevenLabs water, pothole, collision and obstacle hits remain. `generate.py` contains prompts, durations and loop flags. `LISTEN_ALL.html` contains 78 playable entries, including eight actual engine ramp previews and the selected UI cues.

The eight procedural engine cores remain three phase-aligned idle/cruise/fast stems per vehicle because their speed transition is continuous. A low-level ElevenLabs intake texture sits under each light/car/heavy family without replacing the speed mapping; failed texture loading leaves the three core stems intact. AI ambience and engine loops have a five-millisecond endpoint taper after decode. Per-cue trims prevent louder generated effects from masking driving feedback; ambience stays on its own bus. The UI uses the existing restrained `ui-modern` A takes, now wired to start/card/help/pause/resume/shop/category/transactions/restart/toggles, resource gain/loss, passenger pickup reward and successful QTE route choice. Shop success is determined by `economySequence`, and category/cancel feedback is distinct. Sound never changes simulation RNG or outcomes.

Two sliders on the start/pause/help/result panel set SFX and rain/wind independently, including zero/mute, and persist locally. Storage failure falls back to 100% without blocking game startup, and slider changes ramp instead of jumping abruptly. There is no music asset or active music bus in this prototype, so no inert music slider was added. Hazard warnings retain their visual cue; this pass does not add repetitive warning beeps.

## Technical and manual evidence

- ElevenLabs generation: 32 new API responses saved as MP3, valid headers and nontrivial size; the local key was supplied through process environment, never bundled. Edge decoded the generated MP3s. The first jump and fuel-ending takes had RMS 0.009 and 0.008 FS and were replaced by takes with RMS 0.072 and 0.086 FS. These measurements do not judge timbre.
- `LISTEN_ALL.html`: Edge fetched all 78 listed assets successfully, 0 missing.
- Edge, `p62-water-baseline`, seed 17: start, first card, drive through water, pause; runtime fetched the new bike engine texture, rain/wind/wet-road, water and UI files with no page error. Edge, `shop`, seed 17: opening shop, switching to items and buying Nitro fetched `shop_enter`, `shop_category`, `purchase_success`; status read “Đã mua Nitro boost vào ô 1.”
- Edge, `force-car-ram`, seed 17: collision fetched `collision_medium` and car engine texture; HP was 164 after impact, pause and restart returned to Ready with no page error. Edge, `events-train`, seed 17: reached terminal train contact; `train_hit` and `result_train` fetched, with no page error.
- Edge, `blocked-window`, seed 17: pressing Q in the valid window changed HUD to “ĐÃ CHỌN TRÁI” and fetched one UI confirm cue.
- Two volume sliders were visible on start. Setting SFX to 0 and ambience to 35% persisted after reload; keyboard Home set the SFX slider to 0 with stable accessible name “Hiệu ứng”.
- Edge final CSS check, `shop`, seed 17: the popup preference was visible on Start (`display: block`) and hidden in Shop (`display: none`); shop title read “Cửa hàng ven đường”.
- Fresh screenshot audit, step 1 desktop start [image](audio-review/01-start-desktop.png): sliders, popup preference and Start button visible. Step 2 mobile start [image](audio-review/02-start-mobile.png): the same controls remain visible at 390×844. Both steps looked usable; the version badge sits close to the modal bottom. These screenshots cannot establish sound quality, input latency or full accessibility compliance.
- A deliberately crowded offline calculation at aligned starts (fast motorcycle core + bike texture + rain/wind/wet-road + heavy collision + nitro) had peak 0.837 FS, RMS 0.142 FS. This one scenario is evidence of headroom there, not a proof for every overlap or playback phase.

## Self-review

- Game designer: no damage, difficulty, reward, economy, hazard spawn or RNG change. Distinct physical cues reflect actual event type; water and obstacle visuals remain the reliable warning channel. Check in a human playtest whether engine/rain masks quieter fuel, police or QTE consequences.
- UI/UX designer: start and shop operations now give short feedback; sound for a purchase is gated on a successful transaction. Automatic tab hiding pauses silently; card timeout resumes silently. Sliders have stable names and keyboard operation. The prototype still needs a dedicated review of audio settings on other target browsers and smaller screens.
- Sound direction: this is a self-review from code, decoded signal levels, screenshots and browser event traces. **The agent cannot hear the audio output** and has not verified timbre, emotional weight, loop seams or the complete game mix by ear. Owner listening in `LISTEN_ALL.html` and in gameplay is required before calling the pack approved.

## Gate results

- `pnpm lint`: pass, exit 0.
- `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=1 --reporter=dot`: pass, 40 files and 272 tests, exit 0. The first full run had one stale focus-order expectation after inserting sliders; it was corrected and both the focused rerun (10/10) and final full run passed.
- `pnpm build`: pass, Vite built 1707 modules, exit 0.
- CI on the eventual pushed commit: pending. No human sound approval yet; no merge.
