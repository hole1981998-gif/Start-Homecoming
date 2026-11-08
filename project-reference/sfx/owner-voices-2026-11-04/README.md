# Owner-supplied NPC voices, 4 November 2026

The MP3s here are copies of the ElevenLabs takes the owner supplied from Downloads.
`import.mjs` records the exact timestamp and version chosen for each cue and leaves the original files untouched.
`LISTEN.html` is an audition page; the game uses the event mapping in `src/audio-director.ts`.

Events: roadside call, boarding, player fall, passenger fall/kick, Grab laugh, traffic ejection, and driver lines for traffic versus traffic collisions only. Return and abandonment lines play when the player's driver gets back onto the vehicle after a crash, once per rider according to whether that rider returned or stayed behind.
The five owner-supplied November 4 screams join the existing scream pool. A player crash emits a player scream even without riders, plus one scream per ejected rider; each nearby wreck passenger also screams once. A player collision confirmed by the physics simulation emits one scream for that roadside passenger. Passenger return and abandonment dialogue waits until the driver remounts; traffic wreck dialogue still follows its passengers' screams.
Owner voice gain is raised by 25% before the SFX bus. Concurrent crash screams are scaled by the square root of rider count to avoid a large spike.
Roadside calls change level during playback as player distance changes. Abandonment and traffic ejection use their own wider rear hearing range. All voices use the SFX volume control and retain pitch when sped up.

The owner's long comic lines remain full length. Playback is capped at 1.5× (1.9× for laughter), so some run longer than the earlier 1–1.5 second target; review in game before shortening a line that depends on its delivery.

Within each event and voice actor, available takes rotate across different riders; the first rider no longer always selects the first take. Events with only one supplied take for an actor still repeat that take.

On 5 November 2026 the driver collision lines were removed from player-versus-traffic collisions. Player crash and ejected passenger screams remain as previously requested.

After audibility feedback, roadside call/laugh and short NPC dialogue gain were raised by event type. Weather and music briefly duck during active voices, and a rejected media play can retry during the same approach. The original MP3 files were not changed.
