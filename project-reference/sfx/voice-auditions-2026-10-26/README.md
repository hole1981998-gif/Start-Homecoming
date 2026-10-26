# Homecoming voice auditions — machine handoff

This folder preserves the ElevenLabs voice audition files generated on 26 October 2026 so work can continue on another machine. It contains 28 MP3 drafts plus `VOICE_DIRECTION.md`. No file here is wired into the game runtime, and no line or performance is marked approved.

The latest short set has two variants per situation, including pickup, kicking a passenger out, hitting a roadside passenger, and hitting another vehicle. File names and measured durations are listed in `VOICE_DIRECTION.md`. Earlier, longer takes are kept for comparison rather than selected as final assets.

Generation used the owner's local ElevenLabs API key. The key and `.env.local` are not included. All durations were measured from file metadata; pronunciation, emotional timing, and mix fit still need human listening review. In gameplay, visual cues must continue to communicate impacts and hazards when voices are muted.

For transfer, fetch the remote and check out `feature/voice-auditions-handoff`, or download this folder from its pull request. The MP3s are reference assets until the owner approves integration.
