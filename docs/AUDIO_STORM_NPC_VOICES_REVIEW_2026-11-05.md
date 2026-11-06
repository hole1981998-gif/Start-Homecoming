# Storm ambience and NPC driver voice routing — 5 November 2026

Revision: `feature/audio-variation-voices`, seed 17.

## Implemented and checked

- Rain target gain on the ambience bus fell from 4.5 to 3.6 (20% lower). The owner-approved ElevenLabs rain source remains the same.
- ElevenLabs Sound Effects v2 generated a 16-second distant thunder bed with `loop: true` and two 5-second distant lightning strikes. The game loops the thunder bed and alternates lightning variants after an initial 14–22 seconds, then every 27–43 seconds. Timing is deterministic from the seed and pauses with the run. All three sounds use the Mưa và gió bus.
- The existing driver collision lines now trigger only for contacts between two traffic vehicles. Player-versus-traffic collision no longer triggers that NPC line. As confirmed by the owner, a player crash retains the separate short scream, as do passengers who fall from the player's vehicle.
- Automated checks: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --reporter=dot --testTimeout=15000` exit 0, 423/423 tests; `pnpm build` exit 0. The build retains its existing warning about a large Three.js chunk.
- Browser audition: the three new files loaded without media error (16-second loop and two 5-second one-shots). The thunder continued playing after crossing its 16-second boundary.
- In-app browser `?scenario=p8-water&seed=17`: started the run, used steering input, saw water and resource cues, paused, and restarted to the initial resources. Browser console showed no errors.
- In-app browser `?scenario=crash&seed=17`: started the solo motorcycle run; the scripted collision reduced HP from 123 to 103 while the run continued. Browser console showed no errors. Browser automation cannot hear speaker output, so the final balance of rain, thunder and lightning needs owner listening.
- In-app browser `?scenario=p61-train-left&seed=17`: started and dismissed the first-use cards; the motorcycle passed the observed crossing window without a terminal collision. A manual game-over sound was therefore not verified in this round; automated terminal-event tests passed.

## Codex self-review

- Game design: distant thunder supports the storm atmosphere without changing hazard timing or gameplay rules. Sparse lightning avoids a repetitive, startling cue. The separate player scream preserves crash feedback while NPC driver dialogue stays with NPC traffic events.
- UI/UX: the storm layers follow the existing ambience control; hazard reading remains visual. In the browser check the HUD and water cue stayed readable through the run. The remaining subjective risk is whether a lightning transient masks a brief warning or voice, which must be checked by ear in the full mix.
