# P10 — VFX readability candidate

## Scope and revision

Branch: `codex/vfx-road-readability`. Visual base: `73bbfd1` (`codex/p9-road-contact-shadows`), deliberately retained as the requested visual dependency rather than claiming this is based on current main. This report accompanies the implementation commit. No merge is authorized or performed.

Water now has an opaque teal footprint above lane markings, slower broad ripples and subdued highlights. Decorative water is less saturated. Wind streaks are thinner, elevated and tapered. Wet road reflections and warm highlights are reduced while the cyan horizon remains.

A bounded instanced particle pool provides wheel spray, contact dust/sparks, body rain, damaged-engine smoke, brief wreck fire and boost exhaust. Events deduplicate; active simulation time freezes effects during pause; run changes, rewind and source retirement clear the appropriate effects. Rear/brake/committed-side indicator signals use catalog sockets, including single bike lamps. Cross traffic direction signals use existing warning distances. Existing shop lighting, banana/star and Grab presentation is reused. A persistent optional low-effects checkbox reduces decorative density and animation. No collider, damage, simulation timing, economy or balance changes are included. `vfx-state-check` is a DEV-only visual fixture.

## Automated validation

Windows, Node 24.22.1, pnpm 11.25.0. Commands executed on the final source tree before commit:

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `pnpm lint` | PASS, exit 0 |
| Types | `pnpm typecheck` | PASS, exit 0 |
| Tests | `pnpm test --maxWorkers=2` | PASS, exit 0; 65 files, 392 tests, 88.25 s |
| Production | `pnpm build` | PASS, exit 0; 2.70 s; existing Three.js chunk exceeds 500 kB warning |
| Diff | `git diff --check` | PASS; Windows line-ending notices only |

Tests protect pause/event deduplication, bounded storage, rewind/run reset, owner retirement, low-effects density, healthy fuel-stop versus damage/wreck effects, single/sided lamp selection and animated water coverage at both LODs. UI tests verify the checkbox calls the renderer and persists its setting. No no-op gates or simulation changes were used to obtain these results.

## Browser checks and evidence

Real in-app browser captures are under [evidence/p10-vfx](evidence/p10-vfx/). `recordings.json` records measured dimensions and durations. Animated WebP files assemble real screenshots at measured variable intervals: they are not native video or a 60-FPS recording. Raw frames/GIF intermediates are locally retained and ignored by Git.

| Scenario / seed | Observed result | Evidence / limits |
| --- | --- | --- |
| Water baseline / 17 | Opaque teal water covers lane paint; broad ripple motion remains readable | `water-seed17-before.png`, `water-seed17-after.png`, `water-realtime.webp`, `water-slow-2x.webp`; 540×960; captures precede the final neutral-lighting/lamp refinements |
| Water fast / 7 | Boost through water at 87.6 km/h; footprint remains opaque; spray subtle | `water-seed7-fast.png`, `water-seed7-fast-realtime.webp`; 422×750 |
| Wind left low / 17 | Sparse static accents, HUD arrow readable | `wind-left-low-realtime.webp`; 422×750 |
| Wind right normal / 17 | Elevated tapered moving accents; visible rightward displacement | `wind-right-realtime.webp`; 422×750 |
| City / 14 | Real progression through city/coastal scenery; neutral road reflections | `city-realtime.webp` and city PNGs; 422×750 |
| Junction / 14 | Before/after at approximately 743–744 m; warning and cross road readable | `junction-*-realtime.webp`, junction PNGs; 422×750 |
| DEV state fixture | Boost, star and jump activated using actual inputs; pause/resume exercised | `states-realtime.webp`; paused frames 125 and 135 are pixel-identical; 422×750 |
| Close wreck fixture | Healthy fuel-stopped and wrecked traffic presented separately | `wreck-close-realtime.webp`; rear-view smoke/fire contrast is NOT conclusively verified |
| Dense stress / 14 | Damage then train terminal result; actual restart restores a fresh run | `stress-realtime.webp`; 422×750 |

The browser viewport override stopped taking effect in later captures. Those files are honestly recorded as 422×750, not resized to imply a 540×960 pass. Full final-revision 540×960 coverage, all vehicle catalogs, OS reduced-motion toggle and quantitative cross-traffic lead-time checks remain unverified. Later lamp/event-key fixes have automated coverage but no additional final-pixel browser capture. Pool retirement has unit coverage; every source-retirement combination has not been manually exercised.

## Performance observations

Inventory: i7-11700F and GTX 1050 Ti; this does not verify the browser's actual graphics backend. `performance-before.json` uses the same visual base with diagnostic-only instrumentation; `performance-after-initial.json` is preliminary. Water samples around 29–114 m show frame P95 16.8 ms in both; effect draw cost is approximately 2–3 calls. Warmup and sample distances differ, so this is not proof of an FPS improvement or a matched final benchmark.

Dense stress sample: 52.17 FPS, frame P95 33.3 ms, renderer CPU 18.06 ms, 2,636 draw calls, 137,743 triangles, 68 particles and 51 signals. There is no matched baseline stress sample. Browser capture overhead is present. A no-regression performance gate is therefore OPEN.

## Self review, not independent approval

Game-design observation: warnings and state effects use existing simulation facts; no new difficulty or RNG is introduced. Opinion/proposal: check dense-scene clutter with normal and low effects on the same seed before raising effect density. Do not change balance to compensate for visual clutter.

UI/UX observation: actual pause freezes presentation, the low-effects preference works in tests, and water no longer exposes lane paint. P1 follow-up: verify smoke/fire contrast from the playable camera and all vehicle sockets. P1: complete matched final viewport/performance checks. P2: compare direction cue readability during overlapping hazards. These findings are based on the captures above and automated tests, not an independent designer review.

Provisional self-assessment of the captured candidate (10-point scale): silhouette/readability 7; contrast 7; palette/mood 7; shape language 7; lighting/weather/materials 7; UI/type 7; consistency 7; accessibility/performance 5 due to open measurements and viewport/OS checks. These are opinions with incomplete final-revision evidence. This candidate does NOT pass final art acceptance; averaging scores would not close a failed criterion.

## Handoff

Implementation and reproducible evidence are ready for review. CI and PR status must be reported from actual remote results after push. Human review: pending. Merge: not performed. The open visual/performance gates above must not be represented as passed by a successful build.
