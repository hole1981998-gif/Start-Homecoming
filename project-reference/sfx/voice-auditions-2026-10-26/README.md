# Homecoming voice auditions — machine handoff

This folder preserves the ElevenLabs voice audition files generated on 26 October 2026 and ten short lines added on 30 October 2026. It contains 38 MP3 files plus `VOICE_DIRECTION.md`. Selected short takes are wired into the game runtime at the owner's request on 30 October; human listening approval of pronunciation and mix is still pending.

The latest short set has two variants per situation, including pickup, kicking a passenger out, hitting a roadside passenger, and hitting another vehicle. New lines cover the vendor, an ignored passenger, a passenger reacting to a fall, and storm bystanders. Earlier, longer takes are kept for comparison rather than selected as final assets.

Generation used the owner's local ElevenLabs API key. The key and `.env.local` are not included. All durations were measured from file metadata; pronunciation, emotional timing, and mix fit still need human listening review. In gameplay, visual cues must continue to communicate impacts and hazards when voices are muted.

For transfer, fetch the remote and check out `feature/voice-auditions-handoff`, or download this folder from its pull request. The MP3s are reference assets until the owner approves integration.
