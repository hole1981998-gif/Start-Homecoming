# Rain ripple ground anchors — 28 October 2026

Branch `codex/rain-ground-anchors`, visual dependency `79fb2fc`. Remote fetched before branching; preserves the requested unmerged visual stack, not an updated-main claim. Vehicle lights are a separate follow-up.

The old ripple center added the current player anchor every frame. Each ripple now saves a world-space center when its cycle begins and retains it until that lifetime ends. New births project to the actual road centerline with lateral offset, including curves, rather than to a rectangle that follows the player's lane. Same active time keeps the same center/scale; rewind resets saved cycles. Storage remains bounded by the existing instance count and uses deterministic hashing without simulation RNG.

Behavioral test moves both anchor and road projection while retaining an active ripple, verifies the position stays fixed, then verifies a new cycle uses the new road location and rewind resets. Existing seeded replay tests remain.

Manual: real in-app browser, `p62-water-baseline`, seed 7; actual Start and pause. [Motion evidence](evidence/p12-rain/rain-ground.webp) contains actual variable-interval screenshots (metadata in `recording.json`), not native video/60-FPS capture. [Still](evidence/p12-rain/rain-road.png) gives context, not proof of anchoring by itself. Shader error query empty. Two paused captures are packaged for pixel comparison. Curved-road lifetime coordinates are primarily covered by the callback regression test, not a complete manual turn matrix.

Game-design self review: no weather penalties, collision, balance or timing changes; this removes an artificial visual cue. UI/UX self review: rings recede relative to the moving camera instead of translating with it; subtle density remains, no new overlay. These are Codex observations/tests, not independent art approval.

Validation: Windows / Node 24.22.1 / pnpm 11.25.0. `pnpm lint` PASS exit 0; `pnpm typecheck` PASS exit 0; `pnpm test --maxWorkers=2` PASS exit 0, 68 files / 401 tests, 94.47 s; `pnpm build` PASS exit 0, 2.73 s, existing Three.js >500 kB warning. Diff checked before commit. Human review pending; no merge. PR creation remains unavailable under previously observed integration HTTP 403; local gates do not certify CI.
