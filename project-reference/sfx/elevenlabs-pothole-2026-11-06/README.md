# Pothole impact SFX — 6 November 2026

Six short ElevenLabs Sound Effects v2 clips replace the older pothole rattles: two each for light motorcycles, medium cars and heavy trucks/buses. The prompts demand an immediate tire impact and a short suspension/bodywork rattle, with no engine or lead-in. Exact prompts and generation settings are in `generate.mjs`; credentials stay in an ignored `.env` outside this folder.

Player and traffic pothole events use the same vehicle-weight selection and alternate between two takes per weight. `LISTEN.html` offers a local audition page. The traffic pass cue is separately advanced according to closing speed and clip length, and its MP3 is predecoded before the trigger. Audition both in the game: the browser automation cannot hear the final sound balance.
