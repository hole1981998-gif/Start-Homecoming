# ElevenLabs traffic and roadside SFX, 6 November 2026

Eight one-shot clips were generated with ElevenLabs Sound Effects v2, MP3 44.1 kHz / 128 kbps, prompt influence 0.7. Exact prompts and durations are in `generate.mjs`. The script reads an ignored `.env` or `SFX_ENV_FILE` and skips existing files; no API key is committed.

| Clip | Intended event |
| --- | --- |
| `horn_scooter_short.mp3` | Close small vehicle horn alternate |
| `horn_car_urgent.mp3` | Close car horn alternate |
| `horn_truck_low.mp3` | Close heavy vehicle horn alternate |
| `pass_scooter.mp3` | Small vehicle engine passing player |
| `pass_car.mp3` | Car engine passing player |
| `pass_truck.mp3` | Heavy engine passing player |
| `traffic_block_light.mp3` | Small or medium traffic striking a fixed obstacle |
| `traffic_block_heavy.mp3` | Heavy traffic striking a fixed obstacle |

The existing car and heavy horns remain as alternates, so each vehicle class cycles between two takes. Horns are globally spaced at least 4.5 seconds apart and each traffic entity honks at most once. Passing sounds require a real relative crossing and do not repeat per entity. Traffic against a barrier, train, accident or broken vehicle triggers only on the first contact; potholes and traffic versus traffic retain their own cues. The road and vehicle positions control stereo pan and collision level. This audio mapping changes no simulation or balance values.

The existing owner supplied driver voice lines continue to play only for traffic versus traffic collisions. No new spoken horn taunts were generated in this pass because their actor and delivery need a separate voice audition.
