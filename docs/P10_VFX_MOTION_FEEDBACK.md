# P10 — Motion and visibility feedback, 28 October 2026

Branch `codex/vfx-motion-feedback`, based on the unmerged visual dependency `d5f3490` (`codex/vfx-road-readability`). This is a follow-up to the actual player's feedback, not a gameplay/balance feature. Remote was fetched before branching; the existing visual dependency is intentionally preserved rather than presented as updated main. No merge.

## Problem and resulting behavior

The renderer previously passed time **0** to rain, water and wind whenever either the checkbox or OS reduced-motion preference was active. The current browser reports `prefers-reduced-motion: reduce = true` while the checkbox is unchecked. That explains the player's suspended rain/wind. Weather now advances on active simulation time in every density mode and freezes only with gameplay pause. Reduced mode had also multiplied particle density by .3 AND emission frequency by .4 (about 12% overall); it now reduces count once. Wind is brighter and reduced density retains 14 moving ribbons.

Water droplets are larger, brighter, thrown outward from wheel contact and live longer. Smoke rises higher, expands and fades through a per-instance shader alpha instead of remaining an opaque polygon. Contact events retain bounded storage and deduplication. The shared pool remains capped at 192 particles, with no simulation RNG.

Nitro has a continuous procedural flame attached to the actual exhaust socket, blue/cyan with a warm tip, plus detached flame/smoke particles. Those particles inherit part of vehicle velocity so the entire effect does not disappear far behind a fast vehicle. The fallback rear socket supports the tricycle. Expiry, crash, ready/result and vehicle switch hide the attached flame.

The old power ring beneath the vehicle is removed. Star uses animated additive rim/sweep shading on a shell of the visible vehicle and rider meshes. It follows actual world transforms, steering, jump and visible model selection; no source geometry/material is replaced or disposed. Reduced mode slows the sweep. Existing fuel/HP HUD arcs remain: they are resource indicators, not the removed power ring.

Water now adds moving procedural sky bands and sun glints over the opaque basin, plus a more reflective physical finish. This is a stylized sky/light reflection shader, **not** a live mirror of arbitrary scene objects or SSR. Lane markings remain occluded. A four-neighbor thresholded bloom in the existing scene grade adds a subtle intermittent halo on the side facing the existing sun, recalculated relative to the camera during turns. HTML HUD is excluded. Reduced mode retains a much weaker constant halo without pulsation.

## Validation

Environment: Windows, Node 24.22.1, pnpm 11.25.0. Final source commands are logged locally as `vfx-feedback-verified-*.log`; those intermediate logs are ignored by Git. No gameplay/config/survival/world source is changed.

| Gate | Actual command | Result |
| --- | --- | --- |
| Lint | `pnpm lint` | PASS, exit 0 |
| Typecheck | `pnpm typecheck` | PASS, exit 0 |
| Tests | `pnpm test --maxWorkers=2` | PASS, exit 0; 67 files, 397 tests, 100.02 s |
| Production build | `pnpm build` | PASS, exit 0; 2.83 s; existing Three.js chunk >500 kB warning |
| Diff | `git diff --check` | PASS; line-ending notices only |

Added behavioral coverage: shell follows body/rider transforms and removes invisible sources without disposing original geometry; reduced sweep still advances and equal time holds; flame tracks a rotated moving exhaust and disappears when disabled; smoke inherits carrier velocity without mutating caller vectors and fades; reduced wind still moves and identical time freezes. Existing pool bounds, restart, retirement, event deduplication and water coverage tests remain.

## Actual browser checks and self review

Real in-app browser, seed 7. Actual captures are **422×750** despite the requested 540×960 viewport override. Do not relabel them. [Evidence](evidence/p10-feedback/) includes measured timing in `recordings.json`; WebP animations assemble real variable-interval screenshots, not native video or 60-FPS capture. Earlier local iteration frames are ignored. The bike/water recordings precede only the final normal-transform and sun-side correction; `car-final.webp` and `final-car.png` exercise the final source. Browser console error queries returned an empty list during water and final car shader use.

1. `p62-water-baseline`: actual Start input, normal cruise through the basin; moving reflective bands, opaque coverage and brighter droplets observed. `final-water.webp` / `final-water.png`.
2. Same fixture: actual key 2 nitro and key 1 star; the bike and rider both receive moving light and nitro flame/smoke is visible behind the bike. `bike-star-nitro.webp` / `final-star-nitro.png`. No under-vehicle power ring. Resource HUD arcs still visible as intended.
3. Actual pause and resume: star/nitro timers hold. Two saved paused screenshots separated by repeated browser captures are pixel-identical (`pausedFramesIdentical: true`). Space was sent after resume while nitro remained active; this round does not claim a separate measured jump-height check.
4. `p62-wind-left&fx=low`: actual Start input, rain and directional ribbons move at reduced density. The final brighter ribbon capture is `wind-final.webp` / `final-wind.png`. Actual Restart returns to ready, 0 m and fresh resources.
5. `vfx-state-check`: actual Start, 2 and 1; final shader compiles and the car changes animated rim/sweep color. Flame and smoke remain at the rear. `car-final.webp` / `final-car.png`; lower rear effects can partly overlap the resource/controls region at this camera size. Wreck-only plume readability across all vehicle types is not comprehensively revalidated.

Self review as game designer: this changes state readability, not power duration, immunity, damage, handling or balance. Rider/vehicle coverage and a continuous exhaust cue make the two items easier to distinguish. No balance proposal is being silently applied.

Self review as UI/UX designer: the fixed clock addresses the stationary-weather defect in the actual reduced-motion environment. Brighter wind remains separate from the direction HUD. Water bands retain visible hazard coverage. P2 follow-up: long-vehicle/crowded-scene shell cost and possible lower-screen plume/HUD overlap need broader device checks. No independent reviewer or final art approval is claimed.

Performance snapshot on final car source, with star and nitro active: 120 frames, 60.00 FPS, frame P95 16.8 ms, mean renderer CPU 8.12 ms, 1,019 draw calls, 34,077 triangles, 32 particles and 2 signals (`performance-car.json`). This is one browser sample under capture overhead, not a matched no-regression benchmark. The shell adds a draw for each visible source mesh only while star is active.

Limitations: no complete 540×960 pass; no normal-motion pulse observation because the browser's OS preference is reduced; no all-vehicle manual matrix, dense-scene benchmark or independent art acceptance. Reduced/static halo and shader compilation were exercised; do not claim the normal intermittent bloom has been manually observed. Existing simulation tests do not prove visual quality.

Human review: pending. CI/PR status must be taken from actual remote results. Merge: not performed.
