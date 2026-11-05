# Continuous rain shower loop

Owner requested a dense rain shower in place of the old close, ticking rain layer. `rain_shower_loop.mp3` was generated with ElevenLabs Sound Effects v2 on 4 November 2026 using `generate.mjs`, `loop: true`, 12 seconds, prompt influence 0.65 and MP3 44.1 kHz / 128 kbps. The key is read from the ignored root `.env` and never stored here.

The game maps `ambience/rain_light_loop.wav` to this file, decodes it once, tapers 5 ms at each edge to guard against MP3 boundary clicks, and loops it on the ambience bus. The existing Mưa và gió slider still controls it. The old `rain_road_loop.mp3` remains in the audition archive but is no longer requested by the game.

The sound director's listening intent: broad, steady rain wash with body in the middle frequencies, without close isolated drip or roof taps. Browser automation can verify playback and looping, but the final tonal and mix judgment needs owner listening.
