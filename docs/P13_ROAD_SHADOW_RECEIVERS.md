# Road shadow receivers — 29 October 2026

Branch `codex/road-shadow-receivers`, visual dependency `41e4e7a`. Origin fetched and remote main identified; preserves the requested unmerged visual stack rather than claiming a fresh-main base. No merge.

Cloud/decorative bands are inexpensive projected visual masks, not physical cloud geometry. Cloud masks were at .022 m, below raised lane paint (.025 m): paint occluded the shade. Bands now sit at .04 m. Contact masks at .045 m have a denser core and larger footprint around player/obstacles; roadside people also receive a ground contact mask. This approximates contact AO without a full-screen SSAO pass. No simulation/balance changes.

Regression test measures actual paint geometry bounds and verifies all three mask types sit above it, with depth writes disabled. Existing shared-mask ownership/movement tests retained.

Windows, Node 24.22.1, pnpm 11.25.0: `pnpm lint` and `pnpm typecheck` completed without diagnostics; `pnpm test --maxWorkers=2` PASS 69 files / 406 tests, 112.26 s; `pnpm build` PASS 3.37 s, existing >500 kB warning. Combined shell command exit 0; individual gate exit codes were not separately recorded.

Manual in-app browser, seed 7, `lights-car4`: Start and Q accepted, player/traffic ground shade observed, no console errors. Evidence `evidence/p13-feedback/contact-shadows.png`. Also drove `p62-wind-right` with W to 79–80 m: active right-wind cue and moving ribbons observed (`wind-active.png`); normal spawn frequency not changed. Pause/resume used. No complete failure/restart matrix or device performance audit claimed for this visual-only change.

Codex game-designer self review: contact improves grounding without modifying difficulty/RNG. UI/UX self review from current screenshot/input: no added overlays; narrow canvas still limits distant detail. Paint occlusion regression is covered by measured geometry, not a pixel-perfect GPU comparison. These are self reviews, not independent art approval. CI not verified; PR unavailable under previously observed GitHub integration 403; human review pending.
