# ElevenLabs road cues, 6 November 2026

These MP3 files were generated with ElevenLabs Sound Effects v2 for the game. They supplement the existing ElevenLabs ambience, water, vehicle, and collision clips on `feature/audio-variation-voices`.

| File | Use | ElevenLabs generation |
| --- | --- | --- |
| `npc_footsteps_wet.mp3` | Nearby moving roadside NPC | `DqQhsM3p4C9iPL0gfjTp` |
| `train_roll_past.mp3` | Approaching train | `Z2cmrzYqxk5JpPX2crbN` |
| `traffic_horn_car.mp3` | Approaching car and light vehicle | `qtL02M0M2cpwTqlds3dg` |
| `traffic_horn_heavy.mp3` | Approaching bus and truck | `LeWZ8YjkMj31kLXNC2HB` |

The last two are variants from ElevenLabs flow `cSb95404D0pzxd2TF40i`. In this prototype, the sound director plays each footstep and train approach cue once per visible entity, so they do not spam every frame. Collision and train impact cues continue to use the existing ElevenLabs clips from the audio branch.

Old synthesized WAV packs from `procedural-auditions-2026-10-28`, `reward-pickups-2026-10-31`, and `power-traffic-2026-10-31` are removed. UI cues without a suitable ElevenLabs replacement are silent; visual controls and warnings still work. The previous three-layer synthesized engine is replaced with its existing ElevenLabs engine texture, with speed-dependent playback rate.
