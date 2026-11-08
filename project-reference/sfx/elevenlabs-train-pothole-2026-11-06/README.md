# Train and pothole revision — 6 November 2026

ElevenLabs Sound Effects v2 generated six new short pothole takes, one approaching train horn and a seamless rail-wheel clack loop. Exact prompts and API settings are in `generate.mjs`; the key remains in an ignored environment file outside this folder. `LISTEN.html` offers a local audition page.

The game now has four pothole clips for each of light, medium and heavy vehicles, including the two prior takes per weight. A seeded selection avoids immediate repeats without a fixed 1–2 alternation. The train plays the horn once when an active crossing enters hearing range and loops the distinct wheel rhythm while nearby. The indicator's single-tick recording loops in Web Audio while A/D is held or an accepted Q/E turn is active, then stops on release, pause, crash or completed turn.
