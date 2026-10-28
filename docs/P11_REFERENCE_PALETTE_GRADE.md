# Reference teal / sand palette grade — 28 October 2026

Branch `codex/reference-teal-gold-grade`, visual dependency `21a3efe` (`codex/player-golden-brown-helmet`). Remote fetched before branching. Keeps the requested unmerged visual stack; not an updated-main claim. The owner explicitly supplied the palette reference and requested postprocessing as close as practical.

Reference: supplied image `86de0628603d6e6313a771e8bee913b4.jpg`, retained only locally as `docs/evidence/p11-palette/reference.jpg` and ignored by Git. The image is a visual palette source, not a gameplay requirement or an instruction to reproduce its scene. Upload of the original reference was blocked by automatic approval review because permission to publish that image had not been given; it is excluded from the push. The read-only evidence analysis script requires that local reference copy; derived palette clusters are included in `analysis.json`.

## Change

Only `src/art/storm-post.ts` changes. The existing scene-grade pass now separates luminance and hue ranges: deep teal shade, saturated restrained turquoise in sky/water, muted olive foliage, sandy cream light and warmer earth/brick. Cyan is masked out of most of the gold wheel so water does not turn muddy green. The earlier first adjustment was too gray/green, so the final grade restores the reference's stronger teal while warming neutral light.

No scene/material reauthoring, asset geometry, water detail/reflection parameters, helmet base color, lighting layout, gameplay, simulation or balance changes. No new postprocessing pass, texture lookup or bloom timer; existing directional glimmer remains. HTML HUD/resources/warnings are outside the scene grade.

## Current browser evidence and self review

Real in-app browser, actual Start and item/pause inputs. Full captures are 1000×563 with the portrait game centered; do not label them as 540×960. Native clip attempts produced incomplete views and are rejected/ignored. The packaged full screenshots are unmodified. `analysis.json` contains dimensions, reference color clusters and the actual pause-image equality result. Color clusters are not a perceptual match score.

1. `p62-water-baseline`, seed 7: [before](evidence/p11-palette/water-before.png) and [final after](evidence/p11-palette/water-after.png), both approximately 69–70 m, same viewport/seed. New sky/water lean toward the reference teal, retaining reflected light and small facet scale. Captures are from separate real runs; minor timing/particle/bloom variation means this is not a pixel-perfect state comparison.
2. `handling-car4`, seed 14: [final city at about 20 m](evidence/p11-palette/city-final.png). Earth/cream facades and muted foliage remain distinct against dark teal road shade. No matching before-city capture is claimed.
3. [Star/nitro after grade](evidence/p11-palette/powers-after.png), seed 7: actual keys 1 and 2 activate both items; the vehicle/rider shell and rear exhaust remain visible. The grade intentionally changes scene effect hues too; state text remains independent.
4. Actual pause then resume; the two paused screenshots are pixel-identical. Browser shader error queries in the final water/city checks returned no entries. This round does not claim an all-hazard, failure, OS-mode or device matrix.

Game-designer self review: this changes visual mood, not rules or player pressure. No balance proposal is silently applied. UI/UX self review from these current images: lane lines, warning icon, rider and resource arcs remain legible; white HUD text stays separate from teal/gold grading. In dense scenes, stronger teal separation still needs broader readability checks before final art approval.

The reference has different camera, architecture, composition and light distribution. A global scene grade cannot reproduce those relationships exactly. This is a palette approximation judged by Codex from the supplied image and real captures, not an independent art-director approval or a claim of a percentage match.

Performance sample at about 28/56 m: 60 FPS, frame P95 16.7 ms, mean renderer CPU 8.91/9.38 ms, unchanged sample draw calls 861/839 and triangles 41,148/41,938. Multiple browser scenes and tests were active; this is not a matched no-regression benchmark.

## Validation / handoff

Windows / Node 24.22.1 / pnpm 11.25.0. `pnpm lint` PASS exit 0; `pnpm typecheck` PASS exit 0; `pnpm test --maxWorkers=2` PASS exit 0, 68 files / 400 tests, 111.84 s; `pnpm build` PASS exit 0, 3.33 s, existing Three.js >500 kB warning. `git diff --check` checked before commit. No shader-text/constant-mirroring tests were added for this reversible aesthetic adjustment.

Human review pending. No merge. PR creation remains unavailable under the previously observed integration HTTP 403; local gates do not certify remote CI.
