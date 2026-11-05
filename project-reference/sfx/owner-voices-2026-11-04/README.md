# Owner-supplied NPC voices, 4 November 2026

The MP3s here are copies of the ElevenLabs takes the owner supplied from Downloads.
`import.mjs` records the exact timestamp and version chosen for each cue and leaves the original files untouched.
`LISTEN.html` is an audition page; the game uses the event mapping in `src/audio-director.ts`.

Events: roadside call, boarding, player fall, passenger fall/kick, Grab laugh, traffic ejection, and driver lines for traffic versus traffic collisions only. Return and abandonment recordings are retained for audition but are not triggered after a fall from the player's vehicle.
The five owner-supplied November 4 screams join the existing scream pool. A player crash emits a player scream even without riders, plus one scream per ejected rider; each nearby wreck passenger also screams once. A vehicle crossing a roadside passenger's collider emits one scream for that passenger. Only screams play for passengers falling from the player's vehicle; traffic wreck dialogue still follows its passengers' screams.
Owner voice gain is raised by 25% before the SFX bus. Concurrent crash screams are scaled by the square root of rider count to avoid a large spike.
Roadside calls change level during playback as player distance changes. Abandonment and traffic ejection use their own wider rear hearing range. All voices use the SFX volume control and retain pitch when sped up.

The owner's long comic lines remain full length. Playback is capped at 1.5× (1.9× for laughter), so some run longer than the earlier 1–1.5 second target; review in game before shortening a line that depends on its delivery.

On 5 November 2026 the driver collision lines were removed from player-versus-traffic collisions. Player crash and ejected passenger screams remain as previously requested.
