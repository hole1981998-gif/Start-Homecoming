# Soft water and directional glimmer — 28 October 2026

Follow-up to the player's request to remove fake white water streaks and add flickering bloom toward the light. Branch `codex/water-soft-reflection-bloom`, visual dependency `a58acab` (`codex/vfx-motion-feedback`). Remote fetched before creating the new branch; intentionally retains that unmerged visual dependency rather than claiming an updated-main base. No simulation, hazard geometry footprint, collision, timing, balance or input changes.

Removed both sources of white streaks: periodic bright shader bands/glints and the separate water-ripple/wet-bank bar meshes. Reflection is now a soft view-angle sky tint with very low-amplitude drift. Reduced normal strength, clearcoat and specular intensity prevent replacement white spots. The opaque teal basin and gently animated surface remain.

Bloom now has an irregular gentle glimmer over a few seconds instead of a long near-invisible gap. It combines thresholded nearby scene highlights with a small soft light-edge halo. The existing camera-relative sun side controls the affected edge, including road turns. It does not cover the HUD. Per the explicit request for moving light, reduced mode also glimmers, more slowly at lower intensity; pause still freezes the active-time clock. The OS preference itself is unchanged.

## Browser evidence and self review

Real in-app browser, `p62-water-baseline`, seed 7. Actual Start, pause and resume used. [Water without streaks](evidence/p10-soft-water/water-no-streaks.png) shows the water around 84 m: the white repeated bands and bars are gone, water stays opaque, and droplets remain visible. [Motion recording](evidence/p10-soft-water/water-bloom.webp) contains actual screenshots at measured variable intervals, not native video or a 60-FPS recording; `recording.json` records actual dimensions and duration. No viewport override this round. Shader console-error query returned an empty list.

Two paused screenshots are pixel-identical. Actual capture size is 568×634; the animation has 174 frames over 6,948 ms. The browser had OS reduced motion active in the preceding check; the new glimmer deliberately retains slower motion in that path. This round does not claim a full normal/reduced, left/right-turn or device-performance matrix. The recording contains scenery motion as well as bloom; a still image alone does not prove the light modulation.

Game-designer self review: removing repeated bright stripes reduces a competing texture cue without changing the hazard's rules or boundaries. No balance proposal is applied.

UI/UX self review from the current capture: water coverage remains readable and the repeated white pattern is absent. Bloom is confined to the sun-facing edge and leaves warnings/resources in HTML outside the grade. Further art-quality judgment is for the owner; no independent review or final art approval is claimed.

## Validation / handoff

Windows, Node 24.22.1, pnpm 11.25.0. Actual final source results:

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `pnpm lint` | PASS, exit 0 |
| Typecheck | `pnpm typecheck` | PASS, exit 0 |
| Tests | `pnpm test --maxWorkers=2` | PASS, exit 0; 67 files / 397 tests, 98.83 s |
| Build | `pnpm build` | PASS, exit 0; 2.91 s; existing Three.js >500 kB chunk warning |
| Diff | `git diff --check` | PASS, line-ending notices only |

Existing animated-water replay, footprint/LOD coverage and lifecycle tests remain relevant. This reversible material edit does not add tests that merely assert shader wording.

Human review pending. Merge not performed. Remote PR/CI status must be reported from actual results.
