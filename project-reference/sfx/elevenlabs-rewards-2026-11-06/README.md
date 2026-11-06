# ElevenLabs reward and UI sounds, 6 November 2026

ElevenLabs Sound Effects v2 generated the 14 one-shot MP3 clips in this folder (44.1 kHz / 128 kbps, prompt influence 0.75). Exact prompts and durations are in `generate.mjs`. The script reads an ignored `.env` or `SFX_ENV_FILE`, skips existing files, and does not commit credentials.

The game plays distinct rising reward cues for roadside fuel, repair, passenger pickup, shop item purchase, shop service, vehicle upgrade and vehicle purchase. Menu selection, back, shop open, unavailable purchase, pause, resume and restart use quieter, shorter UI cues. Category/toggle/help/card actions reuse the soft selection/back sounds. Resource-loss UI remains silent because physical hazard sounds already play at those events. All UI cues use the SFX slider; the shop's owner-supplied jazz stays on the separate music slider.

This pass also raises distant thunder from level 1 to 1.4, the shop jazz track from 0.78 to 0.95, and recent traffic horn, pass, pothole and collision levels. Rain volume, simulation and balance values are unchanged. Final perceived loudness and the MP3 loop seam require owner listening in-game.
