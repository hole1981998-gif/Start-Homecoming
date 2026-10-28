# Procedural SFX auditions — 28 October 2026

Eight short mono WAV drafts, two variants for each of four events. Generated locally with `generate.py` using Python's standard library and deterministic random seeds. ElevenLabs was **not** used for these SFX. No sound here is integrated into the game or approved as a final asset.

| Event | Files | Duration | Layer direction |
| --- | --- | --- | --- |
| Driver picks up a passenger | `pickup_01.wav`, `pickup_02.wav` | 0.70 s | Soft latch and warm two-note acknowledgement |
| Driver kicks a passenger out | `kick_01.wav`, `kick_02.wav` | 0.78 s | Spring release, short air movement, soft landing; leaves room for the passenger vocal cry |
| Player vehicle hits a roadside passenger | `passenger_hit_01.wav`, `passenger_hit_02.wav` | 0.57 s | Muted thump, cloth movement and scuff, without an explosive impact |
| Player vehicle hits another vehicle | `traffic_hit_01.wav`, `traffic_hit_02.wav` | 0.88 s | Low body hit, rubber scrape and loose metal rattle |

All files are 44.1 kHz, 16-bit PCM, mono. Peak level is at most 0.58 full scale; the generator prints RMS and duration. The two variants differ in pitch, timing, texture or weight. The impact sounds are intended to sit behind the short voice reactions, not mask them.

## Listening review needed

- Check whether the two takes for each event are audibly distinct and sound human/playful enough for the game's stormy but upbeat mood. Metadata and waveform checks cannot confirm this.
- Compare with engine, rain, speech and warning audio at gameplay volume. Reduce or reshape impact weight if it feels like combat or makes a person being hit into a joke.
- Confirm timing against the actual event animation before integration. The kick sound's landing layer is only a sketch; the runtime may need to trigger landing separately.
- Keep visual confirmation for pickup, ejection and collisions when sound or voice is muted. Route these files through the SFX bus with event deduplication and cooldown if selected later.

This pack is for owner audition. Final SFX integration follows the project's P12 approval and gameplay checks.
