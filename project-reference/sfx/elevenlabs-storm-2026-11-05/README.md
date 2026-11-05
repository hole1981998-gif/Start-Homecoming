# Distant thunder and occasional lightning

Generated from the owner-approved ElevenLabs Sound Effects API with `generate.mjs` on 5 November 2026. The ignored root `.env` supplies the API key; no credential is stored in this folder.

- `distant_thunder_loop.mp3`: 16-second continuous distant rumble, generated with Sound Effects v2 and `loop: true`. The game loops the decoded buffer on the ambience bus and tapers 5 ms at its edges.
- `lightning_distant_a.mp3` and `lightning_distant_b.mp3`: two single, distant lightning strikes with rumbling tails. The game alternates them at seed-based deterministic, irregular intervals: first 14–22 seconds into a run, then 27–43 seconds apart. They use the ambience bus, so the Mưa và gió slider controls them.
- Rain target gain is reduced from 4.5 to 3.6. The existing visual hazard cues remain unchanged.
- The driver's collision voice is triggered by traffic versus traffic contacts only. Player crashes still use the separately requested scream pool; passenger ejection screams remain unchanged.

`LISTEN.html` presents the three source files for owner listening. Browser automation can verify loading and looping but cannot judge their combined tone or loudness through speakers.

On 5 November 2026, after owner feedback, the distant thunder target gain rose from 0.42 to 0.58. The source MP3 itself remains unchanged.

Later the same day, the owner requested slightly clearer distant thunder; the target gain rose from 0.58 to 0.72 without changing the MP3.
