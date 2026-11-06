# Water loop review — 6 November 2026

Revision: `feature/audio-variation-voices` working tree before commit. Fixture seed: 17.

The owner requested rain one step quieter and new ElevenLabs water running loops for light, medium and heavy vehicles. Rain's loop gain changes from 3.6 to 3.0. Water audio now follows vehicle class rather than puddle footprint. Three generated loop-enabled MP3s replace the older shallow/deep set in runtime routing. All three buffers start during water contact with only the active class audible; gain ramps crossfade when class changes and fade out on exit.

Automated check: `tests/audio-feedback.test.ts` verifies rain level, class routing, sustained light loop over several updates, medium and heavy loop selection, no water entry hit, and fade-out after leaving water. This is Codex's implementation review; listening quality in the complete game mix still needs a human playtest.

Windows gates: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --reporter=dot --testTimeout=15000` exit 0 (423 tests in 76 files); `pnpm build` exit 0 with the existing Three.js chunk-size warning. The build includes the three new MP3s and omits the old shallow/deep loop files.

Manual browser: in-app browser, `?scenario=p8-water&seed=17`, car4 fixture. Started the run, saw the water hazards and drove across the scenario; the UI and input responded. The browser control does not expose speaker audio or an authoritative water-contact flag, so this did not establish how smooth the audible seam sounds. The automated audio test establishes routing and gain behaviour, not subjective sound quality.

Game design self review: the weight classes make vehicle changes audible without altering puddle damage, fuel cost, timing, or hazard fairness. UI/UX self review: the puddle contact and other visual state remain available; the water sound is supplementary. Next playtest should focus on loop seam, speech masking, and transitions during a long puddle.
