# Storm, music and roadside voice audibility — 5 November 2026

Revision: `feature/audio-variation-voices`, seed 17, `?scenario=passenger`.

## Observation and change

- A temporary local Web Audio analysis of the five roadside call/laugh MP3s found 2.59–4.28 second source durations and detected speech onset after about 0.1–0.3 seconds. This does not support a long silence at the start of the files.
- In the in-app browser, development instrumentation observed the roadside `thanh_call_shout` event being requested and its media `play()` promise resolving. The instrumentation and analysis page were removed after this check. Browser automation cannot hear speaker output, so masking by the mix is an inference rather than a listening result.
- Distant thunder target gain rose from 0.72 to 1.00. The music bus level rose from 0.18 to 0.30. Their source MP3s are unchanged, and their separate sliders still control them.
- Roadside calls receive 2.6× and laughter 3.4× the earlier event gain. Boarding thanks and traffic NPC dialogue receive 1.6×. While a voice is active, weather ambience eases to 55% and music to 45% of their current slider levels, then recover smoothly when speech ends. Screams keep their previous gain.
- If a media `play()` attempt rejects, the voice can retry after 0.6 seconds instead of consuming the whole 4.2-second call cooldown. This protects a short approach window after transient playback failure.
- Gates on the final code: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --reporter=dot --testTimeout=15000` exit 0, 423/423 tests in 76 files; `pnpm build` exit 0 with the existing large Three.js chunk warning.
- In-app browser: started the passenger scenario, saw the pickup cue, restarted and used F immediately, then observed 1/2 → 2/2 riders and the pickup confirmation. No browser console error was reported. The actual perceived voice/music balance remains for owner listening.
- A manual game-over was not reached in this audio-focused browser check. The automated terminal-event checks passed.

## Codex self-review

- Game design: no spawn, collision, resource or RNG rules changed. The stronger voice and short background dip make NPC interaction feedback easier to notice while preserving the existing visual pickup cue.
- UI/UX: the music, weather and SFX sliders remain separate and readable. The background dip is limited to active speech; the risk is audible volume pumping if many NPCs speak close together, which should be judged in a longer playthrough.
