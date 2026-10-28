# Water reflection restoration — 28 October 2026

Branch `codex/water-reflection-depth`, visual dependency `3f25315` (`codex/water-soft-reflection-bloom`). Remote fetched before branching; preserves the requested unmerged visual dependency, not a claim of an updated-main base. Player feedback: removing fake streaks also removed too much reflective response.

The water now explicitly references the existing scene sky environment with its own material reflection intensity. Three.js otherwise replaces material environment intensity with the scene's .035 value when relying on the implicit scene environment (verified in the installed renderer source). That global setting deliberately keeps buildings/asphalt subdued. It remains unchanged. Water has lower roughness, stronger specular/clearcoat response, water IOR and moderate moving normals. Reuses the existing sky texture: no extra reflection render pass, no arbitrary object mirrors/SSR, and no repeated white bands or bar meshes are reintroduced. Bloom and gameplay remain unchanged.

Added a resource-lifetime regression test: water binds the shared environment, pothole does not, and retiring either hazard does not dispose the scene's sky. Existing time replay, LOD/footprint and lane occlusion checks remain.

## Actual manual observation and self review

Real in-app browser, `p62-water-baseline`, seed 7, actual Start/pause/resume. [Current screenshot](evidence/p10-water-reflection/water-reflection.png) around 71 m shows a brighter broad sky-reflection response with opaque teal coverage and no repeated white streaks. [Motion](evidence/p10-water-reflection/water-reflection.webp) has 164 real variable-interval screenshots, 568×634, 6,120 ms; not a 60-FPS video. Shader console-error query returned no entries. The two saved paused screenshots are pixel-identical.

Game-designer self review: presentation only; no change to water's fuel/slowdown, boundaries, simulation RNG or power items. UI/UX self review: reflective response is more legible against the asphalt; HTML warnings/resources remain independent. Surface still uses the existing low-poly faceted palette; reflection is sky/environment, not building/vehicle mirroring. These are Codex observations and opinions from this run, not independent art approval. No all-device or matched performance regression claim. No 540×960 override this round.

## Gates and handoff

Windows, Node 24.22.1, pnpm 11.25.0. Actual final source results:

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `pnpm lint` | PASS, exit 0 |
| Typecheck | `pnpm typecheck` | PASS, exit 0 |
| Tests | `pnpm test --maxWorkers=2` | PASS, exit 0; 67 files / 398 tests, 97.09 s |
| Build | `pnpm build` | PASS, exit 0; 2.73 s; existing Three.js >500 kB chunk warning |
| Diff | `git diff --check` | PASS; line-ending notices only |

Human review pending. Merge not performed. PR not created: the connected integration returned HTTP 403 on the preceding branch and no permission change is known; no repeated creation attempt is claimed here. CI is not certified by local checks.
