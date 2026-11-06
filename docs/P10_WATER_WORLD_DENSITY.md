# Water detail at a fixed world scale — 28 October 2026

Visual dependency `f8de765`; remote fetched before branching. This follows the requested unmerged visual stack, not updated main. One change: large puddles retain the detail scale of small puddles. Helmet color is a separate follow-up commit/branch.

Previously all puddles used an 8×10 color-facet grid and 2×3 normal-map repeats. Grid cells and ripple features therefore expanded with width/length. Near-water grid now targets .4 m across and .7 m along; vertex jitter is also fixed in metres. Normal repeat derives from footprint size, preserving the old 3.2×7 m reference ripple scale (1.6 m / 2.333 m per tile) at either LOD. Water bounds, opaque lane coverage, reflection finish, animation clock and gameplay are unchanged.

Regression test compares small, wide/long and full-road surfaces: effective UV repeats per metre remain equal and average facet areas remain within 20%. Existing shared-sky lifetime, animation replay and footprint tests remain.

## Real observation / self review

In-app browser, seed 7, `p62-water-baseline` (long full-width water), actual Start then pause. [Current image](evidence/p10-water-density/water-large.png), 568×634 around 69 m, shows fine facets across the broad pool while preserving sky reflection and spray. Shader error query returned no entries. Numeric small/large density equality is covered by the test; this round does not claim matched camera-distance screenshots for every size/LOD.

Performance samples at 28/56 m: about 60 FPS, frame P95 16.8 ms, mean renderer CPU 7.17/7.12 ms, 41,148/41,938 triangles (`performance.json`). This is a local capture sample, not a matched no-regression benchmark. Larger puddles necessarily have more small facets; the standard full-width 9.6×30 m pool has 24×43 cells. The longer DEV fixture also remains playable in this observation.

Game-designer self review: presentation only; water resource costs, collision, balance and RNG unchanged. UI/UX self review from this capture: surface detail no longer dominates as giant stretched polygons, hazard coverage remains visible, HUD unaffected. This is Codex self review, not independent art approval. No all-device or full failure-scenario matrix is claimed.

## Validation / handoff

Windows / Node 24.22.1 / pnpm 11.25.0. Actual final gates: `pnpm lint` PASS exit 0; `pnpm typecheck` PASS exit 0; `pnpm test --maxWorkers=2` PASS exit 0, 67 files / 399 tests, 92.99 s; `pnpm build` PASS exit 0, 2.66 s (existing Three.js >500 kB warning). `git diff --check` checked before commit. Human review pending; no merge. PR creation remains unavailable under the previously observed GitHub integration HTTP 403; local gates do not certify remote CI.
