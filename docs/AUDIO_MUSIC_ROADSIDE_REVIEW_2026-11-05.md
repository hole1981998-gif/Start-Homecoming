# Background music and roadside voices — 5 November 2026

Revision: `feature/audio-variation-voices`, seed 17.

## Change and evidence

- The distant thunder target gain rose from 0.58 to 0.72, roughly 24% higher. The source MP3 is unchanged.
- `Nimble Pursuit.mp3` was copied from the owner's Downloads folder without altering the original. The game streams its 134.0135-second file through a separate music bus with its own Nhạc nền slider. Playback loops, pauses with gameplay, resumes from its paused position, and starts at the beginning of a new run.
- Roadside call/laugh now starts within 30–46 m, based on vehicle speed, so a short line is closer to the player as it plays. Voice volume still rises on approach and now fades smoothly behind the vehicle over 24 m. The earlier 58 m trigger could finish a short line before the vehicle arrived; that is the likely cause of intermittent inaudibility. This is a code inference, not a captured audio recording.
- Automated checks verify the faster approach threshold, voice gain change, separate music level persistence, music loop and pause, and the music slider in UI.
- Gates on the final code: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --reporter=dot --testTimeout=15000` exit 0, 423/423 tests in 76 files; `pnpm build` exit 0 with the existing large Three.js chunk warning.
- Browser audition: `LISTEN.html` loaded and played the supplied track with a 134.0135-second duration, `loop: true`, and no media error.
- In-app browser, `?scenario=passenger&seed=17`: started a run, observed the pickup prompt and HUD progression, tried the F input, paused, changed the music slider from 100% to 0% and back, then restarted to initial resources. No console error was reported. The passenger was not picked up in the observed run, so the actual heard timing of its line remains for owner listening.

## Codex self-review

- Game design: the music adds a steady layer without changing traffic, hazards, scoring or RNG. Moving calls closer to the vehicle should better align them with the player encounter; seeded route behavior is unchanged.
- UI/UX: separate SFX, weather and music controls let the player find a readable mix. The roadside pickup prompt remained visible. Browser automation cannot hear speaker output, so the owner should judge whether music masks a short NPC call and whether the track's end/start transition feels smooth.
