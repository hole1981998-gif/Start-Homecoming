# Rain shower replacement — 5 November 2026

Revision: `feature/audio-variation-voices`, seed 17, `?scenario=p8-water`.

## Implementation and observed checks

- ElevenLabs Sound Effects v2 returned a 12-second MP3 for a continuous, dense outdoor rain shower prompt with `loop: true`. The prompt excludes isolated close droplets, sharp taps, roof rain, thunder, traffic, voices and music. Generation parameters and the prompt are in `project-reference/sfx/elevenlabs-rain-2026-11-04/generate.mjs`.
- The runtime now requests `rain_shower_loop.mp3` for the rain ambience source, sets its Web Audio source to loop, and applies a 5 ms edge taper to guard the MP3 boundary. The existing Mưa và gió control still governs the ambience bus.
- The audition page loaded the 12-second file with no media error and exposed a looping audio control. During browser playback, `currentTime` moved from 11.25 s to 5.22 s while playback remained active with no media error, confirming it crossed the loop boundary. The browser tool cannot capture speaker output, so perceived smoothness and tone require owner listening.
- In-app browser, `?scenario=p8-water&seed=17`: started the run, steered, crossed the water region, observed resource/HUD updates and the water cue, paused, then restarted to the initial resources. No browser console errors were reported.
- Gates: `pnpm lint`, `pnpm typecheck` and `pnpm build` passed. `pnpm test --reporter=dot --testTimeout=15000` passed 422/422 tests in 76 files. An earlier default-timeout run had three unrelated simulation/UI tests time out at 5 seconds while other checks ran concurrently; the isolated rerun passed without changing those tests or their assertions.

## Codex self-review

- Game design: a continuous rain bed is appropriate for the storm setting and does not change hazard timing, controls or resource balance. No new game mechanic or hidden cue was added.
- UI/UX: rain is still adjustable with the Mưa và gió slider. The water hazard retains its visual cue, so hearing the rain is not required to understand the road. The main remaining check is owner listening in the full mix to judge whether the rain texture masks voices or other cues.
